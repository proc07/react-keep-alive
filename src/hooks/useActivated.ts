import { useRef, useEffect, useLayoutEffect } from 'react';
import { useKeepAliveItemContext } from '../KeepAliveItemContext';
import { keepAliveEventBus } from '../eventBus';
import { CACHE_STATUS } from '../constants';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useActivated(callback: () => void): void {
  const { cacheKey } = useKeepAliveItemContext();
  const callbackRef = useRef(callback);
  
  // 追踪组件是否已经完成了初次真实挂载。
  // 因为 Suspense 挂起会导致 layout effect 被清理，在恢复（unsuspend）时重新执行。
  const isMountedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useIsomorphicLayoutEffect(() => {
    if (!isMountedRef.current) {
      // 首次载入时不需要触发 useActivated，将其标为已挂载即可
      isMountedRef.current = true;
    } else {
      // 如果不是首次挂载，意味着这是从 Suspense 的“挂起/冻结”状态恢复（解冻）。
      // 此时因为激活事件已经在子组件解冻挂载前派发了，子组件错过了事件，所以这里需要手动执行一次激活回调。
      callbackRef.current();
    }

    // 订阅事件总线的 active 激活信号
    const unsubscribe = keepAliveEventBus.subscribe(cacheKey, (status) => {
      if (status === CACHE_STATUS.ACTIVE) {
        callbackRef.current();
      }
    });
    return unsubscribe;
  }, [cacheKey]);
}

