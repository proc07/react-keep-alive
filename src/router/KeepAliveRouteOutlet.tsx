import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { KeepAlive } from '../KeepAlive';

export interface KeepAliveRouteOutletProps {
  /**
   * 自定义缓存 key 生成函数，默认使用 location.pathname
   */
  cacheKey?: (pathname: string, search: string) => string;
  /**
   * 白名单：只缓存匹配的路径（字符串数组或正则）
   */
  include?: string[] | RegExp;
  /**
   * 黑名单：排除匹配路径（字符串数组或正则）
   */
  exclude?: string[] | RegExp;
  /** 路由激活时触发 */
  onActivated?: (key: string) => void;
  /** 路由停用时触发 */
  onDeactivated?: (key: string) => void;
}

export function KeepAliveRouteOutlet({
  cacheKey,
  include,
  exclude,
  onActivated,
  onDeactivated,
}: KeepAliveRouteOutletProps): React.ReactElement | null {
  const location = useLocation();
  const outlet = useOutlet();

  const key = cacheKey
    ? cacheKey(location.pathname, location.search)
    : location.pathname;

  if (!outlet) return null;

  return (
    <KeepAlive
      cacheKey={key}
      include={include}
      exclude={exclude}
      onActivated={() => onActivated?.(key)}
      onDeactivated={() => onDeactivated?.(key)}
    >
      {outlet}
    </KeepAlive>
  );
}
