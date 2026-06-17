import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/donors', label: 'Donors' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/requests', label: 'Requests' },
  { to: '/reports', label: 'Reports' },
  { to: '/directory', label: 'Hospitals & Banks' },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-muted md:flex">
        <div className="border-b border-border px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Navigation</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-soft hover:text-primary'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:ml-60">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 px-6 py-4 shadow-sm backdrop-blur">
          <h1 className="text-xl text-primary">Blood Bank Management System</h1>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-muted px-4 py-2 md:hidden">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-text-muted hover:bg-soft'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
