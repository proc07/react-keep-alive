import { useRef, useEffect, useLayoutEffect } from 'react';
import { useKeepAliveItemContext } from '../KeepAliveItemContext';
import { keepAliveEventBus } from '../eventBus';
import { CACHE_STATUS } from '../constants';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useDeactivated(callback: () => void): void {
  const { cacheKey } = useKeepAliveItemContext();
  const callbackRef = useRef(callback);

  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useIsomorphicLayoutEffect(() => {
    const unsubscribe = keepAliveEventBus.subscribe(cacheKey, (status) => {
      if (status === CACHE_STATUS.INACTIVE) {
        callbackRef.current();
      }
    });
    return unsubscribe;
  }, [cacheKey]);
}

