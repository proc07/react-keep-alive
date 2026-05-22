import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  time: string;
  type: 'activated' | 'deactivated' | 'action';
  message: string;
}

function now(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

/**
 * Counter Page
 *
 * 展示 keep-alive 缓存计数器状态：
 * - 切换 Tab 再切回，计数值保持不变
 * - useActivated / useDeactivated 钩子正确触发
 */
export default function Counter() {
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: now(), type: 'action', message: '计数器页面首次挂载' },
  ]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  console.log('Counter render');
  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev.slice(-49), { time: now(), type, message }]);
  };

  // 自动滚动到最新日志
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="card page-enter">
      <div className="card-title">
        🔢 计数器
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
          — 切换 Tab 再回来，数值不会重置
        </span>
      </div>
      <p className="card-desc">
        每次渲染会打印一条日志。切换到其他 Tab 再切回时，<strong>不会</strong>看到"首次挂载"日志，
        而是触发 <code style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>activated</code> 钩子。
      </p>

      <div className="counter-display">{count}</div>

      <div className="counter-controls">
        <button className="btn btn-secondary btn-lg" onClick={() => setCount((c) => c - 1)}>
          −
        </button>
        <button
          className="btn btn-danger"
          style={{ padding: '14px 20px' }}
          onClick={() => {
            setCount(0);
            addLog('action', '计数器重置为 0');
          }}
        >
          重置
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => setCount((c) => c + 1)}>
          ＋
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => setCount((c) => c + 10)}>+10</button>
        <button className="btn btn-secondary" onClick={() => setCount((c) => c + 100)}>+100</button>
        <button className="btn btn-secondary" onClick={() => setCount((c) => c * 2)}>×2</button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
        📋 生命周期事件日志
      </div>
      <div className="event-log">
        {logs.map((log, i) => (
          <div key={i} className="log-entry">
            <span className="log-time">{log.time}</span>
            <span className={log.type === 'activated' ? 'log-activated' : log.type === 'deactivated' ? 'log-deactivated' : ''}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
