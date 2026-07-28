'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, FileText, MessageSquare, Flag, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { adminFetchStats } from '@/lib/actions/admin';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    confessionsToday: 0,
    commentsToday: 0,
    reportsPending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchRealtimeStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminFetchStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeStats();
    const interval = setInterval(fetchRealtimeStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-950 font-heading tracking-tight">Platform Overview</h1>
          <p className="text-xs text-slate-600">Live real-time platform metrics and safety dashboard.</p>
        </div>

        <button
          onClick={fetchRealtimeStats}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B00] ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Live Data
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-md space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#FF6B00]" /> Active Students
          </span>
          <span className="text-2xl font-black text-slate-950 font-mono block">
            {isLoading ? '...' : stats.activeStudents}
          </span>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-md space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-purple-600" /> Confessions Today
          </span>
          <span className="text-2xl font-black text-slate-950 font-mono block">
            {isLoading ? '...' : stats.confessionsToday}
          </span>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-md space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Comments Today
          </span>
          <span className="text-2xl font-black text-slate-950 font-mono block">
            {isLoading ? '...' : stats.commentsToday}
          </span>
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-rose-200 shadow-md space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-rose-600" /> Reports Pending
          </span>
          <span className="text-2xl font-black text-rose-600 font-mono block">
            {isLoading ? '...' : stats.reportsPending}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/reports"
          className="bg-white p-6 rounded-[28px] border border-rose-200 hover:border-rose-400 space-y-2 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2 font-heading">
              <Flag className="w-4 h-4 text-rose-600" />
              Review Pending Reports ({stats.reportsPending})
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Moderate flagged confessions and comments reported by students in real time.
          </p>
        </Link>

        <Link
          href="/admin/identity-access"
          className="bg-white p-6 rounded-[28px] border border-amber-200 hover:border-amber-400 space-y-2 transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2 font-heading">
              <ShieldAlert className="w-4 h-4 text-[#FF6B00]" />
              Identity Audit Logs
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF6B00] transition-colors" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            View append-only records of all identity reveal actions taken by administrators.
          </p>
        </Link>
      </div>
    </div>
  );
}
