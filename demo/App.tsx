import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
} from 'react-router-dom';
import { KeepAliveScope, useKeepAliveContext } from 'react-keep-alive';
import { KeepAliveRouteOutlet } from 'react-keep-alive/router';
import Counter from './pages/Counter';
import FormPage from './pages/Form';
import ListPage from './pages/List';
import ScrollPage from './pages/Scroll';

// ─── Navigation config ────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/',       label: '计数器', icon: '🔢', exact: true },
  { to: '/form',   label: '表单',   icon: '📝', exact: false },
  { to: '/list',   label: '列表',   icon: '📋', exact: false },
  { to: '/scroll', label: '滚动',   icon: '🖱️', exact: false },
];

// ─── Cache Status Panel ───────────────────────────────────────────────────────

function CacheStatusPanel() {
  const { getCacheKeys, drop, activeKey } = useKeepAliveContext();
  const location = useLocation();
  const keys = getCacheKeys();

  return (
    <div className="cache-panel">
      <div className="cache-panel-title">
        <span>🗂</span> KeepAlive 缓存状态
        <span style={{ marginLeft: 'auto', fontWeight: 400 }}>
          共 <strong style={{ color: 'var(--accent-light)' }}>{keys.length}</strong> 个已缓存
        </span>
      </div>
      <div className="cache-keys">
        {keys.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>暂无缓存</span>
        )}
        {keys.map((key) => (
          <div
            key={key}
            className={`cache-key-chip ${activeKey === key ? 'active-chip' : ''}`}
          >
            <span className="chip-dot" />
            {key}
            {activeKey === key && ' (激活)'}
          </div>
        ))}
      </div>
      <div className="cache-actions">
        <button
          className="btn btn-secondary"
          style={{ fontSize: 13, padding: '6px 14px' }}
          onClick={() => drop(location.pathname)}
        >
          ♻️ 刷新当前页
        </button>
        <button
          className="btn btn-danger"
          style={{ fontSize: 13, padding: '6px 14px' }}
          onClick={() => drop()}
        >
          🗑 清空所有缓存
        </button>
      </div>
    </div>
  );
}

// ─── Layout (wraps all routes) ────────────────────────────────────────────────

function Layout() {
  const { activeKey } = useKeepAliveContext();
  const location = useLocation();

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            react-keep-alive
          </div>
          <span className="badge">React Router v6</span>
          <div className="header-right">
            <div className="active-key-badge">
              当前路由: <span>{location.pathname}</span>
            </div>
            <div className="active-key-badge" style={{ marginLeft: 8 }}>
              激活 key: <span>{activeKey ?? '—'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation — 使用 NavLink，URL 驱动 */}
      <nav className="nav">
        <div className="nav-inner">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              <span className="tab-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main">
        <div className="main-inner">
          {/* Cache status panel */}
          <CacheStatusPanel />

          <div className="info-banner">
            ℹ️ 通过浏览器前进/后退或直接点击标签页切换路由，
            组件状态（计数值、表单输入、列表滚动）均会被 KeepAlive 缓存。
          </div>

          {/* KeepAliveRouteOutlet 替代 <Outlet />，自动缓存每个路由 */}
          <KeepAliveRouteOutlet
            exclude={['/login', '/register']}
            onActivated={(key) => console.log('[KeepAlive] activated:', key)}
            onDeactivated={(key) => console.log('[KeepAlive] deactivated:', key)}
          />
        </div>
      </main>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <KeepAliveScope max={10} strategy="LRU">
      <BrowserRouter>
        <Routes>
          {/* Layout 作为外层路由，所有子路由通过 KeepAliveRouteOutlet 渲染 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Counter />} />
            <Route path="form" element={<FormPage />} />
            <Route path="list" element={<ListPage />} />
            <Route path="scroll" element={<ScrollPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </KeepAliveScope>
  );
}
