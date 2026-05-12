import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Layout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const { getCartCount } = useCart();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">ProfSale</h1>
          <div className="flex space-x-4 items-center">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded ${
                isActive('/dashboard') ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/products"
              className={`px-3 py-2 rounded ${
                isActive('/products') ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              Products
            </Link>
            <Link
              to="/sales"
              className={`px-3 py-2 rounded ${
                isActive('/sales') ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              Sales
            </Link>
            <Link
              to="/customers"
              className={`px-3 py-2 rounded ${
                isActive('/customers') ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              Customers
            </Link>
            <Link
              to="/sales"
              className="relative px-3 py-2 rounded hover:bg-blue-500"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M3 1a1 1 0 0 1-1h1a1 1 0 0 1 1v3a1 1 0 0 1-1h-3a1 1 0 0 1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              className="px-3 py-2 rounded bg-red-500 hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
