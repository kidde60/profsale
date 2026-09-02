import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { getCartCount } = useCart();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/sales', label: 'Sales' },
    { to: '/customers', label: 'Customers' },
    ...(user?.role === 'owner' || user?.permissions?.canViewReports
      ? [{ to: '/reports', label: 'Reports' }]
      : []),
    ...(user?.role === 'owner' || user?.permissions?.canManageEmployees
      ? [{ to: '/staff', label: 'Staff' }]
      : []),
  ];

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30">
              <span className="text-lg font-black">P</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                ProfSale
              </h1>
              <p className="text-xs text-slate-400">
                {user?.email || 'Business workspace'}
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive(item.to)
                    ? 'bg-white text-slate-950 shadow'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/sales"
              className="relative rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Cart
              {getCartCount() > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-950">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive(item.to)
                  ? 'bg-white text-slate-950'
                  : 'bg-white/5 text-slate-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
