import { createContext, useContext } from 'react';
import type { KeepAliveContextValue } from './types';

export const KeepAliveContext = createContext<KeepAliveContextValue | null>(null);

/**
 * 获取 KeepAlive 上下文。
 * 必须在 <KeepAliveScope> 内部使用，否则抛出错误。
 */
export function useKeepAliveContextInternal(): KeepAliveContextValue {
  const ctx = useContext(KeepAliveContext);
  if (!ctx) {
    throw new Error(
      '[react-keep-alive] useKeepAliveContext / KeepAlive 必须在 <KeepAliveScope> 内部使用。'
    );
  }
  return ctx;
}
