'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { ConfessionComposer } from '@/components/confession-composer';
import { MOCK_CONFESSIONS } from '@/lib/mock-data';
import { PublicConfession } from '@/lib/types';
import { Flame } from 'lucide-react';

export default function TrendingPage() {
  const [confessions, setConfessions] = useState<PublicConfession[]>(
    [...MOCK_CONFESSIONS].sort((a, b) => (b.reaction_counts.relatable + b.reaction_counts.funny) - (a.reaction_counts.relatable + a.reaction_counts.funny))
  );
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-amber-500 selection:text-black">
      <Navbar onOpenComposer={() => setIsComposerOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="rounded-[28px] bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-950 border border-amber-500/30 p-5 shadow-2xl backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-lg">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white font-heading">Trending on Campus</h1>
            <p className="text-xs text-slate-400">Highest engaged confessions, crushes, and hostel chaos this week.</p>
          </div>
        </div>

        <div className="space-y-4">
          {confessions.map((confession) => (
            <ConfessionCard key={confession.id} confession={confession} />
          ))}
        </div>
      </main>

      {isComposerOpen && (
        <ConfessionComposer
          onClose={() => setIsComposerOpen(false)}
          onPostSuccess={(newC) => setConfessions([newC, ...confessions])}
        />
      )}
      <MobileNav onOpenComposer={() => setIsComposerOpen(true)} />
    </div>
  );
}
