'use client';

import React, { useState } from 'react';
import { Users, ShieldAlert, AlertCircle, Ban, CheckCircle2 } from 'lucide-react';

interface AccountItem {
  internal_ref: string;
  college: string;
  batch: string;
  status: 'active' | 'restricted' | 'suspended' | 'banned';
  joined_date: string;
  reports_count: number;
}

const DEMO_ACCOUNTS: AccountItem[] = [
  {
    internal_ref: 'REF-STU-884920',
    college: 'Stanford University',
    batch: '2026',
    status: 'active',
    joined_date: '2026-01-15',
    reports_count: 0,
  },
  {
    internal_ref: 'REF-STU-492019',
    college: 'MIT',
    batch: '2025',
    status: 'restricted',
    joined_date: '2026-02-01',
    reports_count: 3,
  },
];

export default function AdminUsersPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>(DEMO_ACCOUNTS);

  const handleUpdateStatus = (ref: string, newStatus: AccountItem['status']) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.internal_ref === ref ? { ...acc, status: newStatus } : acc))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          User Account Management
        </h1>
        <p className="text-xs text-slate-400">Manage student access statuses and apply account restrictions.</p>
      </div>

      <div className="space-y-3">
        {accounts.map((acc) => (
          <div key={acc.internal_ref} className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="font-mono text-slate-300 font-bold">Internal Ref: {acc.internal_ref}</div>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                acc.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                acc.status === 'restricted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {acc.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 font-mono">
              <div>College: <strong className="text-white">{acc.college}</strong></div>
              <div>Batch: <strong className="text-white">'{acc.batch.slice(-2)}</strong></div>
              <div>Reports Received: <strong className="text-rose-400">{acc.reports_count}</strong></div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
              <button
                onClick={() => handleUpdateStatus(acc.internal_ref, 'active')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
              >
                Restore Active
              </button>
              <button
                onClick={() => handleUpdateStatus(acc.internal_ref, 'restricted')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold"
              >
                Restrict
              </button>
              <button
                onClick={() => handleUpdateStatus(acc.internal_ref, 'banned')}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold"
              >
                Ban Account
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
