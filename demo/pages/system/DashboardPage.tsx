import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useKeepAliveContext } from 'react-keep-alive';

export default function DashboardPage() {
  const location = useLocation();
  const { activeKey } = useKeepAliveContext();
  const [logs, setLogs] = useState<string[]>([]);

  // 辅助日志记录
  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // 每次渲染都记录日志
  console.log(`[DashboardPage Render] path: ${location.pathname}`);

  // 重现图片中的逻辑：在 DashboardPage 渲染时，如果发现当前路径是父级，内部进行跳转
  const shouldRedirect = location.pathname === '/system/dashboard';

  useEffect(() => {
    addLog(`组件挂载 (Mount) - 当前路径: ${location.pathname}`);
    return () => {
      console.log(`[DashboardPage Unmount]`);
    };
  }, []);

  useEffect(() => {
    addLog(`路径发生变化 -> ${location.pathname}`);
  }, [location.pathname]);

  if (shouldRedirect) {
    // 触发 Bug 的关键：从其他页面切回来被 KeepAlive 缓存恢复时，由于组件已挂载，
    // Navigate 内部的 useEffect 无法再次触发，导致页面卡在 /system/dashboard 且内容空白。
    const redirectMsg = '检测到父路由，渲染 <Navigate to="/system/dashboard/lm" />';
    console.log(`[DashboardPage Redirect] ${redirectMsg}`);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            className="btn btn-danger"
            style={{ fontSize: 13, textDecoration: 'none' }}
          >
            🚨 Bug 复现 (组件内 Navigate)
          </Link>
          <Link 
            to="/system/dashboard-fixed-a" 
            className="btn btn-secondary"
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

        <div className="card" style={{ border: '2px dashed var(--danger)' }}>
          <div style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--danger)', marginTop: 0 }}>🚨 触发重定向逻辑</h3>
            <p>当前路径: <code>{location.pathname}</code></p>
            <p>{redirectMsg}</p>
            <p style={{ color: 'var(--text-muted)' }}>
              由于本组件被 KeepAlive 缓存（此时属于从缓存恢复，并非重新挂载），
              React Router 渲染的 <code>&lt;Navigate /&gt;</code> 的 <code>useEffect</code> 不会触发，
              导致页面卡在此处且无法重定向到子路由，呈现空白或静止状态。
            </p>
            <Navigate to="/system/dashboard/lm" replace />
          </div>
        </div>
      </div>
    );
  }

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
          className="btn btn-danger"
          style={{ fontSize: 13, textDecoration: 'none' }}
        >
          🚨 Bug 复现 (组件内 Navigate)
        </Link>
        <Link 
          to="/system/dashboard-fixed-a" 
          className="btn btn-secondary"
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
        🎛️ 系统控制台 Layout
        <span className="nested-badge" style={{ backgroundColor: 'var(--accent-light)' }}>
          KeepAlive 父路由壳
        </span>
      </div>

      <p className="card-desc">
        当前路径：<code className="path-code">{location.pathname}</code> | 
        当前激活的 KeepAlive Key：<code className="path-code">{activeKey}</code>
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
            to="/system/dashboard/lm" 
            className={`nested-link ${location.pathname === '/system/dashboard/lm' ? 'nested-link--active' : ''}`}
            style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            📊 lm 子页面
          </Link>
          
          <Link 
            to="/system/dashboard/myCases" 
            className={`nested-link ${location.pathname === '/system/dashboard/myCases' ? 'nested-link--active' : ''}`}
            style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            📁 myCases 子页面
          </Link>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
            <Link 
              to="/system/dashboard" 
              className={`btn btn-danger`}
              style={{ display: 'block', textAlign: 'center', fontSize: 12, padding: '8px' }}
            >
              ⚠️ 点击访问父路由 (测试重定向)
            </Link>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="nested-outlet" style={{ flex: 1, minHeight: 150 }}>
            <div className="outlet-indicator">
              ↳ <strong>{'<Outlet />'}</strong> 子路由出口
            </div>
            <Outlet />
          </div>

          {/* 日志监控 */}
          <div style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            padding: 12, 
            borderRadius: 6, 
            fontSize: 12, 
            fontFamily: 'monospace',
            maxHeight: 150,
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, borderBottom: '1px solid #444', pb: 4 }}>
              <strong>📋 渲染生命周期日志</strong>
              <button 
                onClick={() => setLogs([])}
                style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer' }}
              >
                清除
              </button>
            </div>
            {logs.length === 0 ? (
              <div style={{ color: '#888' }}>暂无日志...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ color: log.includes('🚨') || log.includes('检测到') ? 'var(--danger)' : '#ccc' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
