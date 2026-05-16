import { useRef, useEffect, useLayoutEffect } from 'react';
import { useKeepAliveItemContext } from '../KeepAliveItemContext';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useDeactivated(callback: () => void): void {
  const { activeStatus } = useKeepAliveItemContext();
  const prevStatus = useRef<string>('init');

  useIsomorphicLayoutEffect(() => {
    // 仅在 active → inactive 转换时触发
    if (activeStatus === 'inactive' && prevStatus.current === 'active') {
      callback();
    }
    prevStatus.current = activeStatus;
  }, [activeStatus, callback]);
}
