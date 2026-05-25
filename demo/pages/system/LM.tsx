import React, { useState } from 'react';

export default function LMPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
      <h3 style={{ marginTop: 0, color: 'var(--accent-light)' }}>📊 LM 子页面</h3>
      <p style={{ fontSize: 14 }}>
        这是一个被嵌套在 <code>DashboardPage</code> 内的子页面。
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button className="btn" onClick={() => setCount(count + 1)}>
          点击加 1
        </button>
        <span style={{ fontSize: 16 }}>
          本地状态计数器: <strong>{count}</strong>
        </span>
      </div>
    </div>
  );
}
