# react-keep-alive-max

> 类 Vue `<keep-alive>` 的 React 18/19 组件缓存插件 — 缓存组件状态，避免切换时重新渲染销毁，提升性能。

[![npm version](https://img.shields.io/npm/v/react-keep-alive-max)](https://www.npmjs.com/package/react-keep-alive-max)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 功能特性

- ✅ **状态缓存** — 切换组件时保留 state、DOM、滚动位置自动恢复
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


---

### 5. 缓存淘汰策略（LRU / FIFO）

`CacheManager` 在 `caches.size > max` 时自动淘汰，只会淘汰**非激活（inactive）**的缓存项，不会删除正在显示的组件：

```
LRU（最近最少使用）：
  inactive 项按 lastActiveTime 升序排列，最久未访问的先被淘汰

FIFO（先进先出）：
  inactive 项按 createdTime 升序排列，最早创建的先被淘汰
```

#### 本库实现方案

实现原理：结合了 Portal 的 DOM 存活能力与 Suspense 的组件冻结能力。

- DOM 移动：组件在休眠时，通过 Portal 被移动到全局隐藏的 cacheRoot 容器，确保 DOM 不被销毁。
- Suspense 冻结：通过自定义 <Suspender> 组件，在 isActive = false 时主动 throw 一个 Pending 状态的 - Promise，强制让 React 的 Suspense 边界将整个子树挂起（Suspend）。
- 屏蔽罩设计：在 Portal 外部嵌套了自定义路由上下文 Provider，拦截了 UNSAFE_RouteContext 和 UNSAFE_LocationContext，防止后台挂起的组件在路由切换的瞬间读到脏路由数据而崩溃。
- 采用“双层 div 节点”（即外层 placeholder 占位符和内层 container 容器）的设计。

  绕过 React 的 DOM 销毁机制（最核心原因）
  外层 placeholder 是由 React 渲染和管理的： 当用户切换页面，KeepAlive 组件卸载（Unmount）时，React 会自动删除页面上的 placeholder DOM 节点。
  内层 container 是纯手动创建并受保护的： 为了保持缓存组件的生命周期（Fiber 树和 DOM 状态），Portal 必须渲染在一个永远不被 React 销毁的 DOM 容器中。 因此，内层的 container 是通过 document.createElement('div') 手动创建的。
  分工协作：
  当组件**停用（卸载）**时：我们在 React 销毁 placeholder 之前，把内层 container 强行剪切并移到隐藏的 cacheRoot 下，使其得以存活。
  当组件**重新激活（挂载）**时：React 重新渲染出一个新的 placeholder，我们再把存活的 container 剪切回来挂载到它下面。
  如果只有一层，React 卸载组件时会将这个唯一的 div 连同里面的 Portal 实例一起彻底从 DOM 树和 Fiber 树中抹去，缓存就会失效。

优势：
完全使用 React 官方标准的公开 API（Suspense、Portal），稳定性极高。
挂起期间后台组件的重绘和状态更新会被 React 拦截，实现真正的零 CPU 开销。

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
