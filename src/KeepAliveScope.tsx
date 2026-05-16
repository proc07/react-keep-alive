import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { KeepAliveContext } from './KeepAliveContext';
import { KeepAliveItemContext } from './KeepAliveItemContext';
import type {
  CacheEntry,
  EvictionStrategy,
  KeepAliveScopeProps,
  KeepAliveContextValue,
} from './types';

export function KeepAliveScope({
  children,
  max = 10,
  strategy = 'LRU',
}: KeepAliveScopeProps): React.ReactElement {
  const cacheRootRef = useRef<HTMLDivElement | null>(null);
  const [caches, setCaches] = useState<Map<string, CacheEntry>>(() => new Map());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // statusMap 驱动 Portal children 重新渲染，从而触发 useActivated/useDeactivated
  const [statusMap, setStatusMap] = useState<Map<string, 'active' | 'inactive' | 'init'>>(
    () => new Map()
  );

  // ── Cache control ───────────────────────────────────────────────────────
  const drop = useCallback((key?: string) => {
    setCaches((prev) => {
      const next = new Map(prev);
      if (key === undefined) {
        next.forEach((entry) => entry.container.parentNode?.removeChild(entry.container));
        next.clear();
      } else {
        const entry = next.get(key);
        if (entry) {
          entry.container.parentNode?.removeChild(entry.container);
          next.delete(key);
        }
      }
      return next;
    });
    setStatusMap((prev) => {
      if (key === undefined) return new Map();
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const refresh = useCallback((key: string) => { drop(key); }, [drop]);

  const getCacheKeys = useCallback((): string[] => {
    return Array.from(caches.keys());
  }, [caches]);

  // ── 当缓存增长超过最大值时进行淘汰（清除旧缓存） ───────────────────────────────
  useEffect(() => {
    if (caches.size <= max) return;
    setCaches((prev) => {
      const next = new Map(prev);
      const candidates = Array.from(next.values())
        .filter((e) => e.status === 'inactive')
        .sort((a, b) =>
          strategy === 'LRU'
            ? a.lastActiveTime - b.lastActiveTime
            : a.createdTime - b.createdTime
        );
      let overflow = next.size - max;
      for (const entry of candidates) {
        if (overflow <= 0) break;
        entry.container.parentNode?.removeChild(entry.container);
        next.delete(entry.key);
        overflow--;
      }
      return next;
    });
  }, [caches.size, max, strategy]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      setCaches((prev) => {
        prev.forEach((entry) => entry.container.parentNode?.removeChild(entry.container));
        return new Map();
      });
    };
  }, []);

  // ── Context value ───────────────────────────────────────────────────────
  const contextValue = useMemo<KeepAliveContextValue>(
    () => ({
      cacheRootRef,
      caches,
      setCaches,
      max,
      strategy,
      drop,
      getCacheKeys,
      refresh,
      activeKey,
      setActiveKey,
      statusMap,
      setStatusMap,
    }),
    [caches, max, strategy, drop, getCacheKeys, refresh, activeKey, statusMap]
  );
  console.log(caches, 'caches')
  return (
    <KeepAliveContext.Provider value={contextValue}>
      {children}
      {/* 隐藏缓存根节点，非激活的 container 移入这里。
          Portal 让 React Fiber 树保持存活，缓存的组件状态不丢失。 */}
      <div
        ref={cacheRootRef}
        style={{ display: 'none' }}
        aria-hidden="true"
        data-keep-alive-root="true"
      >
        {Array.from(caches.values()).map((entry) =>
          createPortal(
            // 每次渲染时从 statusMap 计算最新的 Provider value，
            // 子组件始终具有最新的 activeStatus。
            <KeepAliveItemContext.Provider
              value={{
                cacheKey: entry.key,
                activeStatus: statusMap.get(entry.key) ?? 'init',
              }}
            >
              {entry.element}
            </KeepAliveItemContext.Provider>,
            entry.container,
            entry.key
          )
        )}
      </div>
    </KeepAliveContext.Provider>
  );
}
