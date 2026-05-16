import { createContext, useContext } from 'react';

/**
 * Per-KeepAlive 实例上下文
 * 每个 <KeepAlive cacheKey="..."> 的 children 都会收到这个 context，
 * 向内部子组件暴露 cacheKey 和当前激活状态。
 */
export interface KeepAliveItemContextValue {
  cacheKey: string;
  /** 当前缓存状态（active = 显示, inactive = 已缓存隐藏, init = 首次挂载） */
  activeStatus: 'active' | 'inactive' | 'init';
}

export const KeepAliveItemContext =
  createContext<KeepAliveItemContextValue | null>(null);

export function useKeepAliveItemContext(): KeepAliveItemContextValue {
  const ctx = useContext(KeepAliveItemContext);
  if (!ctx) {
    throw new Error(
      '[react-keep-alive] useActivated / useDeactivated 必须在 <KeepAlive> 内部使用。'
    );
  }
  return ctx;
}
