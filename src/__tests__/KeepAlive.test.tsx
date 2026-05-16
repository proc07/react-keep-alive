import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KeepAliveScope } from '../KeepAliveScope';
import { KeepAlive } from '../KeepAlive';
import { useKeepAliveContext } from '../hooks/useKeepAliveContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}

function FormInput() {
  const [value, setValue] = useState('');
  return (
    <input
      data-testid="input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

// Wrapper that renders one of two tabs via KeepAlive
function TabbedApp({ initialTab = 'a' }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <KeepAliveScope>
      <button data-testid="tab-a" onClick={() => setTab('a')}>A</button>
      <button data-testid="tab-b" onClick={() => setTab('b')}>B</button>
      {tab === 'a' && (
        <KeepAlive cacheKey="tab-a">
          <Counter />
        </KeepAlive>
      )}
      {tab === 'b' && (
        <KeepAlive cacheKey="tab-b">
          <FormInput />
        </KeepAlive>
      )}
    </KeepAliveScope>  // ← fixed: was </TabbedApp>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('KeepAlive + KeepAliveScope', () => {
  it('renders children normally on first mount', () => {
    render(
      <KeepAliveScope>
        <KeepAlive cacheKey="test">
          <div data-testid="child">Hello</div>
        </KeepAlive>
      </KeepAliveScope>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('throws when KeepAlive is used outside KeepAliveScope', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <KeepAlive cacheKey="test">
          <div>test</div>
        </KeepAlive>
      )
    ).toThrow();
    consoleError.mockRestore();
  });

  it('preserves counter state across tab switches', async () => {
    const { getByTestId } = render(<TabbedApp />);

    // Increment counter on tab A
    const btn = getByTestId('count').parentElement!.querySelector('button')!;
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(getByTestId('count').textContent).toBe('2');

    // Switch to tab B
    fireEvent.click(getByTestId('tab-b'));
    await waitFor(() => expect(screen.getByTestId('input')).toBeTruthy());

    // Switch back to tab A — count should still be 2
    fireEvent.click(getByTestId('tab-a'));
    await waitFor(() => expect(getByTestId('count').textContent).toBe('2'));
  });

  it('does not cache when key matches exclude', () => {
    const { getByTestId } = render(
      <KeepAliveScope>
        <KeepAlive cacheKey="excluded" exclude={['excluded']}>
          <Counter />
        </KeepAlive>
      </KeepAliveScope>
    );
    expect(getByTestId('count')).toBeTruthy();
  });
});

// ─── useKeepAliveContext ───────────────────────────────────────────────────────

describe('useKeepAliveContext', () => {
  function ControlPanel() {
    const { drop, getCacheKeys, activeKey } = useKeepAliveContext();
    const keys = getCacheKeys();
    return (
      <div>
        <span data-testid="active-key">{activeKey ?? 'none'}</span>
        <span data-testid="cache-count">{keys.length}</span>
        <button data-testid="drop-all" onClick={() => drop()}>Drop All</button>
      </div>
    );
  }

  function AppWithPanel() {
    const [tab, setTab] = useState('a');
    return (
      <KeepAliveScope>
        <ControlPanel />
        <button data-testid="switch" onClick={() => setTab((t) => (t === 'a' ? 'b' : 'a'))}>
          Switch
        </button>
        {tab === 'a' && <KeepAlive cacheKey="page-a"><Counter /></KeepAlive>}
        {tab === 'b' && <KeepAlive cacheKey="page-b"><Counter /></KeepAlive>}
      </KeepAliveScope>
    );
  }

  it('drop() clears all caches', async () => {
    const { getByTestId } = render(<AppWithPanel />);
    await waitFor(() => expect(getByTestId('cache-count').textContent).toBe('1'));

    fireEvent.click(getByTestId('switch'));
    await waitFor(() => expect(getByTestId('cache-count').textContent).toBe('2'));

    fireEvent.click(getByTestId('drop-all'));
    await waitFor(() => expect(getByTestId('cache-count').textContent).toBe('0'));
  });

  it('throws when used outside KeepAliveScope', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() { useKeepAliveContext(); return null; }
    expect(() => render(<Bad />)).toThrow();
    consoleError.mockRestore();
  });
});
