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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Customers
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage customer balances and purchase history.
        </p>
      </div>

      <div className="grid gap-4 md:hidden">
        {customers.map(customer => (
          <div
            key={customer.id}
            className="rounded-3xl border border-white/10 bg-white p-5 shadow-lg shadow-slate-900/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-950">{customer.name}</h2>
                <p className="text-sm text-slate-500">{customer.phone || '-'}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  customer.credit_balance > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {customer.credit_balance > 0 ? 'Credit due' : 'Clear'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-slate-500">Total Purchases</div>
                <div className="mt-1 font-semibold text-slate-950">
                  {formatCurrency(customer.total_purchases)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-slate-500">Credit Balance</div>
                <div className="mt-1 font-semibold text-slate-950">
                  {formatCurrency(customer.credit_balance || 0)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white shadow-lg shadow-slate-900/5 md:block">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Total Purchases</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Credit Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map(customer => (
              <tr key={customer.id} className="transition hover:bg-slate-50/70">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-950">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{customer.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {formatCurrency(customer.total_purchases)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={customer.credit_balance > 0 ? 'text-rose-600' : 'text-slate-600'}>
                    {formatCurrency(customer.credit_balance || 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
