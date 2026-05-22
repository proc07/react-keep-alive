import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const LEVEL2_LINKS = [
  { to: '/nested/settings/profile',  label: '👤 个人资料', desc: 'Profile' },
  { to: '/nested/settings/security', label: '🔒 安全设置', desc: 'Security' },
];

/**
 * SettingsLayout — 第二级嵌套路由 Layout（/nested/settings）
 *
 * 它本身由 NestedLayout 的 <Outlet /> 渲染（Level 1 → Level 2），
 * 同时自身也包含一个 <Outlet /> 用于渲染第三层页面（Level 2 → Level 3）。
 */
export default function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="nested-page page-enter">
      <div className="nested-page-header">
        <div className="nested-page-title">
          ⚙️ 设置中心
          <span className="nested-badge nested-badge--orange">Level 2 Layout</span>
        </div>
        <div className="nested-page-path">{location.pathname}</div>
      </div>

      <p className="card-desc">
        这是第二层路由 Layout（由 NestedLayout 的 <code className="path-code">{'<Outlet />'}</code> 渲染）。
        它自身也包含一个 <code className="path-code">{'<Outlet />'}</code>，
        用来渲染第三层子页面，构成完整三级嵌套。
      </p>

      {/* 二级导航 */}
      <nav className="nested-nav nested-nav--l2">
        <div className="nested-nav-label">Level 2 → 选择设置项</div>
        <div className="nested-nav-links">
          {LEVEL2_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nested-link nested-link--sm ${isActive ? 'nested-link--active' : ''}`
              }
            >
              <span className="nested-link-label">{link.label}</span>
              <span className="nested-link-desc">{link.desc}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Level 2 → Level 3 的 Outlet */}
      <div className="nested-outlet nested-outlet--l2">
        <div className="outlet-indicator outlet-indicator--l2">
          ↳ <strong>{'<Outlet />'}</strong> Level 2 渲染出口
        </div>
        <Outlet />
      </div>

      {/* 路由层级说明 */}
      <div className="route-tree" style={{ marginTop: 20 }}>
        <div className="route-tree-title">📍 当前路由层级</div>
        <div className="route-tree-item route-tree-l1">
          🔵 <code>/nested</code> — Level 1 Layout（NestedLayout）
        </div>
        <div className="route-tree-item route-tree-l2">
          🟠 <code>/nested/settings</code> — <strong>Level 2 Layout（当前）</strong>
        </div>
        <div className="route-tree-item route-tree-l3">
          🟣 <code>/nested/settings/profile</code> 或 <code>/nested/settings/security</code> — Level 3 Page
        </div>
      </div>
    </div>
  );
}
