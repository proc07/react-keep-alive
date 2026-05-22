import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { KeepAliveScope } from '../KeepAliveScope';
import { KeepAlive } from '../KeepAlive';
import { useActivated } from '../hooks/useActivated';
import { useDeactivated } from '../hooks/useDeactivated';

// ─── Helper ───────────────────────────────────────────────────────────────────

function Page({
  onActivated,
  onDeactivated,
  label,
}: {
  onActivated?: () => void;
  onDeactivated?: () => void;
  label: string;
}) {
  useActivated(() => { onActivated?.(); });
  useDeactivated(() => { onDeactivated?.(); });
  return <div data-testid={`page-${label}`}>{label}</div>;
}

function SwitchApp({
  onActivatedA,
  onDeactivatedA,
}: {
  onActivatedA?: () => void;
  onDeactivatedA?: () => void;
}) {
  const [tab, setTab] = useState<'a' | 'b'>('a');
  return (
    <KeepAliveScope>
      <button data-testid="to-a" onClick={() => setTab('a')}>A</button>
      <button data-testid="to-b" onClick={() => setTab('b')}>B</button>
      {tab === 'a' && (
        <KeepAlive cacheKey="a">
          <Page label="a" onActivated={onActivatedA} onDeactivated={onDeactivatedA} />
        </KeepAlive>
      )}
      {tab === 'b' && (
        <KeepAlive cacheKey="b">
          <Page label="b" />
        </KeepAlive>
      )}
    </KeepAliveScope>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useActivated', () => {
  it('does not fire on first mount', async () => {
    const cb = vi.fn();
    render(
      <KeepAliveScope>
        <KeepAlive cacheKey="x">
          <Page label="x" onActivated={cb} />
        </KeepAlive>
      </KeepAliveScope>
    );
    // Give React time to process all effects
    await new Promise((r) => setTimeout(r, 50));
    expect(cb).not.toHaveBeenCalled();
  });

  it('fires when component is restored from cache', async () => {
    const cb = vi.fn();
    const { getByTestId } = render(<SwitchApp onActivatedA={cb} />);

    // Switch A → B (deactivate A into cache)
    fireEvent.click(getByTestId('to-b'));
    await waitFor(() => expect(getByTestId('page-b')).toBeTruthy());

    // Switch B → A (restore A from cache)
    fireEvent.click(getByTestId('to-a'));
    await waitFor(() => expect(getByTestId('page-a')).toBeTruthy());

    // Wait for Portal re-render to propagate activeStatus change
    await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
  });

  it('fires multiple times on repeated tab switches', async () => {
    const cb = vi.fn();
    const { getByTestId } = render(<SwitchApp onActivatedA={cb} />);

    for (let i = 0; i < 3; i++) {
      fireEvent.click(getByTestId('to-b'));
      await waitFor(() => expect(getByTestId('page-b')).toBeTruthy());
      fireEvent.click(getByTestId('to-a'));
      await waitFor(() => expect(getByTestId('page-a')).toBeTruthy());
    }

    await waitFor(() => expect(cb.mock.calls.length).toBeGreaterThanOrEqual(3));
  });
});

describe('useDeactivated', () => {
  it('fires when component is hidden into cache', async () => {
    const cb = vi.fn();
    const { getByTestId } = render(<SwitchApp onDeactivatedA={cb} />);

    fireEvent.click(getByTestId('to-b'));
    await waitFor(() => expect(getByTestId('page-b')).toBeTruthy());

    // Wait for Portal re-render to propagate activeStatus = 'inactive'
    await waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
  });
});

describe('useActivated + useDeactivated order', () => {
  it('deactivates before activating on switch', async () => {
    const events: string[] = [];
    const { getByTestId } = render(
      <SwitchApp
        onDeactivatedA={() => events.push('deactivated')}
        onActivatedA={() => events.push('activated')}
      />
    );

    fireEvent.click(getByTestId('to-b'));
    await waitFor(() => expect(events).toContain('deactivated'));

    fireEvent.click(getByTestId('to-a'));
    await waitFor(() => expect(events).toContain('activated'));

    expect(events[0]).toBe('deactivated');
    expect(events[1]).toBe('activated');
  });
});

describe('render counts', () => {
  it('does not trigger re-render of cached component when deactivating', async () => {
    let renderCount = 0;
    function TrackedPage() {
      renderCount++;
      return <div data-testid="tracked">Tracked</div>;
    }

    function App() {
      const [tab, setTab] = useState<'a' | 'b'>('a');
      return (
        <KeepAliveScope>
          <button data-testid="to-a" onClick={() => setTab('a')}>A</button>
          <button data-testid="to-b" onClick={() => setTab('b')}>B</button>
          {tab === 'a' && (
            <KeepAlive cacheKey="a">
              <TrackedPage />
            </KeepAlive>
          )}
          {tab === 'b' && (
            <KeepAlive cacheKey="b">
              <div>B</div>
            </KeepAlive>
          )}
        </KeepAliveScope>
      );
    }

    const { getByTestId } = render(<App />);
    expect(renderCount).toBe(1); // First render

    // Switch A → B (deactivate A)
    fireEvent.click(getByTestId('to-b'));
    
    // Wait a brief moment to let React commit all effects/renders
    await new Promise((r) => setTimeout(r, 50));

    // Verify it still rendered exactly 1 time! (No extra re-render on deactivation)
    expect(renderCount).toBe(1);
  });
});

