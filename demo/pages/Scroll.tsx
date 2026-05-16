import React, { useState, useRef, useEffect } from 'react';
import { useActivated, useDeactivated } from 'react-keep-alive';

// ─── 数据 ─────────────────────────────────────────────────────────────────────

const ARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  title: `文章 #${String(i + 1).padStart(2, '0')}：React 性能优化系列`,
  summary: `深入探讨 React ${i + 1} 中的渲染优化策略，包括 useMemo、useCallback 的实际应用场景，以及如何避免不必要的重渲染。`,
  tag: ['性能', '状态管理', '架构', 'Hooks', 'Router'][i % 5],
  color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
}));

const HORIZONTAL_CARDS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: `热门话题 ${i + 1}`,
  icon: ['🚀', '⚡', '🎯', '💡', '🔥', '🌊', '🎨', '🛡️', '🔮', '🌈', '💎', '🏆'][i],
  views: Math.floor(Math.random() * 9000) + 1000,
}));

const SIDE_ITEMS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  label: ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef',
          'useContext', 'useReducer', 'useLayoutEffect', 'useDebugValue', 'useId',
          'Suspense', 'ErrorBoundary', 'memo', 'forwardRef', 'createContext',
          'createPortal', 'startTransition', 'useDeferredValue', 'useTransition', 'flushSync'][i],
}));

// ─── ScrollPage ───────────────────────────────────────────────────────────────

export default function ScrollPage() {
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [deactivatedAt, setDeactivatedAt] = useState<string | null>(null);
  const mainListRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const hScrollRef = useRef<HTMLDivElement>(null);

  // 用 ref 实时跟踪滚动值：onScroll 事件同步更新，
  // 这样 useDeactivated 触发时（DOM 已隐藏）仍能读到正确值
  const liveScrollRef = useRef({ main: 0, side: 0, horizontal: 0 });

  // 记录离开时各容器的滚动位置，用于页面展示
  const [savedScrolls, setSavedScrolls] = useState<{
    main: number; side: number; horizontal: number;
  } | null>(null);

  // 停用时：从 liveScrollRef 读取（不从 DOM 读，此时容器已在 display:none 里）
  useDeactivated(() => {
    setDeactivatedAt(new Date().toLocaleTimeString());
    setSavedScrolls({ ...liveScrollRef.current });
  });

  // 激活时：记录恢复时间
  useActivated(() => {
    setRestoredAt(new Date().toLocaleTimeString());
  });

  return (
    <div className="scroll-page">
      {/* 说明横幅 */}
      <div className="scroll-hero">
        <h2 className="scroll-hero-title">🖱️ 滚动位置保存 Demo</h2>
        <p className="scroll-hero-desc">
          向下滚动主列表、侧边栏，或横向滚动卡片，然后<strong>切换到其他标签页再回来</strong>——
          所有滚动位置将被 KeepAlive 自动恢复。
        </p>
        {savedScrolls && (
          <div className="scroll-info-cards">
            <div className="scroll-info-card">
              <div className="scroll-info-label">📦 离开时保存 <span className="scroll-info-time">{deactivatedAt}</span></div>
              <div className="scroll-info-values">
                <span>主列表: <strong>{savedScrolls.main}px</strong></span>
                <span>侧边栏: <strong>{savedScrolls.side}px</strong></span>
                <span>横向: <strong>{savedScrolls.horizontal}px</strong></span>
              </div>
            </div>
            {restoredAt && (
              <div className="scroll-info-card scroll-info-card--restored">
                <div className="scroll-info-label">✅ 恢复时间 <span className="scroll-info-time">{restoredAt}</span></div>
                <div className="scroll-info-values">
                  <span>滚动位置已自动恢复 🎉</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 横向滚动区 */}
      <div className="scroll-section">
        <div className="scroll-section-title">
          ↔️ 横向滚动卡片列表
          <span className="scroll-section-hint">向右滚动后切换路由再回来</span>
        </div>
        <div
          className="h-scroll-track"
          ref={hScrollRef}
          onScroll={(e) => { liveScrollRef.current.horizontal = e.currentTarget.scrollLeft; }}
        >
          {HORIZONTAL_CARDS.map((card) => (
            <div key={card.id} className="h-scroll-card">
              <div className="h-scroll-card-icon">{card.icon}</div>
              <div className="h-scroll-card-title">{card.title}</div>
              <div className="h-scroll-card-meta">{card.views.toLocaleString()} 阅读</div>
            </div>
          ))}
        </div>
      </div>

      {/* 主内容区（两栏） */}
      <div className="scroll-body">
        {/* 主列表（竖向滚动） */}
        <div className="scroll-main-col">
          <div className="scroll-section-title">
            ↕️ 文章列表（竖向滚动）
            <span className="scroll-section-hint">向下滚动后切换路由再回来</span>
          </div>
          <div
            className="scroll-list"
            ref={mainListRef}
            onScroll={(e) => { liveScrollRef.current.main = e.currentTarget.scrollTop; }}
          >
            {ARTICLES.map((article) => (
              <div key={article.id} className="scroll-article-card">
                <div className="article-tag" style={{ background: article.color + '22', color: article.color }}>
                  {article.tag}
                </div>
                <div className="article-title">{article.title}</div>
                <div className="article-summary">{article.summary}</div>
                <div className="article-footer">
                  <span className="article-num">#{article.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 侧边栏（独立竖向滚动） */}
        <div className="scroll-side-col">
          <div className="scroll-section-title" style={{ fontSize: 13 }}>
            📌 侧边栏（独立滚动）
          </div>
          <div
            className="scroll-sidebar"
            ref={sideRef}
            onScroll={(e) => { liveScrollRef.current.side = e.currentTarget.scrollTop; }}
          >
            <div className="sidebar-group-title">React Hooks</div>
            {SIDE_ITEMS.map((item) => (
              <div key={item.id} className="sidebar-item">
                <span className="sidebar-dot" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
