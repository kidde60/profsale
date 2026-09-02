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
        {/* Left Panel - Features */}
        <div className="hidden space-y-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 text-white backdrop-blur-xl lg:block">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30">
              <span className="text-lg font-black">P</span>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
              ProfSale
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Built for fast checkout, stock control, and Ugandan businesses.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
              Sell faster, stay mobile-friendly, and keep every price in UGX.
              Your complete business management solution.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-3">
            {[
              {
                icon: '💰',
                label: 'Local Currency',
                value: formatCurrency(25000),
              },
              { icon: '📱', label: 'Mobile Ready', value: 'Responsive UI' },
              { icon: '⚡', label: 'Fast Checkout', value: 'Optimized POS' },
              { icon: '📊', label: 'Real-time Stats', value: 'Live Dashboard' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur transition hover:bg-white/15"
              >
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <div className="text-xs text-slate-400">{feature.label}</div>
                  <div className="font-semibold text-white">
                    {feature.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
          <div className="mb-8 space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-slate-950">Welcome Back</h1>
            <p className="text-sm text-slate-600">
              Sign in to your ProfSale account
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <span className="mt-0.5 text-lg">⚠️</span>
              <div>
                <p className="font-medium text-red-900">Login Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 font-semibold text-white transition duration-200 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Legal Links */}
          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-600">
            <p>
              By signing in, you agree to our{' '}
              <Link
                to="/privacy-policy"
                className="font-medium text-amber-600 transition hover:text-amber-700 hover:underline"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/terms-of-service"
                className="font-medium text-amber-600 transition hover:text-amber-700 hover:underline"
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
