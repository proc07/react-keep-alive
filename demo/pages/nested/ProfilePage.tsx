import React, { useState } from 'react';
import { useActivated, useDeactivated } from 'react-keep-alive';

/**
 * ProfilePage — 第三级页面（/nested/settings/profile）
 *
 * 由 SettingsLayout 中的 <Outlet /> 渲染，是整个三级嵌套的叶子节点。
 */
export default function ProfilePage() {
  const [name, setName]   = useState('张三');
  const [email, setEmail] = useState('zhangsan@example.com');
  const [bio, setBio]     = useState('喜欢写代码，热爱开源。');
  const [saved, setSaved] = useState(false);
  const [activated, setActivated] = useState(0);

  useActivated(() => {
    setActivated((n) => n + 1);
  });

  useDeactivated(() => {
    console.log('[KeepAlive] ProfilePage deactivated');
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="nested-l3-page page-enter">
      <div className="nested-page-header">
        <div className="nested-page-title">
          👤 个人资料
          <span className="nested-badge nested-badge--purple">Level 3 Page</span>
        </div>
        <div className="nested-page-path">/nested/settings/profile</div>
      </div>

      <p className="card-desc">
        这是第三层（最深层）路由页面，由 <strong>SettingsLayout</strong> 中的{' '}
        <code className="path-code">{'<Outlet />'}</code> 渲染。
        切换到其他页面再回来，表单内容由 <strong>KeepAlive</strong> 保留
        （activated <strong style={{ color: 'var(--green)' }}>{activated}</strong> 次）。
      </p>

      <div className="form" style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label className="form-label">用户名</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入用户名"
          />
        </div>

        <div className="form-group">
          <label className="form-label">邮箱</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
          />
        </div>

        <div className="form-group">
          <label className="form-label">个人简介</label>
          <textarea
            className="form-textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="介绍一下自己"
            rows={3}
          />
        </div>

        <button
          className={`btn ${saved ? 'btn-primary' : 'btn-secondary'}`}
          onClick={handleSave}
          style={{ alignSelf: 'flex-start' }}
        >
          {saved ? '✅ 已保存！' : '💾 保存更改'}
        </button>
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
          🟣 <code>/nested/settings/profile</code> — <strong>Level 3 Page（当前）</strong>
        </div>
      </div>
    </div>
  );
}
