import React, { useEffect, useState } from 'react';
import { customerService } from '../api/customers';
import { formatCurrency } from '../utils/format';

interface Customer {
  id: number;
  name: string;
  phone: string;
  total_purchases: number;
  credit_balance: number;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers({ limit: 50 });
      setCustomers(response.data?.customers || response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalCustomers = customers.length;
  const totalCreditDue = customers.reduce(
    (sum, c) => sum + Math.max(0, c.credit_balance),
    0,
  );
  const totalPurchases = customers.reduce(
    (sum, c) => sum + c.total_purchases,
    0,
  );

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">👥</div>
          <p className="text-lg text-slate-600">Loading customers...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Customers
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage customer balances and purchase history.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total Customers',
            value: totalCustomers,
            icon: '👥',
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Total Purchases',
            value: formatCurrency(totalPurchases),
            icon: '💰',
            color: 'from-emerald-500 to-teal-500',
          },
          {
            label: 'Credit Due',
            value: formatCurrency(totalCreditDue),
            icon: '⏳',
            color: 'from-amber-500 to-orange-500',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="group rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5 transition hover:shadow-xl"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color} rounded-t-3xl`}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-950">
                  {stat.value}
                </p>
              </div>
              <span className="text-3xl opacity-20 group-hover:opacity-30 transition">
                {stat.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="rounded-3xl border border-white/10 bg-white p-4 shadow-lg shadow-slate-900/5">
        <input
          type="text"
          placeholder="Search customers by name or phone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="grid gap-4 md:hidden">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className="group rounded-3xl border border-white/10 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:shadow-xl hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-semibold">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-950">
                        {customer.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {customer.phone || 'No phone'}
                      </p>
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                    customer.credit_balance > 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {customer.credit_balance > 0 ? '⚠️ Credit' : '✓ Clear'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-3">
                  <div className="text-slate-500 text-xs">Total Purchases</div>
                  <div className="mt-1 font-bold text-slate-950">
                    {formatCurrency(customer.total_purchases)}
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-3">
                  <div className="text-slate-500 text-xs">Credit Balance</div>
                  <div
                    className={`mt-1 font-bold ${
                      customer.credit_balance > 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(customer.credit_balance || 0)}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">No customers found</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white shadow-lg shadow-slate-900/5 md:block">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Total Purchases
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Credit Balance
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr
                  key={customer.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-950">
                        {customer.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {customer.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-950">
                    {formatCurrency(customer.total_purchases)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        customer.credit_balance > 0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(customer.credit_balance || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        customer.credit_balance > 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {customer.credit_balance > 0
                        ? '⚠️ Credit Due'
                        : '✓ Clear'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-slate-600"
                >
                  No customers found matching your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
