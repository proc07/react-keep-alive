import type { ReactNode, ReactElement } from 'react';

// ─── Cache ────────────────────────────────────────────────────────────────────

export type CacheStatus = 'active' | 'inactive';
export type EvictionStrategy = 'LRU' | 'FIFO';

export interface CacheEntry {
  key: string;
  element: ReactElement;
  container: HTMLDivElement;
  status: CacheStatus;
  lastActiveTime: number;
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
  /** cacheKey → 'active' | 'inactive' | 'init'，驱动 Portal children 重新渲染 */
  statusMap: Map<string, 'active' | 'inactive' | 'init'>;
  setStatusMap: React.Dispatch<React.SetStateAction<Map<string, 'active' | 'inactive' | 'init'>>>;
}
