// ── 滚动位置快照类型 ───────────────────────────────────────────────────────
export type ScrollSnapshot = Map<Element, { scrollTop: number; scrollLeft: number }>;

/** window 级滚动快照：保存 scrollX / scrollY */
export type WindowScrollSnapshot = { x: number; y: number };

// ── 容器状态管理 (使用 WeakMap 替代在 DOM 上挂载自定义属性) ────────────
interface ContainerScrollState {
  trackerSetup?: boolean;
  scrolledElements?: Set<Element>;
  scrollSnapshots?: ScrollSnapshot;
  windowScroll?: WindowScrollSnapshot;
}

const containerStateMap = new WeakMap<HTMLElement, ContainerScrollState>();

function getContainerState(container: HTMLElement): ContainerScrollState {
  let state = containerStateMap.get(container);
  if (!state) {
    state = {};
    containerStateMap.set(container, state);
  }
  return state;
}

export function setupScrollTracker(container: HTMLElement): void {
  const state = getContainerState(container);
  if (state.trackerSetup) return;
  state.trackerSetup = true;

  const scrolledElements = new Set<Element>();
  state.scrolledElements = scrolledElements;

  // 使用捕获阶段（true）监听内部所有滚动事件
  container.addEventListener(
    'scroll',
    (e) => {
      const target = e.target as Element;
      // document 的滚动不属于内部元素
      if (target && target.nodeType === 1) {
        scrolledElements.add(target);
      }
    },
    true
  );
}

/**
 * 记录 scrollTop / scrollLeft > 0 的节点。
 * 优先读取通过 setupScrollTracker 收集到的滚动元素，实现 O(1) 性能；
 * 若未注册 tracker（如单元测试或特殊调用），则降级为 querySelectorAll 全量遍历。
 */
export function captureScrollPositions(container: HTMLElement): ScrollSnapshot {
  const map: ScrollSnapshot = new Map();

  const capture = (el: Element) => {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      map.set(el, { scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });
    }
  };

  // 1. 先捕获 container 自身
  capture(container);

  // 2. 捕获内部后代元素
  const state = containerStateMap.get(container);
  const scrolledElements = state?.scrolledElements;

  if (scrolledElements) {
    // 性能优化路径：只遍历触发过滚动的子元素
    scrolledElements.forEach((el) => {
      if (container.contains(el)) {
        capture(el);
      } else {
        // 清理已卸载的僵尸节点，避免内存泄漏
        scrolledElements.delete(el);
      }
    });
  } else {
    // 降级路径：全量遍历 DOM 树
    container.querySelectorAll('*').forEach(capture);
  }

  return map;
}

/**
 * 将之前保存的滚动位置逐一恢复。
 * 使用 requestAnimationFrame 确保 DOM 已完成回流（container 已回到可见父节点）。
 */
export function restoreScrollPositions(snapshots: ScrollSnapshot): void {
  if (snapshots.size === 0) return;

  requestAnimationFrame(() => {
    snapshots.forEach(({ scrollTop, scrollLeft }, el) => {
      // 使用原生的 'instant' 强制瞬间跳转，无视 CSS 中的 scroll-behavior: smooth
      el.scrollTo({
        top: scrollTop,
        left: scrollLeft,
        behavior: 'instant' as ScrollBehavior,
      });
    });
  });
}

// ── window 级滚动 ────────────────────────────────────────────────────────────

/**
 * 捕获当前 window 的滚动位置（scrollX / scrollY）。
 * 适用于整页滚动场景（内容撑开 body，没有独立 overflow 容器）。
 */
export function captureWindowScroll(): WindowScrollSnapshot {
  return { x: window.scrollX, y: window.scrollY };
}

/**
 * 恢复 window 的滚动位置。
 * 使用 requestAnimationFrame 确保缓存内容已被重新插入 DOM、完成回流。
 */
export function restoreWindowScroll(snapshot: WindowScrollSnapshot): void {
  requestAnimationFrame(() => {
    // 同样使用 'instant' 覆盖 <html> 上的 smooth scrolling
    window.scrollTo({
      top: snapshot.y,
      left: snapshot.x,
      behavior: 'instant' as ScrollBehavior,
    });
  });
}

// ── 便捷入口：一键保存/恢复 ───────────────────────────────────────────────────

export function saveScrollState(container: HTMLElement): void {
  const state = getContainerState(container);
  state.scrollSnapshots = captureScrollPositions(container);
  if (typeof window !== 'undefined') {
    state.windowScroll = captureWindowScroll();
  }
}

export function restoreScrollState(container: HTMLElement): void {
  const state = getContainerState(container);
  
  if (state.scrollSnapshots) {
    restoreScrollPositions(state.scrollSnapshots);
    state.scrollSnapshots = undefined; // 恢复后清理
  }
  
  if (state.windowScroll) {
    restoreWindowScroll(state.windowScroll);
    state.windowScroll = undefined; // 恢复后清理
  }
}
