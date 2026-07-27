'use client';

import React from 'react';
import Link from 'next/link';
import { Users, FileText, MessageSquare, Flag, ShieldAlert, Activity, ArrowRight } from 'lucide-react';

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white font-heading">Platform Overview</h1>
          <p className="text-xs text-slate-400">Aggregate platform metrics and safety dashboard.</p>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" /> Active Students
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">1,420</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-purple-400" /> Confessions Today
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">42</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Comments Today
          </span>
          <span className="text-2xl font-extrabold text-white font-mono">189</span>
        </div>

        <div className="glass-card p-4 space-y-1 border-rose-500/30">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-rose-400" /> Reports Pending
          </span>
          <span className="text-2xl font-extrabold text-rose-400 font-mono">2</span>
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
              Review Pending Reports
            </h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Moderate flagged confessions and comments reported by students.
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
