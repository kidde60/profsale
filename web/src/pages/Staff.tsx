import React, { useEffect, useState } from 'react';
import { staffService, type StaffMember } from '../api/staff';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = ['cashier', 'manager', 'admin'];

const roleColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-amber-100 text-amber-700';
    case 'manager':
      return 'bg-violet-100 text-violet-700';
    case 'cashier':
      return 'bg-emerald-100 text-emerald-700';
    case 'inventory_clerk':
      return 'bg-orange-100 text-orange-700';
    case 'accountant':
      return 'bg-blue-100 text-blue-700';
    case 'admin':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const rolePermissions = (role: string) => {
  switch (role) {
    case 'cashier':
      return ['Create sales and manage POS operations'];
    case 'manager':
      return ['View reports', 'Manage staff', 'Manage inventory and sales'];
    case 'admin':
      return [
        'Full access to reports',
        'Manage staff',
        'Manage settings',
        'Manage business operations',
      ];
    default:
      return [];
  }
};

const Staff: React.FC = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('cashier');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canManage =
    user?.role === 'owner' || user?.permissions?.canManageEmployees;

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await staffService.getStaff();
      setStaff(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('cashier');
    setPassword('');
    setConfirmPassword('');
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditing(member);
    setName(member.name);
    setEmail(member.email);
    setPhone(member.phone || '');
    setRole(member.role);
    setPassword('');
    setConfirmPassword('');
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email) {
      setFormError('Name and email are required');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!editing) {
      if (!password) {
        setFormError('Password is required');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editing) {
        await staffService.updateStaff(editing.id, {
          name,
          email,
          phone,
          role,
          is_active: editing.is_active,
        });
      } else {
        await staffService.createStaff({
          name,
          email,
          phone,
          role,
          password,
        });
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || 'Failed to save staff member',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (
    member: StaffMember,
    action: 'activate' | 'deactivate',
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${member.name}?`,
    );
    if (!confirmed) return;

    try {
      if (action === 'activate') {
        await staffService.activateStaff(member.id);
      } else {
        await staffService.deleteStaff(member.id);
      }
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} staff member`);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-2xl shadow-slate-950/20 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              👥 Staff
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Staff Management
            </h1>
          </div>
          {canManage && (
            <button
              onClick={openAdd}
              className="rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
            >
              + Add Staff
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <span className="mr-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          Loading staff...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-4xl mb-2">👤</p>
          <p className="text-slate-600">No staff members yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add staff members to help manage your business
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {staff.map(member => (
            <div
              key={member.id}
              className="rounded-3xl border border-white/10 bg-white p-5 shadow-lg shadow-slate-900/5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    {member.name}
                  </h3>
                  <p className="text-sm text-slate-500">{member.email}</p>
                  {member.phone && (
                    <p className="text-sm text-slate-500">{member.phone}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${roleColor(
                    member.role,
                  )}`}
                >
                  {member.role.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Permissions: {member.permissions?.length ?? 0}
                </span>
                {!member.is_active ? (
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                    Inactive
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                )}
              </div>

              {canManage && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(member)}
                    className="flex-1 rounded-xl bg-amber-50 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Edit
                  </button>
                  {member.is_active ? (
                    <button
                      onClick={() => toggleActive(member, 'deactivate')}
                      className="flex-1 rounded-xl bg-rose-50 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleActive(member, 'activate')}
                      className="flex-1 rounded-xl bg-emerald-50 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Activate
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="mb-6 text-2xl font-semibold text-slate-950">
              {editing ? 'Edit Staff Member' : 'Add Staff Member'}
            </h2>

            {formError && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter staff name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  disabled={!!editing}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {!editing && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </>
              )}

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  {role.charAt(0).toUpperCase() + role.slice(1)} Role
                  Permissions
                </p>
                <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                  {rolePermissions(role).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
