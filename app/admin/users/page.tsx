'use client';

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import { adminFetchUsers, adminUpdateUserStatus } from '@/lib/actions/admin';
import { UserProfile } from '@/lib/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    try {
      await adminUpdateUserStatus(id, newStatus);
      setUsers((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, account_status: newStatus } : acc))
      );
    } catch (err: any) {
      alert('Error updating user status: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLiveUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            User Account Management
          </h1>
          <p className="text-xs text-slate-400">Live student user profiles and status management.</p>
        </div>

        <button
          onClick={fetchLiveUsers}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card p-8 text-center text-xs text-slate-400">
          Loading user accounts...
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-2 border-slate-800">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-semibold">No registered student accounts found</p>
          <p className="text-[11px] text-slate-500">Student accounts will automatically appear here when registered.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((acc) => (
            <div key={acc.id} className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="font-mono text-slate-300 font-bold">
                  Internal Ref: REF-STU-{acc.id.slice(0, 8)}
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                  acc.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  acc.account_status === 'restricted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {acc.account_status || 'active'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 font-mono">
                <div>College: <strong className="text-white">{acc.college_name || 'LNJPIT'}</strong></div>
                <div>Batch: <strong className="text-white">'{acc.batch || '2026'}</strong></div>
                <div>Role: <strong className="text-indigo-400 capitalize">{acc.role || 'student'}</strong></div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => handleUpdateStatus(acc.id, 'active')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Restore Active
                </button>
                <button
                  onClick={() => handleUpdateStatus(acc.id, 'restricted')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold"
                >
                  Restrict
                </button>
                <button
                  onClick={() => handleUpdateStatus(acc.id, 'banned')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold"
                >
                  Ban Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
