import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

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
