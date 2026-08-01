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
        <div className="space-y-4">
          {users.map((acc) => (
            <div key={acc.id} className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/80 shadow-md space-y-4">
              {/* Header with Avatar, Real Name, Email, Handle, and Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  {acc.avatar_url ? (
                    <img
                      src={acc.avatar_url}
                      alt={acc.full_name || 'Student'}
                      className="w-11 h-11 rounded-2xl border border-slate-200 object-cover shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
                      {(acc.full_name || acc.email || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 font-heading">
                      {acc.full_name || 'LNJPIT Student'}
                      {acc.username && (
                        <span className="font-mono text-[#FF6B00] text-xs font-bold bg-[#FF6B00]/10 px-2 py-0.5 rounded-full border border-[#FF6B00]/20">
                          @{acc.username}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
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
                  <strong className="text-slate-950 font-bold">'{acc.batch || '2026'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">System Role:</span>
                  <strong className="text-[#FF6B00] font-bold capitalize">{acc.role || 'student'}</strong>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <span className="font-mono text-[10px] text-slate-400">
                  Ref ID: {acc.id}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
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
