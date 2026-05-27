# react-keep-alive-max

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


---

### 5. 缓存淘汰策略（LRU / FIFO）

`CacheManager` 在 `caches.size > max` 时自动淘汰，只会淘汰**非激活（inactive）**的缓存项，不会删除正在显示的组件：

```
LRU（最近最少使用）：
  inactive 项按 lastActiveTime 升序排列，最久未访问的先被淘汰

FIFO（先进先出）：
  inactive 项按 createdTime 升序排列，最早创建的先被淘汰
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

#### 本库方案



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
