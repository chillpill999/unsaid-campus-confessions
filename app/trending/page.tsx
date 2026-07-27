'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { ConfessionComposer } from '@/components/confession-composer';
import { MOCK_CONFESSIONS } from '@/lib/mock-data';
import { PublicConfession } from '@/lib/types';
import { Flame, Sparkles } from 'lucide-react';

export default function TrendingPage() {
  const [confessions, setConfessions] = useState<PublicConfession[]>(
    [...MOCK_CONFESSIONS].sort((a, b) => (b.reaction_counts.relatable + b.reaction_counts.funny) - (a.reaction_counts.relatable + a.reaction_counts.funny))
  );
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-8">
      <Navbar onOpenComposer={() => setIsComposerOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Trending on Campus</h1>
            <p className="text-xs text-slate-400">Highest engaged confessions, crushes, and hostel chaos this week.</p>
          </div>
        </div>

        <div className="space-y-4">
          {confessions.map((confession) => (
            <ConfessionCard key={confession.id} confession={confession} />
          ))}
        </div>
      </main>

      <ConfessionComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostSuccess={(newC) => setConfessions([newC, ...confessions])}
      />
      <MobileNav onOpenComposer={() => setIsComposerOpen(true)} />
    </div>
  );
}
