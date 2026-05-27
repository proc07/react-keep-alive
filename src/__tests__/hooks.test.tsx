import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor, within } from '@testing-library/react';
import { KeepAliveScope } from '../KeepAliveScope';
import { KeepAlive } from '../KeepAlive';
import { useActivated } from '../hooks/useActivated';
import { useDeactivated } from '../hooks/useDeactivated';
import { MemoryRouter, useLocation, Routes, Route, useNavigate, Outlet, createMemoryRouter, RouterProvider, useParams } from 'react-router-dom';
import { useKeepAliveContext } from '../hooks/useKeepAliveContext';
import { KeepAliveRouteOutlet } from '../router/KeepAliveRouteOutlet';

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

  it('does not re-render inactive components when location or keep-alive context changes', async () => {
    let renderCount = 0;

    function TestPage() {
      const location = useLocation();
      const keepAlive = useKeepAliveContext();
      renderCount++;
      console.log('--- TestPage Render #' + renderCount + ' ---', {
        pathname: location.pathname,
        activeKey: keepAlive.activeKey
      });
      console.log(new Error().stack);
      return (
        <div>
          Page: {location.pathname}
          ActiveKey: {keepAlive.activeKey}
        </div>
      );
    }

    function App() {
      const navigate = useNavigate();
      return (
        <KeepAliveScope>
          <button data-testid="to-form" onClick={() => navigate('/form')}>Form</button>
          <button data-testid="to-list" onClick={() => navigate('/list')}>List</button>
          <Routes>
            <Route
              path="/form"
              element={
                <KeepAlive cacheKey="/form">
                  <TestPage />
                </KeepAlive>
              }
            />
            <Route
              path="/list"
              element={
                <KeepAlive cacheKey="/list">
                  <div>List Page</div>
                </KeepAlive>
              }
            />
          </Routes>
        </KeepAliveScope>
      );
    }

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/form']}>
        <App />
      </MemoryRouter>
    );

    // Initial render of TestPage on /form
    expect(renderCount).toBe(1);

    // Switch to /list
    fireEvent.click(getByTestId('to-list'));
    
    // Wait for route and status updates to propagate
    await new Promise((r) => setTimeout(r, 50));

    // Verify it deactivated, and since it is inactive, it should NOT have re-rendered again!
    // If it was not shadowed, it would have re-rendered because:
    // 1. location changed from /form to /list
    // 2. activeKey in KeepAliveContext changed from /form to /list
    expect(renderCount).toBe(1);
  });

  it('does not re-render inactive components when navigating to a non-keep-alive route', async () => {
    let renderCount = 0;

    function TestPage() {
      const location = useLocation();
      renderCount++;
      console.log('--- Non-KA TestPage Render #' + renderCount + ' ---', {
        pathname: location.pathname
      });
      return <div>Page: {location.pathname}</div>;
    }

    function App() {
      const navigate = useNavigate();
      return (
        <KeepAliveScope>
          <button data-testid="to-form" onClick={() => navigate('/form')}>Form</button>
          <button data-testid="to-non-ka" onClick={() => navigate('/non-ka')}>Non-KA</button>
          <Routes>
            <Route
              path="/form"
              element={
                <KeepAlive cacheKey="/form">
                  <TestPage />
                </KeepAlive>
              }
            />
            <Route
              path="/non-ka"
              element={
                <div>Non-KeepAlive Page</div>
              }
            />
          </Routes>
        </KeepAliveScope>
      );
    }

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/form']}>
        <App />
      </MemoryRouter>
    );

    // Initial render of TestPage on /form
    expect(renderCount).toBe(1);

    // Switch to /non-ka (which is not a KeepAlive route)
    fireEvent.click(getByTestId('to-non-ka'));
    
    // Wait for route and status updates to propagate
    await new Promise((r) => setTimeout(r, 50));

    // Verify it did NOT trigger a re-render of the inactive TestPage (Form)
    expect(renderCount).toBe(1);
  });

  it('preserves nested route Outlet state when navigating back to parent route', async () => {
    function SettingsLayout() {
      return (
        <div>
          <h2>Settings Layout</h2>
          <Outlet />
        </div>
      );
    }

    function ProfilePage() {
      const [val, setVal] = useState('');
      React.useEffect(() => {
        console.log('--- ProfilePage MOUNTED ---');
        return () => console.log('--- ProfilePage UNMOUNTED ---');
      }, []);
      return (
        <div>
          <h3>Profile</h3>
          <input
            data-testid="profile-input"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
        </div>
      );
    }

    function App() {
      const navigate = useNavigate();
      const [count, setCount] = useState(0);
      return (
        <KeepAliveScope>
          <button data-testid="to-dashboard" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button data-testid="to-settings" onClick={() => navigate('/settings/profile')}>
            Settings
          </button>
          <button data-testid="force-rerender" onClick={() => setCount(c => c + 1)}>
            Force Re-render
          </button>
          <KeepAliveRouteOutlet />
        </KeepAliveScope>
      );
    }

    const router = createMemoryRouter([
      {
        path: '/',
        element: <App />,
        children: [
          {
            path: 'settings',
            element: <SettingsLayout />,
            handle: { isKeepalive: true },
            children: [
              {
                path: 'profile',
                element: <ProfilePage />,
              },
              {
                path: 'security',
                element: <div>Security</div>,
              },
            ],
          },
          {
            path: 'dashboard',
            element: <div>Dashboard Page</div>,
          },
        ],
      },
    ], {
      initialEntries: ['/settings/profile'],
    });

    const { getByTestId } = render(<RouterProvider router={router} />);

    // 1. Verify we are on profile page and type something
    const input = getByTestId('profile-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'my-profile-data' } });
    expect(input.value).toBe('my-profile-data');

    // 2. Navigate away to /dashboard
    fireEvent.click(getByTestId('to-dashboard'));
    await new Promise((r) => setTimeout(r, 50));

    // 3. Force re-render of KeepAliveScope while at /dashboard
    fireEvent.click(getByTestId('force-rerender'));
    await new Promise((r) => setTimeout(r, 50));

    // 4. Navigate back to /settings/profile
    fireEvent.click(getByTestId('to-settings'));
    await new Promise((r) => setTimeout(r, 50));

    const activePlaceholder = document.querySelector('[data-keep-alive-placeholder="/settings/profile"]') as HTMLElement;
    const inputAfter = within(activePlaceholder).getByTestId('profile-input') as HTMLInputElement;
    expect(inputAfter.value).toBe('my-profile-data');
  });

  it('preserves correct location pathname in useDeactivated hook when navigating away', async () => {
    let deactivatedPathname: string | null = null;

    function TestPage() {
      const location = useLocation();
      useDeactivated(() => {
        deactivatedPathname = location.pathname;
      });
      return <div>Test Page</div>;
    }

    function App() {
      const navigate = useNavigate();
      return (
        <KeepAliveScope>
          <button data-testid="to-form" onClick={() => navigate('/form')}>Form</button>
          <button data-testid="to-list" onClick={() => navigate('/list')}>List</button>
          <Routes>
            <Route path="/form" element={<KeepAlive cacheKey="/form"><TestPage /></KeepAlive>} />
            <Route path="/list" element={<div>List Page</div>} />
          </Routes>
        </KeepAliveScope>
      );
    }

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/form']}>
        <App />
      </MemoryRouter>
    );

    // Navigate from /form to /list
    fireEvent.click(getByTestId('to-list'));
    await new Promise((r) => setTimeout(r, 50));

    // When /form is deactivated, it should see its own location /form in the hook,
    // not the new location /list!
    expect(deactivatedPathname).toBe('/form');
  });
});


