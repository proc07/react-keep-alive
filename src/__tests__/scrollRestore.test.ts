import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { captureScrollPositions, restoreScrollPositions } from '../scroll';

// ─── 工具函数：为元素设置可读写的 scrollTop/scrollLeft ─────────────────────────
function mockScroll(el: Element, scrollTop: number, scrollLeft: number) {
  let _top = scrollTop;
  let _left = scrollLeft;
  Object.defineProperty(el, 'scrollTop', {
    get: () => _top,
    set: (v) => { _top = v; },
    configurable: true,
  });
  Object.defineProperty(el, 'scrollLeft', {
    get: () => _left,
    set: (v) => { _left = v; },
    configurable: true,
  });
}

// ─── captureScrollPositions ────────────────────────────────────────────────────

describe('captureScrollPositions', () => {
  it('scrollTop > 0 的子元素应被捕获', () => {
    const container = document.createElement('div');
    const child = document.createElement('div');
    container.appendChild(child);
    mockScroll(child, 100, 0);

    const snapshot = captureScrollPositions(container);

    expect(snapshot.size).toBe(1);
    expect(snapshot.get(child)).toEqual({ scrollTop: 100, scrollLeft: 0 });
  });

  it('scrollLeft > 0 的子元素应被捕获', () => {
    const container = document.createElement('div');
    const child = document.createElement('div');
    container.appendChild(child);
    mockScroll(child, 0, 75);

    const snapshot = captureScrollPositions(container);

    expect(snapshot.size).toBe(1);
    expect(snapshot.get(child)).toEqual({ scrollTop: 0, scrollLeft: 75 });
  });

  it('scrollTop 和 scrollLeft 均为 0 的元素不应被捕获', () => {
    const container = document.createElement('div');
    const child = document.createElement('div');
    container.appendChild(child);
    // scrollTop/scrollLeft 默认为 0，无需 mock

    const snapshot = captureScrollPositions(container);

    expect(snapshot.size).toBe(0);
  });

  it('container 自身有滚动时也应被捕获', () => {
    const container = document.createElement('div');
    mockScroll(container, 200, 0);

    const snapshot = captureScrollPositions(container);

    expect(snapshot.get(container)).toEqual({ scrollTop: 200, scrollLeft: 0 });
  });

  it('多个可滚动子元素均应被捕获', () => {
    const container = document.createElement('div');
    const child1 = document.createElement('div');
    const child2 = document.createElement('div');
    const child3 = document.createElement('div'); // 无滚动
    container.appendChild(child1);
    container.appendChild(child2);
    container.appendChild(child3);
    mockScroll(child1, 300, 0);
    mockScroll(child2, 0, 120);

    const snapshot = captureScrollPositions(container);

    expect(snapshot.size).toBe(2);
    expect(snapshot.get(child1)).toEqual({ scrollTop: 300, scrollLeft: 0 });
    expect(snapshot.get(child2)).toEqual({ scrollTop: 0, scrollLeft: 120 });
    expect(snapshot.has(child3)).toBe(false);
  });

  it('嵌套子元素也应被深度遍历捕获', () => {
    const container = document.createElement('div');
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.appendChild(inner);
    container.appendChild(outer);
    mockScroll(inner, 500, 0);

    const snapshot = captureScrollPositions(container);

    expect(snapshot.has(inner)).toBe(true);
    expect(snapshot.get(inner)).toEqual({ scrollTop: 500, scrollLeft: 0 });
  });

  it('空容器返回空 Map', () => {
    const container = document.createElement('div');

    const snapshot = captureScrollPositions(container);

    expect(snapshot.size).toBe(0);
  });
});

// ─── restoreScrollPositions ───────────────────────────────────────────────────

describe('restoreScrollPositions', () => {
  let rafSpy: MockInstance<typeof globalThis.requestAnimationFrame>;

  beforeEach(() => {
    // 让 requestAnimationFrame 同步执行，便于断言
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
  });

  it('应将 scrollTop/scrollLeft 恢复到快照值', () => {
    const el = document.createElement('div');
    let scrollTop = 0;
    let scrollLeft = 0;
    Object.defineProperty(el, 'scrollTop', {
      get: () => scrollTop, set: (v) => { scrollTop = v; }, configurable: true,
    });
    Object.defineProperty(el, 'scrollLeft', {
      get: () => scrollLeft, set: (v) => { scrollLeft = v; }, configurable: true,
    });

    const snapshots = new Map([[el, { scrollTop: 300, scrollLeft: 150 }]]);
    restoreScrollPositions(snapshots);

    expect(scrollTop).toBe(300);
    expect(scrollLeft).toBe(150);
    expect(rafSpy).toHaveBeenCalledOnce();
  });

  it('多个元素均应被恢复', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    let top1 = 0, left1 = 0, top2 = 0, left2 = 0;
    Object.defineProperty(el1, 'scrollTop',  { get: () => top1,  set: (v) => { top1 = v; }, configurable: true });
    Object.defineProperty(el1, 'scrollLeft', { get: () => left1, set: (v) => { left1 = v; }, configurable: true });
    Object.defineProperty(el2, 'scrollTop',  { get: () => top2,  set: (v) => { top2 = v; }, configurable: true });
    Object.defineProperty(el2, 'scrollLeft', { get: () => left2, set: (v) => { left2 = v; }, configurable: true });

    const snapshots = new Map([
      [el1, { scrollTop: 100, scrollLeft: 20 }],
      [el2, { scrollTop: 0,   scrollLeft: 60 }],
    ]);
    restoreScrollPositions(snapshots);

    expect(top1).toBe(100);
    expect(left1).toBe(20);
    expect(top2).toBe(0);
    expect(left2).toBe(60);
  });

  it('快照为空时不应调用 requestAnimationFrame', () => {
    restoreScrollPositions(new Map());

    expect(rafSpy).not.toHaveBeenCalled();
  });
});

// ─── 往返流程：捕获 → 恢复 ────────────────────────────────────────────────────

describe('捕获 → 恢复 完整流程', () => {
  let rafSpy: MockInstance<typeof globalThis.requestAnimationFrame>;

  beforeEach(() => {
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
  });

  it('捕获后再恢复，元素 scrollTop 应回到原始值', () => {
    const container = document.createElement('div');
    const child = document.createElement('div');
    container.appendChild(child);

    let currentScrollTop = 0;
    Object.defineProperty(child, 'scrollTop', {
      get: () => currentScrollTop,
      set: (v) => { currentScrollTop = v; },
      configurable: true,
    });
    Object.defineProperty(child, 'scrollLeft', {
      get: () => 0, set: () => {}, configurable: true,
    });

    // 模拟用户滚动到 400px
    currentScrollTop = 400;

    // 停用时捕获
    const snapshot = captureScrollPositions(container);
    expect(snapshot.get(child)?.scrollTop).toBe(400);

    // 模拟 DOM 移动后 scrollTop 被浏览器重置（display:none 的极端情况）
    currentScrollTop = 0;

    // 激活时恢复
    restoreScrollPositions(snapshot);
    expect(currentScrollTop).toBe(400);
  });
});

// ─── window 级滚动 ────────────────────────────────────────────────────────────

import { captureWindowScroll, restoreWindowScroll } from '../scroll';

describe('captureWindowScroll', () => {
  it('应返回当前 window.scrollX / scrollY', () => {
    Object.defineProperty(window, 'scrollX', { value: 120, writable: true, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 640, writable: true, configurable: true });

    const snap = captureWindowScroll();

    expect(snap).toEqual({ x: 120, y: 640 });
  });

  it('window 未滚动时应返回 { x: 0, y: 0 }', () => {
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });

    const snap = captureWindowScroll();

    expect(snap).toEqual({ x: 0, y: 0 });
  });
});

describe('restoreWindowScroll', () => {
  let rafSpy: MockInstance<typeof globalThis.requestAnimationFrame>;
  let scrollToSpy: MockInstance<typeof window.scrollTo>;

  beforeEach(() => {
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    rafSpy.mockRestore();
    scrollToSpy.mockRestore();
  });

  it('应调用 window.scrollTo 并传入正确坐标', () => {
    restoreWindowScroll({ x: 120, y: 640 });

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 640,
      left: 120,
      behavior: 'instant',
    });
  });

  it('应在 requestAnimationFrame 回调内执行', () => {
    // 让 rAF 不立即执行，验证 scrollTo 在 rAF 之前不被调用
    rafSpy.mockImplementation(() => 0); // 不执行 cb
    restoreWindowScroll({ x: 0, y: 500 });

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});

describe('window 滚动往返流程', () => {
  let rafSpy: MockInstance<typeof globalThis.requestAnimationFrame>;
  let scrollToSpy: MockInstance<typeof window.scrollTo>;

  beforeEach(() => {
    rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
  });

  afterEach(() => {
    rafSpy.mockRestore();
    scrollToSpy.mockRestore();
  });

  it('捕获后再恢复，window.scrollTo 应接收到正确坐标', () => {
    // 模拟用户滚动到 (0, 800)
    Object.defineProperty(window, 'scrollY', { value: 800, writable: true, configurable: true });

    // 停用时捕获
    const snap = captureWindowScroll();
    expect(snap).toEqual({ x: 0, y: 800 });

    // 模拟路由切换后 window 回到顶部
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });

    // 激活时恢复
    restoreWindowScroll(snap);
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 800,
      left: 0,
      behavior: 'instant',
    });
  });
});
