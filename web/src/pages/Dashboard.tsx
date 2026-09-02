import React from 'react';
import { formatCurrency } from '../utils/format';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            📊 Business Overview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Your sales command center
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Track stock, sales, and customers in one clean dashboard built for
            day-to-day business use.
          </p>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Sales',
            value: formatCurrency(0),
            accent: 'from-emerald-500 to-teal-500',
            icon: '💰',
            change: '+0%',
          },
          {
            label: 'Total Products',
            value: '0',
            accent: 'from-sky-500 to-cyan-500',
            icon: '📦',
            change: '+0%',
          },
          {
            label: 'Total Customers',
            value: '0',
            accent: 'from-violet-500 to-fuchsia-500',
            icon: '👥',
            change: '+0%',
          },
          {
            label: 'Pending Credits',
            value: formatCurrency(0),
            accent: 'from-amber-500 to-orange-500',
            icon: '⏳',
            change: '+0%',
          },
        ].map(card => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:shadow-xl hover:shadow-slate-900/10"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  {card.change} this month
                </p>
              </div>
              <span className="text-3xl opacity-20 group-hover:opacity-30 transition">
                {card.icon}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">
              Recent Activity
            </h2>
            <Link
              to="/sales"
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-8 text-center">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm text-slate-600">
                No recent activity yet. Sales and customer actions will appear
                here.
              </p>
              <Link
                to="/sales"
                className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Create First Sale
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-lg shadow-slate-900/10">
          <h2 className="mb-6 text-lg font-semibold">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Create Sale', to: '/sales', icon: '🛒' },
              { label: 'Add Product', to: '/products', icon: '📦' },
              { label: 'Add Customer', to: '/customers', icon: '👤' },
            ].map(action => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 hover:border-white/20"
              >
                <span className="text-lg">{action.icon}</span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">
            Top Products
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500" />
                <div className="flex-1 ml-3">
                  <p className="text-sm font-medium text-slate-950">
                    Product {i}
                  </p>
                  <p className="text-xs text-slate-500">0 units sold</p>
                </div>
                <p className="text-sm font-semibold text-slate-950">
                  {formatCurrency(0)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Business Stats */}
        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">
            Business Stats
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Avg. Transaction', value: formatCurrency(0) },
              { label: 'Conversion Rate', value: '0%' },
              { label: 'Customer Lifetime Value', value: formatCurrency(0) },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0"
              >
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="font-semibold text-slate-950">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
