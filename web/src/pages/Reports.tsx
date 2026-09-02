import React, { useEffect, useState } from 'react';
import { reportsService, type ProfitLossReport } from '../api/reports';
import { formatCurrency } from '../utils/format';

type Period = 'week' | 'month' | 'year' | 'custom';

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const Reports: React.FC = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState(formatDate(new Date()));
  const [customEnd, setCustomEnd] = useState(formatDate(new Date()));
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();

    if (period === 'custom') {
      const s = new Date(`${customStart}T00:00:00`);
      const e = new Date(`${customEnd}T23:59:59`);
      return { startDate: formatDate(s), endDate: formatDateTime(e) };
    }

    if (period === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else {
      start.setFullYear(end.getFullYear() - 1);
    }
    start.setHours(0, 0, 0, 0);

    return { startDate: formatDate(start), endDate: formatDateTime(end) };
  };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const { startDate, endDate } = getRange();
      const data = await reportsService.getProfitLoss(startDate, endDate);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customStart, customEnd]);

  const periodButton = (key: Period, label: string) => (
    <button
      key={key}
      onClick={() => setPeriod(key)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        period === key
          ? 'bg-slate-950 text-white shadow'
          : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
      <h2 className="mb-4 text-lg font-semibold text-slate-950">{title}</h2>
      {children}
    </div>
  );

  const Row: React.FC<{ label: string; value: string; negative?: boolean }> = ({
    label,
    value,
    negative,
  }) => (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-slate-600">{label}</span>
      <span
        className={`font-semibold ${
          negative ? 'text-rose-600' : 'text-slate-950'
        }`}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            📈 Reports
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Profit & Loss Report
          </h1>
          <div className="flex flex-wrap gap-2">
            {periodButton('week', 'Week')}
            {periodButton('month', 'Month')}
            {periodButton('year', 'Year')}
            {periodButton('custom', 'Custom')}
          </div>
          {period === 'custom' && (
            <div className="flex flex-wrap gap-4 pt-2">
              <div>
                <label className="block text-xs text-slate-300">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="mt-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="mt-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {loading && (
        <div className="py-12 text-center text-slate-500">
          <span className="mr-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          Generating report...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      {!loading && report && (
        <>
          <div
            className={`rounded-3xl p-8 text-center shadow-lg ${
              report.profit.netProfit >= 0
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-rose-50 border border-rose-100'
            }`}
          >
            <p className="text-sm text-slate-600">Net Profit</p>
            <p
              className={`my-2 text-4xl font-bold ${
                report.profit.netProfit >= 0
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {formatCurrency(report.profit.netProfit)}
            </p>
            <p className="text-sm text-slate-500">
              {report.profit.netProfitMargin.toFixed(2)}% margin
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Revenue">
              <Row
                label="Total Sales"
                value={formatCurrency(report.revenue.totalRevenue)}
              />
              <Row
                label="Transactions"
                value={report.revenue.totalTransactions.toLocaleString()}
              />
              <Row
                label="Tax Collected"
                value={formatCurrency(report.revenue.totalTax)}
              />
              <Row
                label="Discounts Given"
                value={`-${formatCurrency(report.revenue.totalDiscounts)}`}
                negative
              />
              <Row
                label="Expenses"
                value={`-${formatCurrency(
                  report.costs.totalExpenses + report.costs.inventoryExpenses,
                )}`}
                negative
              />
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-950">Net Revenue</span>
                <span className="font-bold text-slate-950">
                  {formatCurrency(
                    report.revenue.netRevenue -
                      (report.costs.totalExpenses +
                        report.costs.inventoryExpenses),
                  )}
                </span>
              </div>
            </Section>

            <Section title="Expenses">
              <Row
                label="Operational Expenses"
                value={formatCurrency(report.costs.totalExpenses)}
              />
              <Row
                label="Inventory / Restock"
                value={formatCurrency(report.costs.inventoryExpenses)}
              />
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-950">Total Expenses</span>
                <span className="font-bold text-slate-950">
                  {formatCurrency(
                    report.costs.totalExpenses + report.costs.inventoryExpenses,
                  )}
                </span>
              </div>
            </Section>

            <Section title="Profit Analysis">
              <Row
                label="Net Revenue"
                value={formatCurrency(report.revenue.netRevenue)}
              />
              <Row
                label="Cost of Goods Sold"
                value={`-${formatCurrency(report.costs.costOfGoodsSold)}`}
                negative
              />
              <Row
                label="Gross Profit"
                value={formatCurrency(report.profit.grossProfit)}
              />
              <Row
                label="Total Expenses"
                value={`-${formatCurrency(report.costs.totalExpenses)}`}
                negative
              />
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-950">Net Profit</span>
                <span
                  className={`font-bold ${
                    report.profit.netProfit >= 0
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(report.profit.netProfit)}
                </span>
              </div>
              <Row
                label="Gross Profit Margin"
                value={`${report.profit.grossProfitMargin.toFixed(2)}%`}
              />
              <Row
                label="Net Profit Margin"
                value={`${report.profit.netProfitMargin.toFixed(2)}%`}
              />
            </Section>

            <Section title="Expenses by Category">
              {report.expensesByCategory.length === 0 ? (
                <p className="text-slate-500">No expenses in this period</p>
              ) : (
                report.expensesByCategory.map(item => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
                  >
                    <span className="text-slate-600">{item.category}</span>
                    <span className="font-semibold text-slate-950">
                      {formatCurrency(item.total)} ({item.count} entries)
                    </span>
                  </div>
                ))
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
