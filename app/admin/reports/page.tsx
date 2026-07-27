'use client';

import React, { useState, useEffect } from 'react';
import { Flag, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { ReportItem } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { adminFetchReports, adminUpdateReportStatus } from '@/lib/actions/admin';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveReports = async () => {
    setIsLoading(true);
    try {
      const data = await adminFetchReports();
      setReports(data as ReportItem[]);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, newStatus: 'actioned' | 'dismissed') => {
    try {
      await adminUpdateReportStatus(id, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert('Error updating report: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLiveReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-400" />
            Reports Moderation Queue
          </h1>
          <p className="text-xs text-slate-400">Real-time moderation queue for student safety reports.</p>
        </div>

        <button
          onClick={fetchLiveReports}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card p-8 text-center text-xs text-slate-400">
          Loading live reports queue...
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-2 border-slate-800">
          <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs text-slate-300 font-semibold">No pending reports!</p>
          <p className="text-[11px] text-slate-500">All reported items have been reviewed and actioned.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                  {report.reason}
                </span>
                <span className="font-mono text-slate-500">{formatTimeAgo(report.created_at)}</span>
              </div>

              <div className="text-xs text-slate-300">
                {report.confession_code && (
                  <div className="font-mono text-indigo-300 font-bold mb-1">
                    Confession Target: #{report.confession_code}
                  </div>
                )}
                <p className="text-slate-400">{report.details || 'No additional details provided.'}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <span className="font-semibold text-slate-400 capitalize">
                  Status: <strong className="text-white">{report.status}</strong>
                </span>

                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(report.id, 'actioned')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Actioned
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'dismissed')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
