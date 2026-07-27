'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ShieldCheck, Lock, Eye, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-8 flex-1 w-full space-y-8">
        <Link href="/feed" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Architecture & Privacy Boundary</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-heading">Privacy Notice & Anonymity Model</h1>
          <p className="text-sm text-slate-400">
            Understand how ConfessionLnjpit handles student authentication, public anonymity, and administrative accountability.
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="glass-card p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              Public Anonymity vs Administrator Accountability
            </h3>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 leading-relaxed font-medium">
              Your posts are anonymous to other students, not to platform administrators.
            </div>
            <p className="leading-relaxed text-slate-400">
              Google OAuth verifies that you are a legitimate student account. Your name and email are stored internally inside Supabase Auth and are never sent to student-facing browsers or APIs.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Audited Admin Identity Reveals
            </h3>
            <p className="leading-relaxed text-slate-400">
              Authorized platform administrators can resolve the authenticated student account behind a post strictly when required for harassment investigations, safety threats, or severe abuse. Every reveal requires a written reason and generates a permanent, non-deletable audit log entry.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
