'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-950 font-heading">Privacy & Anonymity Architecture</h1>
            <p className="text-xs text-slate-600">How we protect your identity on ConfessionLnjpit.</p>
          </div>
        </div>

        <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-sans">
            <div className="p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-950 text-sm font-heading flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FF6B00]" /> 1. Public Anonymity Engine
              </h3>
              <p>When you post a confession or comment, your Google email and full name are completely excluded from public database queries. Other users see only <span className="font-mono text-[#FF6B00] font-bold">Anonymous • Gender</span>.</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-1">
              <h3 className="font-bold text-slate-950 text-sm font-heading flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF6B00]" /> 2. Row-Level Security (RLS)
              </h3>
              <p>Our Supabase PostgreSQL database enforces strict RLS policies on the <span className="font-mono text-slate-800">public_confessions</span> view to ensure identity columns are never exposed to web clients.</p>
            </div>
          </div>
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
