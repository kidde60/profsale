import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import '../styles/AuthPages.css';

const BUSINESS_TYPES = [
  'Retail Shop',
  'Wholesale/Trading',
  'Hardware',
  'Electronics',
  'Accessories',
  'Pharmacy',
  'Supermarket/Grocery',
  'Butchery',
  'E-commerce',
  'Agriculture Products',
  'Other',
];

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail Shop');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName || !lastName || !phone || !businessName || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (email && !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName,
        lastName,
        phone,
        email,
        businessName,
        businessType,
        password,
      });
      setSuccess(
        'Registration successful! Please sign in with your new account.',
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(135deg,_#020617,_#0f172a_45%,_#111827)] px-4 py-10">
      <div className="auth-page-container">
        {/* Left Panel */}
        <div className="auth-promo space-y-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 text-white backdrop-blur-xl">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30">
              <span className="text-lg font-black">P</span>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
              ProfSale
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Start selling smarter today.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
              Create your free account and get your business online in minutes.
              Built for Ugandan businesses and local currency.
            </p>
          </div>

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

        {/* Right Panel - Register Form */}
        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
          <div className="mb-8 space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-slate-950">
              Create Account
            </h1>
            <p className="text-sm text-slate-600">
              Start managing your business with ProfSale
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <span className="mt-0.5 text-lg">⚠️</span>
              <div>
                <p className="font-medium text-red-900">Registration Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <span className="mt-0.5 text-lg">✅</span>
              <div>
                <p className="font-medium text-emerald-900">Success</p>
                <p className="text-sm text-emerald-700">{success}</p>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-3 text-sm font-semibold text-emerald-700 underline hover:text-emerald-800"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +256771362017"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com (optional)"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Your business name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Business Type *
              </label>
              <select
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              >
                {BUSINESS_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 font-semibold text-white transition duration-200 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-amber-600 transition hover:text-amber-700 hover:underline"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-slate-600">
            <p>
              By creating an account, you agree to our{' '}
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

export default Register;
