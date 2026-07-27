'use client';

import React from 'react';
import { History, ShieldCheck, Lock } from 'lucide-react';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';
import { formatTimeAgo } from '@/lib/utils';

export default function AdminIdentityAccessPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Identity Access Audit Logs
          </h1>
          <p className="text-xs text-slate-400">
            Append-only record of all identity reveal actions taken by administrators. Cannot be edited or deleted.
          </p>
        </div>
        <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Immutable Log
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_AUDIT_LOGS.map((log) => (
          <div key={log.id} className="glass-card p-5 space-y-2 border-amber-500/20">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300">{log.admin_name}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-indigo-400 font-bold">Target: {log.target_internal_ref}</span>
              </div>
              <span className="font-mono text-slate-500">{formatTimeAgo(log.created_at)}</span>
            </div>

            <div className="text-xs text-slate-300 pt-1">
              <span className="text-slate-400 block mb-1">
                Reason for Reveal: <strong className="text-white">{log.reason}</strong>
              </span>
              {log.confession_code && (
                <span className="font-mono text-indigo-300 text-[11px]">
                  Associated Confession Code: #{log.confession_code}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
