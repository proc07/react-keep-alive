import type { CacheStatus } from './constants';

type Listener = (status: CacheStatus) => void;

class KeepAliveEventBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(key: string, listener: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  emit(key: string, status: CacheStatus): void {
    const set = this.listeners.get(key);
    if (set) {
      // Copy to array to avoid mutation during iteration
      Array.from(set).forEach((listener) => {
        try {
          listener(status);
        } catch (e) {
          console.error('[react-keep-alive] Error in event subscriber:', e);
        }
      });
    }
  }
}

export const keepAliveEventBus = new KeepAliveEventBus();
