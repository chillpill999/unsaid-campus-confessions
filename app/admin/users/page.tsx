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
          <h1 className="text-xl font-black text-slate-950 font-heading tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6B00]" />
            User Account Management
          </h1>
          <p className="text-xs text-slate-600">Live student user profiles and status management.</p>
        </div>

        <button
          onClick={fetchLiveUsers}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B00] ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Users
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-[24px] border border-slate-200 text-center text-xs text-slate-500 font-medium shadow-sm">
          Loading user accounts...
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white p-8 rounded-[28px] border border-slate-200 text-center space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-900 font-bold font-heading">No registered student accounts found</p>
          <p className="text-[11px] text-slate-500">Student accounts will automatically appear here when registered.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((acc) => (
            <div key={acc.id} className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="font-mono text-slate-900 font-bold">
                  Internal Reference
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase font-mono ${
                  acc.account_status === 'active' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                  acc.account_status === 'restricted' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                }`}>
                  {acc.account_status || 'active'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 font-mono">
                <div>College: <strong className="text-slate-950">{acc.college_name || 'LNJPIT'}</strong></div>
                <div>Batch: <strong className="text-slate-950">'{acc.batch || '2026'}</strong></div>
                <div>Role: <strong className="text-[#FF6B00] capitalize">{acc.role || 'student'}</strong></div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2 text-xs">
                <button
                  onClick={() => handleUpdateStatus(acc.id, 'active')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200"
                >
                  Restore Active
                </button>
                <button
                  onClick={() => handleUpdateStatus(acc.id, 'restricted')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-bold border border-amber-500/20"
                >
                  Restrict
                </button>
                <button
                  onClick={() => handleUpdateStatus(acc.id, 'banned')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-bold border border-rose-500/20"
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
