// ─── Components ──────────────────────────────────────────────────────────────
export { KeepAliveScope } from './KeepAliveScope';
export { KeepAlive } from './KeepAlive';
export { KeepAliveRouteOutlet } from './router/KeepAliveRouteOutlet';
export type { KeepAliveRouteOutletProps } from './router/KeepAliveRouteOutlet';

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useActivated } from './hooks/useActivated';
export { useDeactivated } from './hooks/useDeactivated';
export { useKeepAliveContext } from './hooks/useKeepAliveContext';

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  EvictionStrategy,
  CacheEntry,
  CacheStatus,
  KeepAliveScopeProps,
  KeepAliveProps,
  KeepAliveContextValue,
} from './types';
export type { KeepAliveControls } from './hooks/useKeepAliveContext';
export type { KeepAliveItemContextValue } from './KeepAliveItemContext';
