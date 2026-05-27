import type { ReactNode, ReactElement } from 'react';
import type { CacheStatus } from './constants';

export type { CacheStatus };

// ─── Cache ────────────────────────────────────────────────────────────────────

export type EvictionStrategy = 'LRU' | 'FIFO';

export interface CacheEntry {
  /**
   * 缓存项的唯一标识符（Key）。
   * 通常对应路由路径（pathname）或组件自定义传入的 cacheKey。
   */
  key: string;
  /**
   * 缓存的 React 虚拟 DOM 节点（JSX Element）。
   * 每次 KeepAlive 重新渲染时，会同步更新为最新的 children 引用，以确保能够接收到最新的 props。
   */
  element: ReactElement;
  /**
   * 缓存的真实 DOM 容器节点（div）。
   * 组件激活时，该 container 会被移入占位 placeholder 容器中；
   * 组件停用时，该 container 会被移入隐藏的 cacheRoot 容器中，以保持 React Fiber 树存活并保留状态。
   */
  container: HTMLDivElement;
  /**
   * 缓存条目的当前激活状态。
   * - 'active': 处于活跃状态，正挂载在页面占位容器中展示。
   * - 'inactive': 处于停用（休眠）状态，正存放在隐藏的 cacheRoot 根节点中。
   */
  status: CacheStatus;
  /**
   * 上一次被激活的时间戳（毫秒数）。
   * 当缓存数超过 max 限制且使用 LRU（最近最少使用）淘汰策略时，系统会优先淘汰 lastActiveTime 最小的 entry。
   */
  lastActiveTime: number;
  /**
   * 缓存条目被首次创建的时间戳（毫秒数）。
   * 当缓存数超过 max 限制且使用 FIFO（先进先出）淘汰策略时，系统会优先淘汰 createdTime 最小的 entry。
   * 同时也用于 React Fragment 的 key，以在缓存被强制刷新（refresh/drop）时能够彻底重置组件状态。
   */
  createdTime: number;
}

// ─── KeepAliveScope ───────────────────────────────────────────────────────────

export interface KeepAliveScopeProps {
  children: ReactNode;
  max?: number;
  strategy?: EvictionStrategy;
}

// ─── KeepAlive ────────────────────────────────────────────────────────────────

export interface KeepAliveProps {
  children: ReactNode;
  cacheKey: string;
  include?: string[] | RegExp;
  exclude?: string[] | RegExp;
  onActivated?: () => void;
  onDeactivated?: () => void;
  /**
   * 是否自动保存/恢复滚动位置。
   * - `true`（默认）：停用时自动记录容器内所有滚动节点的位置，激活时恢复。
   * - `false`：不处理滚动位置。
   */
  scrollRestore?: boolean;
}

// ─── Context (scope-level) ────────────────────────────────────────────────────

export interface KeepAliveContextValue {
  cacheRootRef: React.RefObject<HTMLDivElement | null>;
  caches: Map<string, CacheEntry>;
  setCaches: React.Dispatch<React.SetStateAction<Map<string, CacheEntry>>>;
  max: number;
  strategy: EvictionStrategy;
  drop: (key?: string) => void;
  getCacheKeys: () => string[];
  refresh: (key: string) => void;
  activeKey: string | null;
  setActiveKey: React.Dispatch<React.SetStateAction<string | null>>;
  activeKeyRef: React.MutableRefObject<{ key: string; location: any } | null>;
  /** cacheKey → CacheStatus，驱动 Portal children 重新渲染 */
  statusMap: Map<string, CacheStatus>;
  setStatusMap: React.Dispatch<React.SetStateAction<Map<string, CacheStatus>>>;
}
