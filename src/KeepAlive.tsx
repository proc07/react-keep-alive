import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useKeepAliveContextInternal } from './KeepAliveContext';
import { KeepAliveItemContext } from './KeepAliveItemContext';
import { setupScrollTracker, saveScrollState, restoreScrollState } from './scroll';
import type { KeepAliveProps, CacheEntry } from './types';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function matchesFilter(key: string, filter: string[] | RegExp | undefined): boolean {
  if (!filter) return false;
  if (Array.isArray(filter)) return filter.includes(key);
  return filter.test(key);
}

export function KeepAlive({
  children,
  cacheKey,
  include,
  exclude,
  onActivated,
  onDeactivated,
  scrollRestore = true,
}: KeepAliveProps): ReactElement {
  const {
    cacheRootRef,
    caches,
    setCaches,
    setActiveKey,
    setStatusMap,
  } = useKeepAliveContextInternal();

  const placeholderRef = useRef<HTMLDivElement>(null);
  // 用 ref 存储 container，避免 cleanup 闭包中的 stale closure 问题
  const containerRef = useRef<HTMLDivElement | null>(null);

  const shouldCache = useCallback((): boolean => {
    if (matchesFilter(cacheKey, exclude)) return false;
    if (include !== undefined) return matchesFilter(cacheKey, include);
    return true;
  }, [cacheKey, include, exclude]);

  // ── 挂载 / 命中缓存 ──────────────────────────────────────────────────────
  useIsomorphicLayoutEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder) return;

    if (!shouldCache()) {
      setCaches((prev) => {
        const next = new Map(prev);
        const entry = next.get(cacheKey);
        if (entry) {
          entry.container.parentNode?.removeChild(entry.container);
          next.delete(cacheKey);
        }
        return next;
      });
      setActiveKey(null);
      return;
    }

    const existingEntry = caches.get(cacheKey);

    if (existingEntry) {
      // ── 命中缓存：将 container 从 cacheRoot 移回 placeholder ────────────
      const container = existingEntry.container;
      containerRef.current = container;
      if (container.parentNode !== placeholder) {
        placeholder.appendChild(container);
      }

      // ── 恢复滚动位置 ────────────────────────────────────────────────────────
      if (scrollRestore) {
        restoreScrollState(container);
      }

      setCaches((prev) => {
        const next = new Map(prev);
        const e = next.get(cacheKey);
        if (e) {
          e.status = 'active';
          e.lastActiveTime = Date.now();
          e.element = children as ReactElement;
        }
        return next;
      });
      setStatusMap((prev) => new Map(prev).set(cacheKey, 'active'));
      setActiveKey(cacheKey);
      onActivated?.();
    } else {
      // ── 首次挂载：在 placeholder 中创建新 container ─────────────────
      const container = document.createElement('div');
      container.setAttribute('data-keep-alive-key', cacheKey);
      container.style.cssText = 'height:100%;width:100%;';
      if (scrollRestore) setupScrollTracker(container);
      placeholder.appendChild(container);
      containerRef.current = container;

      const now = Date.now();
      const entry: CacheEntry = {
        key: cacheKey,
        element: children as ReactElement,
        container,
        status: 'active',
        lastActiveTime: now,
        createdTime: now,
      };
      setCaches((prev) => new Map(prev).set(cacheKey, entry));
      setStatusMap((prev) => new Map(prev).set(cacheKey, 'active'));
      setActiveKey(cacheKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  // ── 同步 entry.element 为最新的 children ─────────────────────────────────
  // 直接修改而非调用 setCaches，避免父组件读取 context 时触发无限重渲染循环。
  useIsomorphicLayoutEffect(() => {
    if (!shouldCache()) return;
    const entry = caches.get(cacheKey);
    if (entry) {
      entry.element = children as ReactElement;
    }
  });

  // ── 停用：组件卸载时 ──────────────────────────────────────────────────────
  useIsomorphicLayoutEffect(() => {
    return () => {
      if (!shouldCache()) return;
      // 使用 containerRef，避免闭包中 `caches` 过期导致的 stale closure 问题
      const container = containerRef.current;
      const cacheRoot = cacheRootRef.current;
      if (!container) return;

      // ── 保存滚动位置 (使用 WeakMap 规避 stale closure 问题) ────────────────
      if (scrollRestore) {
        saveScrollState(container);
      }

      // 将 container 移入隐藏的 cacheRoot（React Fiber 保持存活）
      if (cacheRoot && container.parentNode !== cacheRoot) {
        cacheRoot.appendChild(container);
      }

      setCaches((prev) => {
        const next = new Map(prev);
        const e = next.get(cacheKey);
        if (e) e.status = 'inactive';
        return next;
      });
      // 更新 statusMap，触发 Portal children 重新渲染，从而激活生命周期钩子
      setStatusMap((prev) => new Map(prev).set(cacheKey, 'inactive'));
      onDeactivated?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!shouldCache()) {
    return (
      <KeepAliveItemContext.Provider value={{ cacheKey, activeStatus: 'active' }}>
        <>{children as ReactNode}</>
      </KeepAliveItemContext.Provider>
    ) as ReactElement;
  }

  return (
    <div
      ref={placeholderRef}
      data-keep-alive-placeholder={cacheKey}
      style={{ height: '100%', width: '100%' }}
    />
  );
}
