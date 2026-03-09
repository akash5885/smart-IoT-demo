'use client';

import { useState } from 'react';
import { Users, UserPlus, X, Check, Shield, Headphones, User } from 'lucide-react';

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400', icon: Shield },
  support: { label: 'Support', color: 'bg-amber-500/20 text-amber-400', icon: Headphones },
  user: { label: 'User', color: 'bg-blue-500/20 text-blue-400', icon: User },
};

export default function UsersClient({ currentUser, initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'support' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
      } else {
        setUsers((prev) => [...prev, data.user]);
        setSuccess(`User "${data.user.name}" created successfully`);
        setShowModal(false);
        setForm({ name: '', email: '', password: '', role: 'support' });
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    support: users.filter((u) => u.role === 'support').length,
    user: users.filter((u) => u.role === 'user').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} total users</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3 mb-4">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(ROLE_CONFIG).map(([role, { label, color, icon: Icon }]) => (
          <div key={role} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{counts[role]}</p>
              <p className="text-sm text-slate-400">{label}s</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b border-slate-700">
          <h2 className="font-medium text-white flex items-center gap-2">
            <Users className="w-4 h-4" /> All Users
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => {
                const { label, color } = ROLE_CONFIG[u.role] || ROLE_CONFIG.user;
                const creator = u.createdBy ? users.find((x) => x.id === u.createdBy) : null;
                return (
                  <tr key={u.id} className={`hover:bg-slate-800/50 transition-colors ${u.id === currentUser.id ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {u.name}
                            {u.id === currentUser.id && (
                              <span className="ml-2 text-xs text-blue-400">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge-role ${color}`}>{label}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {creator ? creator.name : <span className="text-slate-600">Self-registered</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="font-semibold text-white">Create New User</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Role *</label>
                <select
                  className="input-field"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="support">Support Agent</option>
                  <option value="user">End User</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => { setShowModal(false); setError(''); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
