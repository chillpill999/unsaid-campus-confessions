'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { ShieldCheck, Heart, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-8 flex-1 w-full space-y-8">
        <Link href="/feed" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Community Rules</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-heading">Community Guidelines</h1>
          <p className="text-sm text-slate-400">
            Express yourself, don't expose others. Anonymity protects expression — it doesn't remove accountability.
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="glass-card p-6 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              1. Keep Personal Information Secret (No Doxxing)
            </h3>
            <p className="leading-relaxed text-slate-400">
              Never post real names, phone numbers, email addresses, student IDs, room numbers, addresses, social media handles, or private chat screenshots.
            </p>
          </div>

          <div className="glass-card p-6 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              2. Zero Tolerance for Harassment & Targeted Humiliation
            </h3>
            <p className="leading-relaxed text-slate-400">
              Confessions are for sharing thoughts, crushes, and campus stories — not for bullying specific individuals or spreading targeted rumors.
            </p>
          </div>

          <div className="glass-card p-6 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              3. Have Fun & Support Each Other
            </h3>
            <p className="leading-relaxed text-slate-400">
              Campus life is stressful. Use reactions (❤️ 😂 🫂 👀) to encourage peers and build an authentic community space.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
