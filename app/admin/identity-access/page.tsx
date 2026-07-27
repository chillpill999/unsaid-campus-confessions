'use client';

import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { IdentityAccessLog } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function AdminIdentityAccessPage() {
  const [logs, setLogs] = useState<IdentityAccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveAuditLogs = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('identity_access_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLogs(data as IdentityAccessLog[]);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to load audit logs from Supabase:', err);
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
          <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Identity Access Audit Logs
          </h1>
          <p className="text-xs text-slate-400">
            Append-only record of all identity reveal actions taken by administrators. Cannot be edited or deleted.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveAuditLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>

          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Immutable Log
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card p-8 text-center text-xs text-slate-400">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-2 border-slate-800">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-semibold">No identity reveals recorded yet</p>
          <p className="text-[11px] text-slate-500">Every admin identity reveal action will automatically record an immutable audit log here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="glass-card p-5 space-y-2 border-amber-500/20">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300">{log.admin_name || 'Admin'}</span>
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
      )}
    </div>
  );
}
