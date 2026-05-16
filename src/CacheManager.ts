import type { CacheEntry, EvictionStrategy } from './types';

/**
 * CacheManager
 *
 * 纯 JS 缓存管理器，不依赖 React。
 * 管理 CacheEntry 的增删查改、激活/停用、以及 LRU / FIFO 淘汰策略。
 */
export class CacheManager {
  private _cache: Map<string, CacheEntry> = new Map();
  private _max: number;
  private _strategy: EvictionStrategy;

  constructor(max = 10, strategy: EvictionStrategy = 'LRU') {
    this._max = max;
    this._strategy = strategy;
  }

  // ─── Accessors ─────────────────────────────────────────────────────────────

  get size(): number {
    return this._cache.size;
  }

  get max(): number {
    return this._max;
  }

  get strategy(): EvictionStrategy {
    return this._strategy;
  }

  setMax(max: number): void {
    this._max = max;
  }

  setStrategy(strategy: EvictionStrategy): void {
    this._strategy = strategy;
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  has(key: string): boolean {
    return this._cache.has(key);
  }

  get(key: string): CacheEntry | undefined {
    return this._cache.get(key);
  }

  /**
   * 添加或更新缓存条目。
   * 如果添加后超出 max 上限，自动按策略淘汰。
   */
  set(entry: CacheEntry): void {
    const isNew = !this._cache.has(entry.key);
    this._cache.set(entry.key, entry);
    if (isNew) {
      this._evictIfNeeded();
    }
  }

  remove(key: string): CacheEntry | undefined {
    const entry = this._cache.get(key);
    if (entry) {
      // 清理 DOM 容器
      if (entry.container.parentNode) {
        entry.container.parentNode.removeChild(entry.container);
      }
      this._cache.delete(key);
    }
    return entry;
  }

  clear(): void {
    this._cache.forEach((entry) => {
      if (entry.container.parentNode) {
        entry.container.parentNode.removeChild(entry.container);
      }
    });
    this._cache.clear();
  }

  keys(): string[] {
    return Array.from(this._cache.keys());
  }

  entries(): CacheEntry[] {
    return Array.from(this._cache.values());
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  activate(key: string): void {
    const entry = this._cache.get(key);
    if (entry) {
      entry.status = 'active';
      entry.lastActiveTime = Date.now();
    }
  }

  deactivate(key: string): void {
    const entry = this._cache.get(key);
    if (entry) {
      entry.status = 'inactive';
    }
  }

  // ─── Eviction ──────────────────────────────────────────────────────────────

  private _evictIfNeeded(): void {
    // 只有超出上限时才淘汰（且至少保留当前新增的一个）
    while (this._cache.size > this._max) {
      const keyToEvict = this._findEvictionTarget();
      if (keyToEvict) {
        this.remove(keyToEvict);
      } else {
        break;
      }
    }
  }

  private _findEvictionTarget(): string | null {
    // 只淘汰 inactive（未激活）的条目，避免淘汰当前正在显示的组件
    const inactiveEntries = Array.from(this._cache.values()).filter(
      (e) => e.status === 'inactive'
    );

    if (inactiveEntries.length === 0) {
      // 所有都是 active，只能淘汰最旧的（极端情况）
      const allEntries = Array.from(this._cache.values());
      return this._pickByStrategy(allEntries)?.key ?? null;
    }

    return this._pickByStrategy(inactiveEntries)?.key ?? null;
  }

  private _pickByStrategy(entries: CacheEntry[]): CacheEntry | null {
    if (entries.length === 0) return null;

    if (this._strategy === 'LRU') {
      // 最近最少使用：淘汰 lastActiveTime 最小的
      return entries.reduce((oldest, cur) =>
        cur.lastActiveTime < oldest.lastActiveTime ? cur : oldest
      );
    } else {
      // FIFO：淘汰最早创建的
      return entries.reduce((oldest, cur) =>
        cur.createdTime < oldest.createdTime ? cur : oldest
      );
    }
  }
}
