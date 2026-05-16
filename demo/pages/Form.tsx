import React, { useState } from 'react';
import { useActivated } from 'react-keep-alive';

/**
 * Form Page
 *
 * 展示 keep-alive 缓存表单状态：
 * - 切换 Tab 再切回，所有输入内容完整保留
 * - 包含文本、选择框、评分、多行文本等多种控件
 */
export default function FormPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activatedCount, setActivatedCount] = useState(0);
  console.log('FormPage render');
  useActivated(() => {
    setActivatedCount((c) => c + 1);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="card page-enter">
      <div className="card-title">
        📝 反馈表单
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
          — 切换 Tab 再回来，所有输入内容不会丢失
        </span>
      </div>
      <p className="card-desc">
        在下方填写信息后切换到其他标签页，再切回来，所有字段内容都会完整保留。
        {activatedCount > 0 && (
          <span style={{ color: 'var(--green)', marginLeft: 8 }}>
            ✓ 已从缓存恢复 {activatedCount} 次
          </span>
        )}
      </p>

      {submitted && (
        <div className="info-banner" style={{ background: 'var(--green-dim)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--green)' }}>
          ✅ 提交成功！（仅演示，状态会保持在缓存中）
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">姓名</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的姓名"
            />
          </div>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">公司</label>
            <input
              className="form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="您的公司名称"
            />
          </div>
          <div className="form-group">
            <label className="form-label">职位</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">请选择职位</option>
              <option value="frontend">前端工程师</option>
              <option value="backend">后端工程师</option>
              <option value="fullstack">全栈工程师</option>
              <option value="product">产品经理</option>
              <option value="design">UI/UX 设计师</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">体验评分</label>
          <div className="rating-group">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`rating-star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
                role="button"
                aria-label={`${star} 星`}
              >
                ⭐
              </span>
            ))}
          </div>
          <p className="form-hint">
            {rating === 0 && '点击星星评分'}
            {rating === 1 && '非常差'}
            {rating === 2 && '较差'}
            {rating === 3 && '一般'}
            {rating === 4 && '不错'}
            {rating === 5 && '非常棒！🎉'}
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">详细反馈</label>
          <textarea
            className="form-textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请描述您的使用体验，建议或问题..."
            rows={4}
          />
          <p className="form-hint">{feedback.length} / 500 字</p>
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            id="newsletter"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="newsletter" style={{ cursor: 'pointer', fontSize: 14, color: 'var(--text-dim)' }}>
            订阅更新通知（新功能发布时通知我）
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', padding: '12px 28px' }}
        >
          提交反馈
        </button>
      </form>
    </div>
  );
}
