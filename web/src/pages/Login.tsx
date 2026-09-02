import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,_#020617,_#0f172a_45%,_#111827)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <div className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white backdrop-blur lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">ProfSale</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Built for fast checkout, stock control, and Ugandan businesses.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
            Sell faster, stay mobile-friendly, and keep every price in UGX.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-slate-300">Currency</div>
              <div className="mt-1 text-lg font-semibold">{formatCurrency(25000)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-slate-300">Mobile ready</div>
              <div className="mt-1 text-lg font-semibold">Responsive UI</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8">
          <h1 className="mb-6 text-center text-2xl font-bold">ProfSale Login</h1>
          {error && (
            <div className="mb-4 rounded-xl bg-red-100 p-3 text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-emerald-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:bg-emerald-300"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-6 border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
            <p>
              By logging in, you agree to our{' '}
              <Link
                to="/privacy-policy"
                className="text-blue-600 hover:underline"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/terms-of-service"
                className="text-blue-600 hover:underline"
              >
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
