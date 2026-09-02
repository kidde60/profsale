import React from 'react';
import { formatCurrency } from '../utils/format';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Business overview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Your sales command center, tuned for the phone in your pocket.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Track stock, sales, and customers in one clean dashboard built for
            day-to-day business use.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Sales', value: formatCurrency(0), accent: 'from-emerald-500 to-teal-500' },
          { label: 'Total Products', value: '0', accent: 'from-sky-500 to-cyan-500' },
          { label: 'Total Customers', value: '0', accent: 'from-violet-500 to-fuchsia-500' },
          { label: 'Pending Credits', value: formatCurrency(0), accent: 'from-amber-500 to-orange-500' },
        ].map(card => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
            <h3 className="text-sm font-medium text-slate-500">{card.label}</h3>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
          <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            No recent activity yet. Sales and customer actions will appear here.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/10">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            {['Create Sale', 'Add Product', 'Add Customer', 'View Reports'].map(action => (
              <button
                key={action}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
