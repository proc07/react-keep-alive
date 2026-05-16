# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-14

### Added
- `<KeepAliveScope>` — 顶层 Provider，管理全局缓存池
- `<KeepAlive>` — 核心缓存组件，支持 `cacheKey` / `include` / `exclude` / `onActivated` / `onDeactivated`
- `useActivated()` — 组件从缓存恢复时触发（对标 Vue `onActivated`）
- `useDeactivated()` — 组件被推入缓存时触发（对标 Vue `onDeactivated`）
- `useKeepAliveContext()` — 手动控制缓存（`drop` / `refresh` / `getCacheKeys`）
- `<KeepAliveRouteOutlet>` — React Router v6/v7 集成，替代 `<Outlet>`
- LRU / FIFO 双淘汰策略
- 完整 TypeScript 类型声明
- CJS + ESM 双格式输出
- 完整单元测试覆盖（Vitest）
