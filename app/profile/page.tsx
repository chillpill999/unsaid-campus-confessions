'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { User, Settings, Lock, Sparkles, Heart, MessageSquare, ShieldCheck } from 'lucide-react';
import { MOCK_DEMO_USER_PROFILE, MOCK_CONFESSIONS } from '@/lib/mock-data';

export default function ProfilePage() {
  const profile = MOCK_DEMO_USER_PROFILE;
  const [activeTab, setActiveTab] = useState<'my-confessions' | 'saved'>('my-confessions');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        {/* Private Profile Header */}
        <div className="glass-card p-6 sm:p-8 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/25">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  My Private Account
                  <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Private to You
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {profile.college_name} • {profile.department} ('{profile.batch.slice(-2)})
                </p>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authenticated Google Account
                </div>
              </div>
            </div>

            <Link
              href="/settings"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>

          {/* Personal Private Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="block text-[11px] text-slate-500 uppercase font-semibold">Confessions</span>
              <span className="text-xl font-extrabold text-white font-mono">4</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="block text-[11px] text-slate-500 uppercase font-semibold">Reactions Recv</span>
              <span className="text-xl font-extrabold text-indigo-400 font-mono">483</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="block text-[11px] text-slate-500 uppercase font-semibold">Comments Recv</span>
              <span className="text-xl font-extrabold text-purple-400 font-mono">32</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('my-confessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my-confessions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Anonymous Confessions
          </button>
        </div>

        {/* Confessions List */}
        <div className="space-y-4">
          {MOCK_CONFESSIONS.slice(0, 2).map((confession) => (
            <ConfessionCard key={confession.id} confession={confession} />
          ))}
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
