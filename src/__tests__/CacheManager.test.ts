import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../CacheManager';
import type { CacheEntry, CacheStatus } from '../types';
import { CACHE_STATUS } from '../constants';

function makeEntry(key: string, status: CacheStatus = CACHE_STATUS.ACTIVE, offset = 0): CacheEntry {
  const container = document.createElement('div');
  const now = Date.now() + offset;
  return { key, element: null as any, container, status, lastActiveTime: now, createdTime: now };
}

describe('CacheManager', () => {
  let manager: CacheManager;

  beforeEach(() => {
    manager = new CacheManager(3, 'LRU');
  });

  // ── CRUD ──────────────────────────────────────────────────────────────────

  it('should start empty', () => {
    expect(manager.size).toBe(0);
  });

  it('should set and get entries', () => {
    const entry = makeEntry('a');
    manager.set(entry);
    expect(manager.has('a')).toBe(true);
    expect(manager.get('a')).toBe(entry);
    expect(manager.size).toBe(1);
  });

  it('should return undefined for missing key', () => {
    expect(manager.get('nope')).toBeUndefined();
  });

  it('should remove an entry and clean up DOM', () => {
    const entry = makeEntry('a');
    const parent = document.createElement('div');
    parent.appendChild(entry.container);
    manager.set(entry);

    manager.remove('a');

    expect(manager.has('a')).toBe(false);
    expect(entry.container.parentNode).toBeNull();
  });

  it('should clear all entries', () => {
    manager.set(makeEntry('a'));
    manager.set(makeEntry('b'));
    manager.clear();
    expect(manager.size).toBe(0);
    expect(manager.keys()).toHaveLength(0);
  });

  it('should return all keys', () => {
    manager.set(makeEntry('a'));
    manager.set(makeEntry('b'));
    expect(manager.keys()).toEqual(expect.arrayContaining(['a', 'b']));
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  it('should activate an entry', () => {
    const entry = makeEntry('a', CACHE_STATUS.INACTIVE);
    const oldTime = entry.lastActiveTime;
    manager.set(entry);
    manager.activate('a');
    expect(manager.get('a')!.status).toBe(CACHE_STATUS.ACTIVE);
    expect(manager.get('a')!.lastActiveTime).toBeGreaterThanOrEqual(oldTime);
  });

  it('should deactivate an entry', () => {
    const entry = makeEntry('a', CACHE_STATUS.ACTIVE);
    manager.set(entry);
    manager.deactivate('a');
    expect(manager.get('a')!.status).toBe(CACHE_STATUS.INACTIVE);
  });

  // ── LRU Eviction ──────────────────────────────────────────────────────────

  it('should evict LRU inactive entry when over max', () => {
    // Fill to max=3
    manager.set(makeEntry('a', CACHE_STATUS.INACTIVE, 0));
    manager.set(makeEntry('b', CACHE_STATUS.INACTIVE, 100));
    manager.set(makeEntry('c', CACHE_STATUS.INACTIVE, 200));
    // Adding 4th should evict 'a' (oldest lastActiveTime)
    manager.set(makeEntry('d', CACHE_STATUS.INACTIVE, 300));
    expect(manager.has('a')).toBe(false);
    expect(manager.has('b')).toBe(true);
    expect(manager.has('d')).toBe(true);
  });

  it('should prefer evicting inactive over active entries', () => {
    manager.set(makeEntry('a', CACHE_STATUS.ACTIVE, 0));    // active — should be protected
    manager.set(makeEntry('b', CACHE_STATUS.INACTIVE, 50)); // inactive — should be evicted first
    manager.set(makeEntry('c', CACHE_STATUS.ACTIVE, 100));
    manager.set(makeEntry('d', CACHE_STATUS.INACTIVE, 200));
    // After adding 4th: b should be evicted (oldest inactive)
    expect(manager.has('b')).toBe(false);
    expect(manager.has('a')).toBe(true);
  });

  // ── FIFO Eviction ─────────────────────────────────────────────────────────

  it('should evict FIFO oldest entry when over max', () => {
    const fifo = new CacheManager(2, 'FIFO');
    // createdTime determined by offset
    const entryA = makeEntry('a', CACHE_STATUS.INACTIVE, 0);
    entryA.createdTime = 100;
    const entryB = makeEntry('b', CACHE_STATUS.INACTIVE, 0);
    entryB.createdTime = 200;
    fifo.set(entryA);
    fifo.set(entryB);

    const entryC = makeEntry('c', CACHE_STATUS.INACTIVE, 0);
    entryC.createdTime = 300;
    fifo.set(entryC);

    // 'a' created first → evicted
    expect(fifo.has('a')).toBe(false);
    expect(fifo.has('b')).toBe(true);
    expect(fifo.has('c')).toBe(true);
  });

  // ── Config ────────────────────────────────────────────────────────────────

  it('should allow changing max and strategy', () => {
    manager.setMax(5);
    manager.setStrategy('FIFO');
    expect(manager.max).toBe(5);
    expect(manager.strategy).toBe('FIFO');
  });
});
