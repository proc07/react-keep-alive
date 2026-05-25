import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useKeepAliveContext, useActivated } from 'react-keep-alive';

export default function DashboardPageFixedB() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeKey } = useKeepAliveContext();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  console.log(`[DashboardPageFixedB Render] path: ${location.pathname}`);

  // 1. 挂载时的首次检查
  useEffect(() => {
    addLog(`组件挂载 (Mount) - 当前路径: ${location.pathname}`);
    if (location.pathname === '/system/dashboard-fixed-b') {
      addLog(`首次进入父路由，执行 navigate -> lm`);
      navigate('/system/dashboard-fixed-b/lm', { replace: true });
    }
  }, []);

  // 2. 关键：利用 useActivated 钩子，在 KeepAlive 缓存激活（即从缓存恢复）时执行跳转
  useActivated(() => {
    addLog(`✨ 缓存激活 (Activated)`);
    if (location.pathname === '/system/dashboard-fixed-b') {
      addLog(`检测到路径为父路由，在激活回调中执行 navigate -> lm`);
      navigate('/system/dashboard-fixed-b/lm', { replace: true });
    }
  });

  useEffect(() => {
    addLog(`路径变化 -> ${location.pathname}`);
  }, [location.pathname]);

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
          className="btn btn-secondary"
          style={{ fontSize: 13, textDecoration: 'none' }}
        >
          ✅ 修复方案 A (不缓存 Layout)
        </Link>
        <Link 
          to="/system/dashboard-fixed-b" 
          className="btn btn-success"
          style={{ fontSize: 13, textDecoration: 'none' }}
        >
          ✅ 修复方案 B (useActivated)
        </Link>
      </div>

      <div className="nested-title">
        🎛️ 系统控制台 Layout (方案 B)
        <span className="nested-badge" style={{ backgroundColor: 'var(--success)' }}>
          布局已缓存，通过 useActivated 跳转
        </span>
      </div>

      <p className="card-desc">
        当前路径：<code className="path-code">{location.pathname}</code> | 
        当前激活的 KeepAlive Key：<code className="path-code">{activeKey}</code>
        <br />
        <strong>原理：</strong> 布局壳本身被 KeepAlive 缓存。为了避免从缓存恢复时 default 路由跳转失效的问题，
        我们不使用 <code>&lt;Navigate /&gt;</code> 渲染跳转，而是使用库提供的 <code>useActivated</code> 钩子。
        当组件被激活时，回调会触发并检查路径，如果当前是父路由 <code>/system/dashboard-fixed-b</code>，则编程式调用 <code>navigate</code> 导航到子路由。
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
            to="/system/dashboard-fixed-b/lm" 
            className={`nested-link ${location.pathname === '/system/dashboard-fixed-b/lm' ? 'nested-link--active' : ''}`}
            style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            📊 lm 子页面
          </Link>
          
          <Link 
            to="/system/dashboard-fixed-b/myCases" 
            className={`nested-link ${location.pathname === '/system/dashboard-fixed-b/myCases' ? 'nested-link--active' : ''}`}
            style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            📁 myCases 子页面
          </Link>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
            <Link 
              to="/system/dashboard-fixed-b" 
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
                <div key={index} style={{ color: log.includes('Activated') || log.includes('激活') ? 'var(--accent-light)' : '#ccc' }}>
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
