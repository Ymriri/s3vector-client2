import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Shell from './Shell';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
}

function renderShellAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route
            path="*"
            element={
              <>
                <div>page-content</div>
                <LocationProbe />
              </>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Shell', () => {
  it('renders the primary navigation items', () => {
    renderShellAt('/');

    expect(
      screen.getByRole('menuitem', { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /vector buckets/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /query console/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /settings/i })
    ).toBeInTheDocument();
  });

  it('highlights Vector Buckets on the bucket list route', () => {
    renderShellAt('/buckets');

    const item = screen
      .getByRole('menuitem', { name: /vector buckets/i })
      .closest('li');
    expect(item?.className).toContain('ant-menu-item-selected');
  });

  it('highlights the nearest parent route on a bucket detail route', () => {
    renderShellAt('/buckets/my-bucket');

    const item = screen
      .getByRole('menuitem', { name: /vector buckets/i })
      .closest('li');
    expect(item?.className).toContain('ant-menu-item-selected');

    const settings = screen
      .getByRole('menuitem', { name: /settings/i })
      .closest('li');
    expect(settings?.className).not.toContain('ant-menu-item-selected');
  });

  it('navigates when a menu item is clicked', async () => {
    renderShellAt('/');
    const user = userEvent.setup();

    await user.click(screen.getByRole('menuitem', { name: /vector buckets/i }));

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/buckets');
  });
});
