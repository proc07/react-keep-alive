import React, { createContext, useContext } from 'react';
import { useLocation, useOutlet, useMatches } from 'react-router-dom';
import { KeepAlive } from '../KeepAlive';

// 创建一个深度上下文，用来记录当前 Outlet 处于第几层嵌套
const RouteDepthContext = createContext(0);

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
  const matches = useMatches();
  const depth = useContext(RouteDepthContext);

  if (!outlet) return null;

  // 获取当前 Outlet 马上要渲染的子路由匹配项
  console.log(matches, depth)
  const childMatch = matches[depth + 1];
  const childHandle = childMatch?.handle as { isKeepalive?: boolean } | undefined;
  const isKeepalive = childHandle?.isKeepalive ?? false;

  const key = cacheKey
    ? cacheKey(location.pathname, location.search)
    : location.pathname;

  const content = isKeepalive ? (
    <KeepAlive
      cacheKey={key}
      include={include}
      exclude={exclude}
      onActivated={() => onActivated?.(key)}
      onDeactivated={() => onDeactivated?.(key)}
    >
      {outlet}
    </KeepAlive>
  ) : (
    outlet
  );

  return (
    <RouteDepthContext.Provider value={depth + 1}>
      {content}
    </RouteDepthContext.Provider>
  );
}
