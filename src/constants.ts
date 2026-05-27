import React from 'react';

/**
 * KeepAlive 缓存状态常量
 */
export const CACHE_STATUS = {
  /** 激活状态，正挂载在页面占位容器中展示 */
  ACTIVE: 'active',
  /** 停用/休眠状态，存放在隐藏的 cacheRoot 根节点中 */
  INACTIVE: 'inactive',
  /** 初始化状态，缓存项刚刚创建，尚未渲染/挂载完成 */
  INIT: 'init',
} as const;

export type CacheStatus = typeof CACHE_STATUS[keyof typeof CACHE_STATUS];

/**
 * 路由上下文不存在时的安全降级占位上下文
 */
export const dummyContext = React.createContext<any>(null);
