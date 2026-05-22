import React, { useState, useMemo } from 'react';

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'away' | 'offline';
  avatar: string;
}

const STATUS_TAGS: Record<Employee['status'], { label: string; cls: string }> = {
  active:  { label: '在线', cls: 'tag-green' },
  away:    { label: '离开', cls: 'tag-orange' },
  offline: { label: '离线', cls: 'tag-red' },
};

const EMPLOYEES: Employee[] = [
  { id: 1,  name: '张伟',   role: '高级前端工程师',  department: '技术部', status: 'active',  avatar: '👨‍💻' },
  { id: 2,  name: '李娜',   role: '产品经理',        department: '产品部', status: 'active',  avatar: '👩‍💼' },
  { id: 3,  name: '王磊',   role: '后端工程师',      department: '技术部', status: 'away',    avatar: '👨‍🔬' },
  { id: 4,  name: '刘芳',   role: 'UI/UX 设计师',   department: '设计部', status: 'active',  avatar: '👩‍🎨' },
  { id: 5,  name: '陈强',   role: '全栈工程师',      department: '技术部', status: 'offline', avatar: '👨‍💻' },
  { id: 6,  name: '杨洋',   role: '测试工程师',      department: '质量部', status: 'active',  avatar: '👩‍🔬' },
  { id: 7,  name: '赵鑫',   role: '运维工程师',      department: '技术部', status: 'away',    avatar: '👨‍🔧' },
  { id: 8,  name: '孙丽',   role: '数据分析师',      department: '数据部', status: 'active',  avatar: '👩‍💻' },
  { id: 9,  name: '周杰',   role: '架构师',          department: '技术部', status: 'active',  avatar: '🧑‍💻' },
  { id: 10, name: '吴梅',   role: '项目经理',        department: '管理部', status: 'offline', avatar: '👩‍💼' },
  { id: 11, name: '郑勇',   role: '前端工程师',      department: '技术部', status: 'active',  avatar: '👨‍💻' },
  { id: 12, name: '徐静',   role: 'AI 研究员',       department: '研发部', status: 'away',    avatar: '👩‍🔬' },
  { id: 13, name: '马超',   role: '移动端工程师',    department: '技术部', status: 'active',  avatar: '🧑‍💻' },
  { id: 14, name: '朱珍',   role: '用户研究员',      department: '产品部', status: 'active',  avatar: '👩‍💼' },
  { id: 15, name: '胡峰',   role: '安全工程师',      department: '安全部', status: 'offline', avatar: '👨‍💼' },
];

/**
 * List Page
 *
 * 展示 keep-alive 缓存列表状态：
 * - 切换 Tab 再切回，搜索关键词、选中项、滚动位置均保持
 */
export default function ListPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<Employee['status'] | 'all'>('all');
  const [activatedCount, setActivatedCount] = useState(0);
  console.log('ListPage render');

  const filtered = useMemo(() => {
    return EMPLOYEES.filter((e) => {
      const matchSearch =
        search === '' ||
        e.name.includes(search) ||
        e.role.includes(search) ||
        e.department.includes(search);
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="card page-enter">
      <div className="card-title">
        📋 员工列表
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
          — 搜索词、选中项、滚动位置均被缓存
        </span>
      </div>
      <p className="card-desc">
        搜索员工或选中一行，切换到其他标签页再切回，状态完整保留。
        {activatedCount > 0 && (
          <span style={{ color: 'var(--green)', marginLeft: 8 }}>
            ✓ 已从缓存恢复 {activatedCount} 次
          </span>
        )}
      </p>

      {/* Controls */}
      <div className="list-controls">
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 搜索姓名、职位、部门..."
        />
        {(['all', 'active', 'away', 'offline'] as const).map((s) => (
          <button
            key={s}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '8px 14px' }}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? '全部' : STATUS_TAGS[s].label}
          </button>
        ))}
      </div>

      {/* List — overflow-y: auto preserves scroll position inside keep-alive */}
      <div className="list" style={{ maxHeight: 400, overflowY: 'auto', padding: 4 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            未找到匹配员工
          </div>
        )}
        {filtered.map((emp) => {
          const tag = STATUS_TAGS[emp.status];
          return (
            <div
              key={emp.id}
              className={`list-item ${selectedId === emp.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(emp.id === selectedId ? null : emp.id)}
            >
              <div
                className="item-avatar"
                style={{
                  background:
                    emp.status === 'active'
                      ? 'var(--green-dim)'
                      : emp.status === 'away'
                      ? 'var(--orange-dim)'
                      : 'var(--border)',
                }}
              >
                {emp.avatar}
              </div>
              <div className="item-info">
                <div className="item-name">{emp.name}</div>
                <div className="item-meta">
                  {emp.role} · {emp.department}
                </div>
              </div>
              <span className={`item-tag ${tag.cls}`}>{tag.label}</span>
            </div>
          );
        })}
        <div className="scroll-hint">共 {filtered.length} 条记录</div>
      </div>

      {selectedId !== null && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'var(--accent-dim)',
            border: '1px solid rgba(99,102,241,0.25)',
            fontSize: 13,
            color: 'var(--accent-light)',
          }}
        >
          ✓ 已选中：<strong>{EMPLOYEES.find((e) => e.id === selectedId)?.name}</strong>
          （ID: {selectedId}）
        </div>
      )}
    </div>
  );
}
