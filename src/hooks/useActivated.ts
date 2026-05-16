import { useRef, useEffect, useLayoutEffect } from 'react';
import { useKeepAliveItemContext } from '../KeepAliveItemContext';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useActivated(callback: () => void): void {
  const { activeStatus } = useKeepAliveItemContext();
  const prevStatus = useRef<string>('init');

  useIsomorphicLayoutEffect(() => {
    // 仅在 inactive → active 转换时触发（首次挂载不触发）
    if (activeStatus === 'active' && prevStatus.current === 'inactive') {
      callback();
    }
    prevStatus.current = activeStatus;
  }, [activeStatus, callback]);
}
