import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useContext,
  Suspense,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from 'react-router-dom';
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
  const activeKeyRef = useRef<{ key: string; location: any } | null>(null);
  // Reset activeKeyRef on every render of KeepAliveScope
  activeKeyRef.current = null;

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
      activeKeyRef,
      statusMap,
      setStatusMap,
    }),
    [caches, max, strategy, drop, getCacheKeys, refresh, activeKey, statusMap]
  );

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
        {Array.from(caches.values()).map((entry) => {
          const status = statusMap.get(entry.key) || 'init';
          return createPortal(
            <KeepAliveItemProvider
              cacheKey={entry.key}
              activeStatus={status}
            >
              {entry.element}
            </KeepAliveItemProvider>,
            entry.container,
            entry.key
          );
        })}
      </div>
    </KeepAliveContext.Provider>
  );
}

// ─── Memoized Provider Wrapper ────────────────────────────────────────────────
// 当组件处于 inactive 状态时，直接返回上一次缓存的 JSX 引用。
// React 发现返回的 element 引用未变，会跳过整个子树的 reconciliation，
// 从而彻底阻止 context 变化（如 location / KeepAliveContext）向下传播。
// 同时，在这里包装路由 Context Provider，用来拦截外部路由变化对非活动组件的穿透渲染。
const dummyContext = React.createContext<any>(null);

interface KeepAliveItemProviderProps {
  cacheKey: string;
  activeStatus: 'active' | 'inactive' | 'init';
  children: React.ReactNode;
}

const KeepAliveItemProvider = React.memo(({
  cacheKey,
  activeStatus,
  children,
}: KeepAliveItemProviderProps) => {
  const currentKeepAlive = useContext(KeepAliveContext);

  // 1. 获取 React Router 的 Context（如果不存在则退回到 dummyContext 避免崩溃）
  const locCtx = UNSAFE_LocationContext || dummyContext;
  const navCtx = UNSAFE_NavigationContext || dummyContext;
  const routeCtx = UNSAFE_RouteContext || dummyContext;

  const currentLoc = useContext(locCtx);
  const currentNav = useContext(navCtx);
  const currentRoute = useContext(routeCtx);

  // 2. 存储完整的渲染输出。当组件处于非激活状态时，直接返回相同的引用，以触发 React 的 Bailout（跳过协调）
  const renderedRef = useRef<React.ReactElement | null>(null);

  // 3. 根据全局 KeepAlive 状态判断当前缓存项是否处于激活状态
  const activeKeyRef = currentKeepAlive?.activeKeyRef;
  const isActive = activeKeyRef
    ? (activeKeyRef.current !== null &&
       activeKeyRef.current.key === cacheKey &&
       (!activeKeyRef.current.location || activeKeyRef.current.location === currentLoc?.location))
    : (activeStatus === 'active' || activeStatus === 'init');

  const itemCtxValue = useMemo(
    () => ({ cacheKey }),
    [cacheKey]
  );

  // 4. 关键：仅在组件激活（Active）或首次渲染时重新构建子树并更新缓存引用。
  // 在非激活（Inactive）状态下，不重新构建，直接复用上一次的元素引用。
  // 这会诱导局部 Provider 在比对 value 时发现引用未变，从而协助 React 判定无需向下协调。
  if (isActive || !renderedRef.current) {
    let content: React.ReactNode = children;

    // 局部代理路由及 KeepAlive 上下文，起到“屏蔽罩”作用，防止最外层 Context 的变更直接穿透渲染后台组件
    if (UNSAFE_NavigationContext) {
      content = (
        <UNSAFE_NavigationContext.Provider value={currentNav}>
          {content}
        </UNSAFE_NavigationContext.Provider>
      );
    }

    if (UNSAFE_RouteContext) {
      content = (
        <UNSAFE_RouteContext.Provider value={currentRoute}>
          {content}
        </UNSAFE_RouteContext.Provider>
      );
    }

    if (UNSAFE_LocationContext) {
      content = (
        <UNSAFE_LocationContext.Provider value={currentLoc}>
          {content}
        </UNSAFE_LocationContext.Provider>
      );
    }

    content = (
      <KeepAliveContext.Provider value={currentKeepAlive}>
        {content}
      </KeepAliveContext.Provider>
    );

    renderedRef.current = (
      <KeepAliveItemContext.Provider value={itemCtxValue}>
        {content}
      </KeepAliveItemContext.Provider>
    );
  }

  // 5. 结合 React Suspense 实现“冻结”机制：
  // 非激活状态时，Suspender 抛出 unresolved promise 挂起当前子树，彻底阻止 React 19 任何形式的后台重绘。
  // 激活后，Promise 被 resolve，React 恢复并正常渲染子树。
  return (
    <Suspense fallback={null}>
      <Suspender freeze={!isActive}>
        {renderedRef.current}
      </Suspender>
    </Suspense>
  );
});

KeepAliveItemProvider.displayName = 'KeepAliveItemProvider';

interface SuspenderProps {
  freeze: boolean;
  children: React.ReactNode;
}

// ─── Suspender 子树冻结辅助组件 ──────────────────────────────────────────────────
// 利用 React Suspense 机制，在子树不需要渲染时（freeze = true）通过抛出 Promise 强制挂起子树，
// 从而从根本上截断 React 对该子树的 Fiber 节点遍历与 Context 依赖更新。
function Suspender({ freeze, children }: SuspenderProps) {
  const promiseRef = useRef<Promise<void> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  if (freeze) {
    // 处于冻结状态：如果 Promise 还未创建，则新建一个 pending（挂起）状态的 Promise 并 throw
    if (!promiseRef.current) {
      promiseRef.current = new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      });
    }
    throw promiseRef.current;
  }

  // 恢复状态：如果之前有 pending 的 Promise，则 resolve 它并清理引用，促使 Suspense 恢复正常渲染
  if (promiseRef.current && resolveRef.current) {
    resolveRef.current();
    promiseRef.current = null;
    resolveRef.current = null;
  }

  return <>{children}</>;
}
