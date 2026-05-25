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

  it('drop() clears all caches (active page is recreated/remounted)', async () => {
    const { getByTestId } = render(<AppWithPanel />);
    await waitFor(() => expect(getByTestId('cache-count').textContent).toBe('1'));

    fireEvent.click(getByTestId('switch'));
    await waitFor(() => expect(getByTestId('cache-count').textContent).toBe('2'));

    // Increment count on tab B (scoped to avoid hidden counter from tab A)
    const pageBContainer = document.querySelector('[data-keep-alive-key="page-b"]') as HTMLElement;
    const plusBtn = pageBContainer.querySelector('button')!;
    const countSpan = pageBContainer.querySelector('[data-testid="count"]')!;
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    expect(countSpan.textContent).toBe('2');

    // Drop all. Inactive page-a is removed, active page-b is dropped and immediately recreated.
    // So cache count should be 1 (page-b), and the state of page-b is reset to 0.
    fireEvent.click(getByTestId('drop-all'));
    await waitFor(() => expect(getByTestId('cache-count').textContent).toBe('1'));
    
    // Scoped query again to get the newly mounted DOM element
    const pageBContainerNew = document.querySelector('[data-keep-alive-key="page-b"]') as HTMLElement;
    expect(pageBContainerNew.querySelector('[data-testid="count"]')!.textContent).toBe('0');
    expect(getByTestId('active-key').textContent).toBe('page-b');
  });

  it('refresh(key) remounts active component and resets its state', async () => {
    function RefreshButton() {
      const { refresh } = useKeepAliveContext();
      return (
        <button data-testid="refresh-btn" onClick={() => refresh('page-a')}>Refresh Page A</button>
      );
    }

    function AppWithRefresh() {
      return (
        <KeepAliveScope>
          <RefreshButton />
          <KeepAlive cacheKey="page-a">
            <Counter />
          </KeepAlive>
        </KeepAliveScope>
      );
    }

    const { getByTestId } = render(<AppWithRefresh />);
    await waitFor(() => expect(document.querySelector('[data-keep-alive-key="page-a"]')).toBeTruthy());

    // Increment count
    const pageAContainer = document.querySelector('[data-keep-alive-key="page-a"]') as HTMLElement;
    const plusBtn = pageAContainer.querySelector('button')!;
    const countSpan = pageAContainer.querySelector('[data-testid="count"]')!;
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    expect(countSpan.textContent).toBe('2');

    // Trigger refresh
    fireEvent.click(getByTestId('refresh-btn'));

    // Component should still be rendered (element is present) but state should be reset to 0
    await waitFor(() => {
      const pageAContainerNew = document.querySelector('[data-keep-alive-key="page-a"]') as HTMLElement;
      expect(pageAContainerNew.querySelector('[data-testid="count"]')!.textContent).toBe('0');
    });
  });

  it('throws when used outside KeepAliveScope', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() { useKeepAliveContext(); return null; }
    expect(() => render(<Bad />)).toThrow();
    consoleError.mockRestore();
  });
});
