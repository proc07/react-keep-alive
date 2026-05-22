import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const LEVEL1_LINKS = [
  { to: '/nested/dashboard', label: '📊 仪表盘', desc: 'Dashboard' },
  { to: '/nested/settings',  label: '⚙️ 设置中心', desc: 'Settings' },
];

/**
 * NestedLayout — 第一级嵌套路由 Layout
 *
 * 路由层级:
 *   /nested                    ← 本组件（Level 1 Layout）
 *     /nested/dashboard        ← Level 2 页面
 *     /nested/settings         ← Level 2 Layout（含 Outlet）
 *       /nested/settings/profile   ← Level 3 页面
 *       /nested/settings/security  ← Level 3 页面
 */
export default function NestedLayout() {
  const location = useLocation();
  const [showOutlet, setShowOutlet] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('setShowOutlet');
      setShowOutlet(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="nested-root card page-enter">
      {/* 路由面包屑 */}
      <div className="nested-breadcrumb">
        <span className="breadcrumb-item">🏠 首页</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-item active">嵌套路由演示</span>
        {location.pathname !== '/nested' && (
          <>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item active">
              {location.pathname.split('/').slice(2).join(' › ')}
            </span>
          </>
        )}
      </div>

      <div className="nested-title">
        🗂 三级嵌套路由 Demo
        <span className="nested-badge">Level 1 Layout</span>
      </div>
      <p className="card-desc" style={{ marginBottom: 24 }}>
        当前路径：<code className="path-code">{location.pathname}</code>
        <br />
        本 Layout 使用 <code className="path-code">{'<Outlet />'}</code>{' '}
        渲染二级子路由，二级路由中同样使用 <code className="path-code">{'<Outlet />'}</code>{' '}
        渲染三级页面，形成三层嵌套。
      </p>

      {/* 一级导航 */}
      <nav className="nested-nav nested-nav--l1">
        <div className="nested-nav-label">Level 1 → 选择模块</div>
        <div className="nested-nav-links">
          {LEVEL1_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nested-link ${isActive ? 'nested-link--active' : ''}`
              }
            >
              <span className="nested-link-label">{link.label}</span>
              <span className="nested-link-desc">{link.desc}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Level 1 → Level 2 的 Outlet */}
      <div className="nested-outlet nested-outlet--l1">
        <div className="outlet-indicator outlet-indicator--l1">
          ↳ <strong>{'<Outlet />'}</strong> Level 1 渲染出口
        </div>
        {showOutlet ? (
          <Outlet />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            ⏳ 模拟异步加载，2秒后渲染子路由...
          </div>
        )}
      </div>
    </div>
  );
}
