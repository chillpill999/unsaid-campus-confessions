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
          <h1 className="text-xl font-black text-slate-950 font-heading tracking-tight flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-600" />
            Reports Moderation Queue
          </h1>
          <p className="text-xs text-slate-600">Real-time moderation queue for student safety reports.</p>
        </div>

        <button
          onClick={fetchLiveReports}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-rose-600 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-[24px] border border-slate-200 text-center text-xs text-slate-500 font-medium shadow-sm">
          Loading live reports queue...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-8 rounded-[28px] border border-slate-200 text-center space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-900 font-bold font-heading">No pending reports!</p>
          <p className="text-[11px] text-slate-500">All reported items have been reviewed and actioned.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-700 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 font-mono">
                  {report.reason}
                </span>
                <span className="font-mono text-slate-500">{formatTimeAgo(report.created_at)}</span>
              </div>

              <div className="text-xs text-slate-900 font-sans">
                {report.confession_code && (
                  <div className="font-mono text-[#FF6B00] font-bold mb-1">
                    Confession Target: #{report.confession_code}
                  </div>
                )}
                <p className="text-slate-600">{report.details || 'No additional details provided.'}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-600 capitalize">
                  Status: <strong className="text-slate-950">{report.status}</strong>
                </span>

                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(report.id, 'actioned')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Action
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'dismissed')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200"
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
