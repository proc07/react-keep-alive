import React, { useState } from 'react';
import { useActivated, useDeactivated } from 'react-keep-alive';

/**
 * SecurityPage — 第三级页面（/nested/settings/security）
 *
 * 由 SettingsLayout 中的 <Outlet /> 渲染，与 ProfilePage 同层。
 */
export default function SecurityPage() {
  const [twoFactor, setTwoFactor]       = useState(false);
  const [loginAlert, setLoginAlert]     = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState('7');
  const [activated, setActivated] = useState(0);

  useActivated(() => {
    setActivated((n) => n + 1);
  });

  useDeactivated(() => {
    console.log('[KeepAlive] SecurityPage deactivated');
  });

  return (
    <div className="nested-l3-page page-enter">
      <div className="nested-page-header">
        <div className="nested-page-title">
          🔒 安全设置
          <span className="nested-badge nested-badge--purple">Level 3 Page</span>
        </div>
        <div className="nested-page-path">/nested/settings/security</div>
      </div>

      <p className="card-desc">
        这是第三层路由页面，与 <strong>个人资料</strong> 同属 SettingsLayout 的子路由。
        切换页面再回来，开关状态由 <strong>KeepAlive</strong> 保留
        （activated <strong style={{ color: 'var(--green)' }}>{activated}</strong> 次）。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        {/* 双因素认证 */}
        <div className="security-item">
          <div className="security-item-info">
            <div className="security-item-title">双因素认证（2FA）</div>
            <div className="security-item-desc">开启后登录需要额外验证码</div>
          </div>
          <button
            className={`toggle-btn ${twoFactor ? 'toggle-btn--on' : ''}`}
            onClick={() => setTwoFactor((v) => !v)}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {/* 登录提醒 */}
        <div className="security-item">
          <div className="security-item-info">
            <div className="security-item-title">登录异地提醒</div>
            <div className="security-item-desc">检测到新设备登录时发送邮件通知</div>
          </div>
          <button
            className={`toggle-btn ${loginAlert ? 'toggle-btn--on' : ''}`}
            onClick={() => setLoginAlert((v) => !v)}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {/* 会话过期 */}
        <div className="form-group">
          <label className="form-label">会话过期时间（天）</label>
          <select
            className="form-select"
            value={sessionExpiry}
            onChange={(e) => setSessionExpiry(e.target.value)}
          >
            <option value="1">1 天</option>
            <option value="7">7 天</option>
            <option value="30">30 天</option>
            <option value="90">90 天</option>
          </select>
        </div>
      </div>

      {/* 路由层级说明 */}
      <div className="route-tree" style={{ marginTop: 24 }}>
        <div className="route-tree-title">📍 当前路由层级</div>
        <div className="route-tree-item route-tree-l1">
          🔵 <code>/nested</code> — Level 1 Layout（NestedLayout）
        </div>
        <div className="route-tree-item route-tree-l2">
          🟠 <code>/nested/settings</code> — Level 2 Layout（SettingsLayout）
        </div>
        <div className="route-tree-item route-tree-l3">
          🟣 <code>/nested/settings/security</code> — <strong>Level 3 Page（当前）</strong>
        </div>
      </div>
    </div>
  );
}
