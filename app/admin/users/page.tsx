'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, RefreshCw, AlertCircle, Search, ShieldCheck, ShieldAlert, Ban, Mail, Calendar, Key } from 'lucide-react';
import { adminFetchUsers, adminUpdateUserStatus } from '@/lib/actions/admin';
import { UserProfile } from '@/lib/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'restricted' | 'banned'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLiveUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminFetchUsers();
      setUsers(data as UserProfile[]);
    } catch (err) {
      console.error('Failed to load user accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: UserProfile['account_status']) => {
    setUpdatingId(id);
    try {
      await adminUpdateUserStatus(id, newStatus);
      setUsers((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, account_status: newStatus } : acc))
      );
    } catch (err: any) {
      alert('Error updating user status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchLiveUsers();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.account_status === 'active').length;
    const restricted = users.filter((u) => u.account_status === 'restricted').length;
    const banned = users.filter((u) => u.account_status === 'banned' || u.account_status === 'suspended').length;
    return { total, active, restricted, banned };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((acc) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'banned'
          ? acc.account_status === 'banned' || acc.account_status === 'suspended'
          : acc.account_status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (acc.full_name && acc.full_name.toLowerCase().includes(q)) ||
        (acc.email && acc.email.toLowerCase().includes(q)) ||
        (acc.username && acc.username.toLowerCase().includes(q)) ||
        (acc.id && acc.id.toLowerCase().includes(q)) ||
        (acc.department && acc.department.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [users, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-950 font-heading tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6B00]" />
            User Account Management
          </h1>
          <p className="text-xs text-slate-600">
            Real registered student profiles, authentic credentials, and account enforcement.
          </p>
        </div>

        <button
          onClick={fetchLiveUsers}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B00] ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Users ({users.length})
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered</span>
            <span className="text-xl font-black text-slate-950 font-mono">{isLoading ? '...' : stats.total}</span>
          </div>
          <Users className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Accounts</span>
            <span className="text-xl font-black text-emerald-700 font-mono">{isLoading ? '...' : stats.active}</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Restricted</span>
            <span className="text-xl font-black text-amber-700 font-mono">{isLoading ? '...' : stats.restricted}</span>
          </div>
          <ShieldAlert className="w-5 h-5 text-amber-500" />
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Banned / Suspended</span>
            <span className="text-xl font-black text-rose-700 font-mono">{isLoading ? '...' : stats.banned}</span>
          </div>
          <Ban className="w-5 h-5 text-rose-500" />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, @handle, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'restricted', 'banned'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st} ({st === 'all' ? stats.total : st === 'active' ? stats.active : st === 'restricted' ? stats.restricted : stats.banned})
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-[24px] border border-slate-200 text-center text-xs text-slate-500 font-medium shadow-sm">
          <RefreshCw className="w-6 h-6 text-[#FF6B00] animate-spin mx-auto mb-2" />
          Loading all registered user credentials...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-8 rounded-[28px] border border-slate-200 text-center space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-900 font-bold font-heading">No matching student accounts found</p>
          <p className="text-[11px] text-slate-500">
            {searchQuery ? `No results for "${searchQuery}" under ${statusFilter} filter.` : 'No student accounts registered.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((acc) => (
            <div key={acc.id} className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-md space-y-4">
              {/* Header with Avatar, Real Name, Email, Handle, Provider, and Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  {acc.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={acc.avatar_url}
                      alt={acc.full_name || 'Student'}
                      className="w-12 h-12 rounded-2xl border border-slate-200 object-cover shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                      {(acc.full_name || acc.email || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-slate-950 font-heading">
                        {acc.full_name || 'LNJPIT Student'}
                      </h3>
                      {acc.username && (
                        <span className="font-mono text-[#FF6B00] text-xs font-bold bg-[#FF6B00]/10 px-2 py-0.5 rounded-full border border-[#FF6B00]/20">
                          @{acc.username}
                        </span>
                      )}
                      {acc.provider && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                          {acc.provider} Auth
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-mono mt-1 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      {acc.email || 'No email registered'}
                    </p>
                  </div>
                </div>

                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase font-mono shadow-sm ${
                  acc.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/30' :
                  acc.account_status === 'restricted' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30' :
                  'bg-rose-500/10 text-rose-700 border border-rose-500/30'
                }`}>
                  Status: {acc.account_status || 'active'}
                </span>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-[#F4F3EF] p-3.5 rounded-2xl border border-slate-200 font-sans">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">College:</span>
                  <strong className="text-slate-950 font-bold">{acc.college_name || 'LNJPIT'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Branch / Dept:</span>
                  <strong className="text-slate-950 font-bold">{acc.department || 'CSE'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Batch Year:</span>
                  <strong className="text-slate-950 font-bold">Batch {acc.batch || '2026'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">System Role:</span>
                  <strong className="text-[#FF6B00] font-bold capitalize">{acc.role || 'student'}</strong>
                </div>
              </div>

              {/* Actions & Credentials Footer */}
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-t border-slate-100 pt-3">
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-slate-400" />
                    ID: <code className="text-slate-700 font-bold">{acc.id}</code>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Registered: {acc.created_at ? new Date(acc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={updatingId === acc.id}
                    onClick={() => handleUpdateStatus(acc.id, 'active')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                      acc.account_status === 'active'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    Restore Active
                  </button>

                  <button
                    disabled={updatingId === acc.id}
                    onClick={() => handleUpdateStatus(acc.id, 'restricted')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                      acc.account_status === 'restricted'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border-amber-500/20'
                    }`}
                  >
                    Restrict
                  </button>

                  <button
                    disabled={updatingId === acc.id}
                    onClick={() => handleUpdateStatus(acc.id, 'banned')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                      acc.account_status === 'banned'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border-rose-500/20'
                    }`}
                  >
                    Ban Account
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
