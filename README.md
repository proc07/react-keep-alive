# react-keep-alive-max-max

> 类 Vue `<keep-alive>` 的 React 18/19 组件缓存插件 — 缓存组件状态，避免切换时重新渲染销毁，提升性能。

[![npm version](https://img.shields.io/npm/v/react-keep-alive-max)](https://www.npmjs.com/package/react-keep-alive-max)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 功能特性

- ✅ **状态缓存** — 切换组件时保留 state、DOM、滚动位置
- ✅ **生命周期钩子** — `useActivated` / `useDeactivated`，对标 Vue `onActivated` / `onDeactivated`
- ✅ **LRU / FIFO 淘汰策略** — 自动管理缓存内存，防止无限增长
- ✅ **include / exclude 过滤** — 精确控制哪些组件需要缓存
- ✅ **React Router 集成** — `<KeepAliveRouteOutlet>` 替代 `<Outlet>`，支持 v6 / v7
- ✅ **手动控制** — `drop()` / `refresh()` / `getCacheKeys()`
- ✅ **TypeScript** — 完整类型声明
- ✅ **零依赖** — 只依赖 React 本身

## 安装

```bash
npm install react-keep-alive-max
# 或
pnpm add react-keep-alive-max
# 或
yarn add react-keep-alive-max
```

## 快速上手

### 基础用法

```tsx
import { KeepAliveScope, KeepAlive } from 'react-keep-alive-max';

function App() {
  const [tab, setTab] = useState('home');

  return (
    // 1. 在顶层包裹 KeepAliveScope
    <KeepAliveScope max={10} strategy="LRU">
      <nav>
        <button onClick={() => setTab('home')}>首页</button>
        <button onClick={() => setTab('list')}>列表</button>
      </nav>

      {/* 2. 用 KeepAlive 包裹需要缓存的组件 */}
      {tab === 'home' && (
        <KeepAlive cacheKey="home">
          <HomePage />
        </KeepAlive>
      )}
      {tab === 'list' && (
        <KeepAlive cacheKey="list">
          <ListPage />
        </KeepAlive>
      )}
    </KeepAliveScope>
  );
}
```

### 生命周期钩子

```tsx
import { useActivated, useDeactivated } from 'react-keep-alive-max';

function ListPage() {
  const [data, setData] = useState([]);

  // 从缓存恢复时触发（类似 Vue 的 onActivated）
  useActivated(() => {
    console.log('页面被激活，刷新数据...');
    fetchLatestData().then(setData);
  });

  // 被推入缓存时触发（类似 Vue 的 onDeactivated）
  useDeactivated(() => {
    console.log('页面被缓存，暂停轮询...');
    stopPolling();
  });

  return <List data={data} />;
}
```

### 手动控制缓存

```tsx
import { useKeepAliveContext } from 'react-keep-alive-max';

function AdminPanel() {
  const { drop, refresh, getCacheKeys, activeKey } = useKeepAliveContext();

  return (
    <div>
      <p>当前激活：{activeKey}</p>
      <p>已缓存页面：{getCacheKeys().join(', ')}</p>

      {/* 刷新指定页面（下次访问时重新挂载） */}
      <button onClick={() => refresh('list')}>刷新列表页</button>

      {/* 清空所有缓存 */}
      <button onClick={() => drop()}>清空缓存</button>
    </div>
  );
}
```

### React Router 集成

```tsx
import { KeepAliveScope } from 'react-keep-alive-max';
import { KeepAliveRouteOutlet } from 'react-keep-alive-max/router';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/list">列表</Link>
        <Link to="/form">表单</Link>
      </nav>
      {/* 替换 <Outlet /> */}
      <KeepAliveRouteOutlet
        exclude={['/login', '/register']}  // 这些路由不缓存
      />
    </div>
  );
}

function App() {
  return (
    <KeepAliveScope max={8}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="list" element={<ListPage />} />
            <Route path="form" element={<FormPage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </KeepAliveScope>
  );
}
```

## API 文档

### `<KeepAliveScope>`

顶层 Provider，必须包裹在所有 `<KeepAlive>` 外层。


| Prop       | 类型             | 默认值  | 说明             |
| ---------- | ---------------- | ------- | ---------------- |
| `max`      | `number`         | `10`    | 最大缓存组件数量 |
| `strategy` | `'LRU' | 'FIFO'` | `'LRU'` | 缓存淘汰策略     |

### `<KeepAlive>`

核心缓存组件。


| Prop            | 类型                | 必填 | 说明                                    |
| --------------- | ------------------- | ---- | --------------------------------------- |
| `cacheKey`      | `string`            | ✅   | 缓存唯一标识                            |
| `include`       | `string[] | RegExp` | —   | 白名单：只有匹配的 key 才缓存           |
| `exclude`       | `string[] | RegExp` | —   | 黑名单：匹配的 key 不缓存（优先级更高） |
| `onActivated`   | `() => void`        | —   | 激活时回调                              |
| `onDeactivated` | `() => void`        | —   | 停用时回调                              |

### `useActivated(callback)`

组件从缓存恢复（激活）时调用 `callback`。

### `useDeactivated(callback)`

组件被推入缓存（停用）时调用 `callback`。

### `useKeepAliveContext()`

返回缓存控制方法：

```ts
interface KeepAliveControls {
  drop: (key?: string) => void;     // 销毁缓存（不传 = 清空全部）
  refresh: (key: string) => void;   // 刷新缓存（销毁后重建）
  getCacheKeys: () => string[];     // 获取所有缓存 key
  activeKey: string | null;         // 当前激活的 cacheKey
}
```

### `<KeepAliveRouteOutlet>`（`react-keep-alive-max/router`）

替代 `<Outlet>` 的路由缓存组件，兼容 react-router-dom v6 / v7。


| Prop            | 类型                           | 说明                                    |
| --------------- | ------------------------------ | --------------------------------------- |
| `cacheKey`      | `(pathname, search) => string` | 自定义 key 生成函数，默认使用`pathname` |
| `include`       | `string[] | RegExp`            | 缓存白名单                              |
| `exclude`       | `string[] | RegExp`            | 缓存黑名单                              |
| `onActivated`   | `(key: string) => void`        | 路由激活回调                            |
| `onDeactivated` | `(key: string) => void`        | 路由停用回调                            |

## 实现原理

### 1. 核心：DOM 容器"物理搬运" + Portal 保活

大多数 React 缓存方案用 `display: none` 隐藏非激活组件，但这种做法仍然占据布局空间，而且不能跨帧保留滚动位置。

本库的核心思路是：**把每个 KeepAlive 组件的 DOM 容器在两个位置之间物理移动**。

```
┌─────────────────────────────────────────────────────┐
│ KeepAliveScope                                      │
│                                                     │
│  ┌──────────────────┐   ┌─────────────────────────┐│
│  │  <placeholder>   │   │  <cacheRoot>（隐藏）    ││
│  │  （占位节点）     │   │  display: none          ││
│  │                  │   │                         ││
│  │  ┌────────────┐  │   │  ┌────────────┐         ││
│  │  │ container  │◄─┼───┼──│ container  │ 激活时搬回││
│  │  │  [PageA]   │  │   │  │  [PageB]   │ 停用时移入││
│  │  └────────────┘  │   │  └────────────┘         ││
│  └──────────────────┘   └─────────────────────────┘│
│                                                     │
│  ReactDOM.createPortal(entry.element, container)    │
│  ↑ Portal 让 React Fiber 持续存活，哪怕 DOM 被移走  │
└─────────────────────────────────────────────────────┘
```

**关键流程：**

```
首次挂载
  KeepAlive.layoutEffect
    → 创建 <div> container
    → 插入到 placeholder（可见区域）
    → 写入 caches Map
    → KeepAliveScope 的 Portal 开始将 children 渲染进 container

切换（KeepAlive 卸载）
  KeepAlive.layoutEffect cleanup
    → 将 container 从 placeholder 移入 cacheRoot（隐藏）
    → React Fiber 仍然存活（Portal 还在渲染）
    → 组件 state、DOM、滚动位置全部保留 ✅

再次激活（KeepAlive 重新挂载，cache hit）
  KeepAlive.layoutEffect
    → 将 container 从 cacheRoot 移回 placeholder
    → 页面瞬间恢复，无重新挂载 ✅
```

这与 `display: none` 的本质区别：


|             | `display: none`              | 本库（DOM 搬运）              |
| ----------- | ---------------------------- | ----------------------------- |
| 布局影响    | ❌ 隐藏组件仍占 flex/grid 位 | ✅ 完全移出文档流             |
| 滚动位置    | ⚠️ 部分场景丢失            | ✅ 天然保留（DOM 节点未销毁） |
| React Fiber | ✅ 保留                      | ✅ 保留（Portal）             |

---

### 2. 生命周期钩子：statusMap 驱动的响应式通知

`useActivated` / `useDeactivated` 不依赖全局事件总线，而是通过 React 自身的状态传播机制实现：

```
KeepAlive 激活时：
  setStatusMap(prev => new Map(prev).set(cacheKey, 'active'))
    │
    ▼
  KeepAliveScope 重新渲染
    │
    ▼
  Portal 重新渲染 KeepAliveItemContext.Provider
  （value 中 activeStatus 从 'inactive' → 'active'）
    │
    ▼
  缓存中的子组件（如 PageA）感知到 context 变化，重新渲染
    │
    ▼
  useActivated 的 useLayoutEffect 执行：
  prevStatus.current === 'inactive' && activeStatus === 'active'
    → callback() ✅
```

**这样设计的好处：**

- 不需要手动清理监听器，组件销毁自动清理
- 不受 React StrictMode 双重调用影响
- 与 React 的渲染时序完全对齐（layoutEffect 在 DOM 变更后同步执行）

状态转换图：

```
   init
    │ 首次挂载
    ▼
  active ◄──────────────── inactive
    │   从缓存恢复（激活）      ▲
    │                          │
    └──────────────────────────┘
        切换路由/tab（停用）

useActivated  触发条件：inactive → active
useDeactivated 触发条件：active  → inactive
（首次 init → active 不触发，与 Vue 行为一致）
```

---

### 3. 避免 stale closure：containerRef

`useLayoutEffect` 的 cleanup 函数在组件**卸载**时执行，此时闭包捕获的 `caches` 是组件**首次挂载**时的旧值（空 Map），导致 `caches.get(cacheKey)` 返回 `undefined`，提前 return，后续操作全部被跳过。

```ts
// ❌ 有问题的写法：stale closure
useLayoutEffect(() => {
  return () => {
    // 'caches' 是首次渲染时的旧值，此时 entry 还没有被添加进去！
    const entry = caches.get(cacheKey); // → undefined
    if (!entry) return;                 // 提前退出，setStatusMap 不执行
    setStatusMap(...);                  // ← 永远不会被调用
  };
}, [cacheKey]);

// ✅ 本库的解法：containerRef
const containerRef = useRef(null);
containerRef.current = container; // 每次渲染更新，永远是最新值

useLayoutEffect(() => {
  return () => {
    const container = containerRef.current; // ← 始终是当前值
    if (!container) return;
    cacheRoot.appendChild(container);       // 移入隐藏区
    setStatusMap(...);                      // 触发 Portal 重渲染 ✅
  };
}, [cacheKey]);
```

---

### 4. 避免无限更新循环：直接 mutation

当父组件重新渲染时，会创建新的 `children` JSX 对象（引用变化），需要同步到 cache entry 的 `element` 字段，以确保 Portal 渲染的是最新内容。

如果用 `useEffect` + `setCaches` 来同步，会产生无限循环：

```
setCaches → KeepAliveScope context 更新
  → 父组件（读取 context）重新渲染
    → 新的 children 引用
      → useEffect([children]) 触发
        → setCaches → 循环！
```

本库改用**直接 mutation**（在 layoutEffect 里直接修改 entry 对象），不触发 setState，从而打破循环：

```ts
useIsomorphicLayoutEffect(() => {
  const entry = caches.get(cacheKey);
  if (entry) {
    // 直接修改 entry.element，不调用 setCaches
    // 下次 KeepAliveScope 因其他原因重渲染时，会读到最新的 entry.element
    entry.element = children;
  }
}); // 无依赖数组 → 每次渲染后都执行
```

---

### 5. 缓存淘汰策略（LRU / FIFO）

`CacheManager` 在 `caches.size > max` 时自动淘汰，只会淘汰**非激活（inactive）**的缓存项，不会删除正在显示的组件：

```
LRU（最近最少使用）：
  inactive 项按 lastActiveTime 升序排列，最久未访问的先被淘汰

FIFO（先进先出）：
  inactive 项按 createdTime 升序排列，最早创建的先被淘汰

淘汰流程：
  caches.size > max
    → 筛选所有 status === 'inactive' 的项
      → 按策略排序
        → 依次删除，直到 size <= max
          → 被删除项的 container 从 DOM 中移除
            → React Fiber 销毁，内存释放 ✅
```

## 与同类方案对比

市面上主流的 React 缓存方案大致分为两类，各有不同的实现路线和权衡：

### 整体对比


| 维度            | **本库**          | react-activation              | keepalive-for-react |
| --------------- | ----------------- | ----------------------------- | ------------------- |
| React 版本兼容  | ✅ 18 / 19 原生   | ⚠️ R18 部分兼容，R19 不稳定 | ✅ 18 / 19          |
| 实现原理        | Portal + DOM 搬运 | Fiber 内部 hack               | Portal + CSS 隐藏   |
| React 内部 API  | ✅ 全公开 API     | ❌ 使用私有 Fiber 字段        | ✅ 公开 API         |
| Concurrent Mode | ✅ 完全兼容       | ⚠️ 存在问题                 | ✅ 兼容             |
| 布局影响        | ✅ 无（物理移出） | ✅ 无                         | ❌ 占位             |
| 生命周期钩子    | ✅ 响应式传播     | ✅ 支持                       | ⚠️ 较弱           |
| React Router v6 | ✅ 原生集成       | ⚠️ 需要额外配置             | ✅ 支持             |
| TypeScript      | ✅ 完整           | ⚠️ 部分                     | ✅ 完整             |
| 零依赖          | ✅                | ❌                            | ✅                  |
| 包大小          | ~5KB              | ~15KB                         | ~8KB                |

---

### 逐项详解

#### react-activation（最流行，但有 Fiber hack 风险）

[react-activation](https://github.com/CJY0208/react-activation) 是目前 Star 最多的同类方案。它通过直接操作 React Fiber 内部结构（`__reactFiber`、`_reactInternals`）来"接管"子树的渲染：

```js
// react-activation 内部实现（简化示意）
const fiber = instance.__reactFiber          // ❌ 访问私有字段
fiber.child.stateNode.forceUpdate()          // ❌ 强制更新 Fiber 节点
```

**风险**：React 的私有 Fiber 字段在任何版本都可能改名/移除。React 18 的 Concurrent Mode 引入了调度优先级，直接操作 Fiber 可能导致渲染状态不一致，在 React 19 中已出现多个已知 Bug。

**本库的做法**：零 Fiber 操作，完全使用公开 API（`createPortal`、`useLayoutEffect`、`useState`），不受 React 版本迭代影响。

---

#### keepalive-for-react（Portal 方案，但用 CSS 隐藏）

[keepalive-for-react](https://github.com/irychen/keepalive-for-react) 与本库思路相近，同样使用 Portal，但选择用 CSS `display: none` 控制显隐：

```
keepalive-for-react 的隐藏方式：
  <div style="display: none">
    <Portal → 缓存的组件 />   ← 组件仍在 DOM 中，只是不可见
  </div>

本库的隐藏方式：
  <div style="display: none">   ← cacheRoot，始终隐藏
    ← container 物理移入（appendChild）
  </div>
  <placeholder />               ← container 物理移出（appendChild 回来）
```

`display: none` 的方案存在两个问题：

1. **布局污染**：隐藏容器仍然参与 CSS Stacking Context 计算，影响 `z-index`、`overflow` 等属性
2. **滚动位置**：部分浏览器在 `display: none` 时会重置 `scrollTop`

本库的 DOM 物理搬运彻底规避了这两个问题。

### 本库解决的独特问题

除了上述方案级差异，本库在实现过程中针对性地解决了两个容易被忽视的技术问题：

**① stale closure 陷阱**

`useLayoutEffect` cleanup 在组件卸载时，闭包里的 `caches` 是**首次挂载时的旧值**（空 Map）。大多数同类方案直接读取闭包变量，导致 cleanup 提前 return，生命周期钩子和 DOM 移动操作均被跳过。本库通过 `containerRef` 规避此问题（详见「实现原理」第 3 节）。

**② 无限更新循环**

如果用 `useEffect([children]) → setCaches` 同步子组件 props 变化，当父组件读取了 KeepAlive context（如展示缓存状态面板），会形成：`setCaches → context 更新 → 父组件重渲染 → 新 children 引用 → useEffect 再触发` 的死循环。本库通过直接 mutation `entry.element`（不触发 setState）打破循环（详见「实现原理」第 4 节）。

## 注意事项

- ⚠️ **不要与 `React.StrictMode` 同时使用**（StrictMode 双重渲染会干扰缓存逻辑）
- ⚠️ **`cacheKey` 必须唯一且稳定**，避免使用随机值
- ⚠️ `useActivated` / `useDeactivated` 必须在 `<KeepAliveScope>` 内部使用

## 开发

```bash
# 安装依赖
npm install

# 启动 Demo
npm run demo:install
npm run demo

# 运行测试
npm test

# 构建
npm run build
```

## License

MIT © 2026
