import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  NavLink,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { KeepAliveScope, useKeepAliveContext, KeepAliveRouteOutlet } from 'react-keep-alive';
import Counter from './pages/Counter';
import FormPage from './pages/Form';
import ListPage from './pages/List';
import ScrollPage from './pages/Scroll';
import NestedLayout from './pages/nested/NestedLayout';
import SettingsLayout from './pages/nested/SettingsLayout';
import Dashboard from './pages/nested/Dashboard';
import ProfilePage from './pages/nested/ProfilePage';
import SecurityPage from './pages/nested/SecurityPage';
import DashboardPage from './pages/system/DashboardPage';
import DashboardPageFixedA from './pages/system/DashboardPageFixedA';
import DashboardPageFixedB from './pages/system/DashboardPageFixedB';
import LMPage from './pages/system/LM';
import MyCasesPage from './pages/system/MyCases';

// ─── Navigation config ────────────────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/',       label: '计数器', icon: '🔢', exact: true },
  { to: '/form',   label: '表单',   icon: '📝', exact: false },
  { to: '/list',   label: '列表',   icon: '📋', exact: false },
  { to: '/scroll', label: '滚动',   icon: '🖱️', exact: false },
  { to: '/nested', label: '嵌套路由', icon: '🗂', exact: false },
  { to: '/system/dashboard', label: '父级跳转复现', icon: '🚨', exact: false },
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

const NESTED_PREFIX = '/nested';
const NESTED_STORAGE_KEY = 'lastNestedPath';
const NESTED_DEFAULT = '/nested/dashboard';

function Layout() {
  const { activeKey } = useKeepAliveContext();
  const location = useLocation();

  // 每次进入 /nested/* 子路由时，把当前完整路径存入 localStorage
  useEffect(() => {
    if (location.pathname.startsWith(NESTED_PREFIX + '/')) {
      localStorage.setItem(NESTED_STORAGE_KEY, location.pathname);
    }
  }, [location.pathname]);

  // 读取上次访问的嵌套路径（首次默认跳到 dashboard）
  const lastNestedPath = localStorage.getItem(NESTED_STORAGE_KEY) ?? NESTED_DEFAULT;

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
          {NAV_LINKS.map((link) => {
            // 嵌套路由 Tab：to 指向上次访问的子路径，active 判断只要在 /nested/* 内即高亮
            const isNested = link.to === NESTED_PREFIX;
            const to = isNested ? lastNestedPath : link.to;
            return (
              <NavLink
                key={link.to}
                to={to}
                end={!isNested && link.exact}
                className={({ isActive }) =>
                  `nav-tab ${
                    isNested
                      ? location.pathname.startsWith(NESTED_PREFIX)
                        ? 'active'
                        : ''
                      : isActive
                      ? 'active'
                      : ''
                  }`
                }
              >
                <span className="tab-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            );
          })}
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

          {/* 使用 KeepAliveRouteOutlet，各子路由的缓存行为由其 route handle 控制 */}
          <KeepAliveRouteOutlet />
        </div>
      </main>
    </div>
  );
}

// ─── Route Config（useRoutes 配置对象）────────────────────────────────────────

const routeConfig = [
  {
    path: '/',
    element: (
      <KeepAliveScope max={10} strategy="LRU">
        <Layout />
      </KeepAliveScope>
    ),
    children: [
      // 一级页面
      { index: true,      element: <Counter /> },
      { path: 'form',     element: <FormPage />, handle: { isKeepalive: true } },
      { path: 'list',     element: <ListPage /> },
      { path: 'scroll',   element: <ScrollPage />, handle: { isKeepalive: true } },
      // ── 三级嵌套路由 ──────────────────────────────────────────
      {
        path: 'nested',
        element: <NestedLayout />,        // Level 1 Layout（含 Outlet）
        handle: { isKeepalive: true },
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          {
            path: 'settings',
            element: <SettingsLayout />,  // Level 2 Layout（含 Outlet）
            children: [
              { path: 'profile',  element: <ProfilePage /> },
              { path: 'security', element: <SecurityPage /> },
            ],
          },
        ],
      },
      // ── Bug 复现路由 ──────────────────────────────────────────
      {
        path: 'system/dashboard',
        element: <DashboardPage />,
        handle: { isKeepalive: true },
        children: [
          { path: 'lm', element: <LMPage /> },
          { path: 'myCases', element: <MyCasesPage /> },
        ],
      },
      // ── 解决方案 A：不缓存 Layout，使用 Index 路由跳转 ───
      {
        path: 'system/dashboard-fixed-a',
        element: <DashboardPageFixedA />,
        // 布局本身不缓存
        handle: { isKeepalive: false },
        children: [
          // Index 路由不被缓存，因此能确保每次进入父路径时稳定重定向
          { index: true, element: <Navigate to="lm" replace /> },
          // 子路由开启 KeepAlive 缓存
          { path: 'lm', element: <LMPage />, handle: { isKeepalive: true } },
          { path: 'myCases', element: <MyCasesPage />, handle: { isKeepalive: true } },
        ],
      },
      // ── 解决方案 B：缓存 Layout，使用 useActivated 触发跳转 ───
      {
        path: 'system/dashboard-fixed-b',
        element: <DashboardPageFixedB />,
        // 布局本身缓存
        handle: { isKeepalive: true },
        children: [
          { path: 'lm', element: <LMPage /> },
          { path: 'myCases', element: <MyCasesPage /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routeConfig);

export default function App() {
  return <RouterProvider router={router} />;
}
