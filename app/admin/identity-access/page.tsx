'use client';

import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { IdentityAccessLog } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { adminFetchAuditLogs } from '@/lib/actions/admin';

export default function AdminIdentityAccessPage() {
  const [logs, setLogs] = useState<IdentityAccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await adminFetchAuditLogs();
      setLogs(data as IdentityAccessLog[]);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-950 font-heading tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#FF6B00]" />
            Identity Access Audit Logs
          </h1>
          <p className="text-xs text-slate-600">
            Append-only record of all identity reveal actions taken by administrators. Cannot be edited or deleted.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveAuditLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B00] ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>

          <div className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Immutable Log
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-[24px] border border-slate-200 text-center text-xs text-slate-500 font-medium shadow-sm">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-8 rounded-[28px] border border-slate-200 text-center space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-900 font-bold font-heading">No identity reveals recorded yet</p>
          <p className="text-[11px] text-slate-500">Every admin identity reveal action will automatically record an immutable audit log here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-white p-5 rounded-[24px] border border-amber-200 shadow-md space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#FF6B00] font-sans">{log.admin_name || 'Admin'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-slate-900">Target: {log.target_internal_ref}</span>
                </div>
                <span className="text-slate-500">{formatTimeAgo(log.created_at)}</span>
              </div>

              <div className="text-xs text-slate-900 font-sans pt-1">
                <span className="text-slate-600 block mb-1">
                  Reason for Reveal: <strong className="text-slate-950 font-bold">{log.reason}</strong>
                </span>
                {log.confession_code && (
                  <span className="font-mono text-[#FF6B00] font-bold text-[11px]">
                    Associated Confession Code: #{log.confession_code}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
