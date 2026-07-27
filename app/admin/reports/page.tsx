'use client';

import React, { useState } from 'react';
import { Flag, Check, X, ShieldAlert } from 'lucide-react';
import { MOCK_REPORTS } from '@/lib/mock-data';
import { ReportItem } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);

  const handleAction = (id: string, newStatus: 'actioned' | 'dismissed') => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
          <Flag className="w-5 h-5 text-rose-400" />
          Reports Moderation Queue
        </h1>
        <p className="text-xs text-slate-400">Review student reports and apply moderation actions.</p>
      </div>

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
              <p className="text-slate-400">{report.details}</p>
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
    </div>
  );
}
