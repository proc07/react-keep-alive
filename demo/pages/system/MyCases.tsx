import React, { useState } from 'react';

export default function MyCasesPage() {
  const [text, setText] = useState('');

  return (
    <div style={{ padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0, color: 'var(--accent-light)' }}>📁 MyCases 子页面</h3>
      <p style={{ fontSize: 14 }}>
        这是另一个嵌套在 <code>DashboardPage</code> 内的子页面。
      </p>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
          输入框状态测试：
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入一些内容以测试状态缓存..."
          className="form-control"
          style={{ width: '100%', maxWidth: 400, padding: 8 }}
        />
        {text && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            当前输入: {text}
          </p>
        )}
      </div>
    </div>
  );
}
