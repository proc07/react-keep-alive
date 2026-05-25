import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';

export default function DashboardPageFixedA() {
  const location = useLocation();

  console.log(`[DashboardPageFixedA Render] path: ${location.pathname}`);

  return (
    <div className="card page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 演示版本切换选项卡 */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-muted)' }}>📍 切换演示版本:</span>
        <Link 
          to="/system/dashboard" 
          className="btn btn-secondary"
          style={{ fontSize: 13, textDecoration: 'none' }}
        >
          🚨 Bug 复现 (组件内 Navigate)
        </Link>
        <Link 
          to="/system/dashboard-fixed-a" 
          className="btn btn-success"
          style={{ fontSize: 13, textDecoration: 'none' }}
        >
          ✅ 修复方案 A (不缓存 Layout)
        </Link>
        <Link 
          to="/system/dashboard-fixed-b" 
          className="btn btn-secondary"
          style={{ fontSize: 13, textDecoration: 'none' }}
        >
          ✅ 修复方案 B (useActivated)
        </Link>
      </div>

      <div className="nested-title">
        🎛️ 系统控制台 Layout (方案 A)
        <span className="nested-badge" style={{ backgroundColor: 'var(--success)' }}>
          布局不缓存，仅子页面缓存
        </span>
      </div>

      <p className="card-desc">
        当前路径：<code className="path-code">{location.pathname}</code>
        <br />
        <strong>原理：</strong> 布局壳组件不使用 KeepAlive 缓存，仅在子路由上配置 <code>handle: &#123; isKeepalive: true &#125;</code>。
        当访问父路由 <code>/system/dashboard-fixed-a</code> 时，由 React Router 的 <b>Index Route</b> 渲染 
        <code>&lt;Navigate to="lm" replace /&gt;</code> 进行跳转。由于布局未缓存，每次进入都会触发正常的跳转，而子页面的状态依然被 KeepAlive 完美保留。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, minHeight: 300 }}>
        {/* 左侧侧边栏 */}
        <div style={{ 
          borderRight: '1px solid var(--border-color)', 
          paddingRight: 20, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>📂 侧边栏菜单</h4>
          
          <Link 
            to="/system/dashboard-fixed-a/lm" 
            className={`nested-link ${location.pathname === '/system/dashboard-fixed-a/lm' ? 'nested-link--active' : ''}`}
            style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            📊 lm 子页面
          </Link>
          
          <Link 
            to="/system/dashboard-fixed-a/myCases" 
            className={`nested-link ${location.pathname === '/system/dashboard-fixed-a/myCases' ? 'nested-link--active' : ''}`}
            style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            📁 myCases 子页面
          </Link>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
            <Link 
              to="/system/dashboard-fixed-a" 
              className={`btn btn-secondary`}
              style={{ display: 'block', textAlign: 'center', fontSize: 12, padding: '8px', color: '#fff' }}
            >
              🔄 访问父路由 (自动跳转测试)
            </Link>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="nested-outlet" style={{ flex: 1, minHeight: 150 }}>
            <div className="outlet-indicator">
              ↳ <strong>{'<KeepAliveRouteOutlet />'}</strong> 子路由缓存出口
            </div>
            {/* 使用 KeepAliveRouteOutlet 渲染子路由 */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
