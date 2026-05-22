import React, { useState } from 'react';
import { useActivated, useDeactivated } from 'react-keep-alive';

interface Stat {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const STATS: Stat[] = [
  { label: '总访问量', value: '128,450', icon: '👁', color: 'var(--accent)' },
  { label: '活跃用户', value: '3,291',   icon: '👤', color: 'var(--green)' },
  { label: '今日订单', value: '842',      icon: '📦', color: 'var(--orange)' },
  { label: '转化率',   value: '24.6%',   icon: '📈', color: '#a78bfa' },
];

/**
 * Dashboard — 第二级页面（/nested/dashboard）
 *
 * 它是 NestedLayout 里 <Outlet /> 渲染出来的，
 * 自身不再含子路由，没有第三级嵌套。
 */
export default function Dashboard() {
  const [activated, setActivated] = useState(0);

  useActivated(() => {
    setActivated((n) => n + 1);
  });

  useDeactivated(() => {
    console.log('[KeepAlive] Dashboard deactivated');
  });

  return (
    <div className="nested-page page-enter">
      <div className="nested-page-header">
        <div className="nested-page-title">
          📊 仪表盘
          <span className="nested-badge nested-badge--green">Level 2 Page</span>
        </div>
        <div className="nested-page-path">/nested/dashboard</div>
      </div>

      <p className="card-desc">
        这是第二层路由渲染的页面。它由 <strong>NestedLayout</strong> 中的{' '}
        <code className="path-code">{'<Outlet />'}</code> 渲染，
        自身是叶子节点，无第三层子路由。
        <br />
        KeepAlive activated 次数：<strong style={{ color: 'var(--green)' }}>{activated}</strong>
      </p>

      {/* 统计卡片 */}
      <div className="dashboard-stats">
        {STATS.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 路由层级说明 */}
      <div className="route-tree">
        <div className="route-tree-title">📍 当前路由层级</div>
        <div className="route-tree-item route-tree-l1">
          🔵 <code>/nested</code> — Level 1 Layout（NestedLayout）
        </div>
        <div className="route-tree-item route-tree-l2">
          🟢 <code>/nested/dashboard</code> — <strong>Level 2 Page（当前）</strong>
        </div>
      </div>
    </div>
  );
}
