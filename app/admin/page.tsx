'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, FileText, MessageSquare, Flag, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
      const supabase = createClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      // 1. Fetch Total Students Count
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // 2. Fetch Confessions Today Count
      const { count: confessionsCount } = await supabase
        .from('confessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO);

      // 3. Fetch Comments Today Count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO);

      // 4. Fetch Pending Reports Count
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        activeStudents: studentsCount || 0,
        confessionsToday: confessionsCount || 0,
        commentsToday: commentsCount || 0,
        reportsPending: reportsCount || 0,
      });
    } catch (err) {
      console.error('Error fetching admin realtime stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeStats();

    // Auto-refresh stats every 15 seconds for live real-time updates
    const interval = setInterval(() => {
      fetchRealtimeStats();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white font-heading">Platform Overview</h1>
          <p className="text-xs text-slate-400">Live real-time platform metrics and safety dashboard.</p>
        </div>

        <button
          onClick={fetchRealtimeStats}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Live Data
        </button>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" /> Active Students
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">
            {isLoading ? '...' : stats.activeStudents}
          </span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-purple-400" /> Confessions Today
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">
            {isLoading ? '...' : stats.confessionsToday}
          </span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Comments Today
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">
            {isLoading ? '...' : stats.commentsToday}
          </span>
        </div>

        <div className="glass-card p-4 space-y-1 border-rose-500/30">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-rose-400" /> Reports Pending
          </span>
          <span className="text-2xl font-extrabold text-rose-400 font-mono">
            {isLoading ? '...' : stats.reportsPending}
          </span>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/reports"
          className="glass-card p-6 space-y-2 border-rose-500/20 hover:border-rose-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-400" />
              Review Pending Reports ({stats.reportsPending})
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Moderate flagged confessions and comments reported by students in real time.
          </p>
        </Link>

        <Link
          href="/admin/identity-access"
          className="glass-card p-6 space-y-2 border-amber-500/20 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Identity Audit Logs
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            View append-only records of all identity reveal actions taken by administrators.
          </p>
        </Link>
      </div>
    </div>
  );
}
