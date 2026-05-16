import { useCallback } from 'react';
import { useKeepAliveContextInternal } from '../KeepAliveContext';

export interface KeepAliveControls {
  /**
   * 销毁指定 key 的缓存（下次渲染时重新挂载）。
   * 不传参时销毁所有缓存。
   */
  drop: (key?: string) => void;
  /**
   * 刷新缓存：先销毁再重建。
   * 等同于 drop(key)，触发后下次渲染该 key 的组件将重新挂载。
   */
  refresh: (key: string) => void;
  /** 获取当前所有缓存的 key 列表 */
  getCacheKeys: () => string[];
  /** 当前激活的 cacheKey（正在显示的组件） */
  activeKey: string | null;
}

/**
 * useKeepAliveContext
 *
 * 获取 KeepAlive 缓存控制方法，用于手动管理缓存。
 * 必须在 <KeepAliveScope> 内部使用。
 *
 * @example
 * function AdminPanel() {
 *   const { drop, getCacheKeys, activeKey } = useKeepAliveContext();
 *
 *   return (
 *     <button onClick={() => drop()}>清空所有缓存</button>
 *   );
 * }
 */
export function useKeepAliveContext(): KeepAliveControls {
  const { drop, refresh, getCacheKeys, activeKey } = useKeepAliveContextInternal();

  const stableDrop = useCallback(drop, [drop]);
  const stableRefresh = useCallback(refresh, [refresh]);
  const stableGetCacheKeys = useCallback(getCacheKeys, [getCacheKeys]);

  return {
    drop: stableDrop,
    refresh: stableRefresh,
    getCacheKeys: stableGetCacheKeys,
    activeKey,
  };
}
