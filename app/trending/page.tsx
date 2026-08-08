'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { ConfessionComposer } from '@/components/confession-composer';
import { PublicConfession } from '@/lib/types';
import { Flame, Loader2 } from 'lucide-react';

export default function TrendingPage() {
  const [confessions, setConfessions] = useState<PublicConfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTrending() {
      try {
        const res = await fetch('/api/confessions?limit=50');
        const json = await res.json();
        if (!mounted) return;
        if (json.success && json.confessions) {
          const sorted = [...json.confessions].sort((a, b) => {
            const aEngage = (a.reaction_counts?.relatable || 0) + (a.reaction_counts?.funny || 0)
              + (a.reaction_counts?.support || 0) + (a.reaction_counts?.interesting || 0) + (a.comment_count || 0);
            const bEngage = (b.reaction_counts?.relatable || 0) + (b.reaction_counts?.funny || 0)
              + (b.reaction_counts?.support || 0) + (b.reaction_counts?.interesting || 0) + (b.comment_count || 0);
            return bEngage - aEngage;
          });
          setConfessions(sorted);
        }
      } catch (err) {
        console.warn('Failed to load trending confessions:', err);
        if (mounted) {
          const { fetchPublicConfessions } = await import('@/lib/actions/feed');
          const fallback = await fetchPublicConfessions(50);
          setConfessions([...fallback].sort((a, b) =>
            (b.reaction_counts?.relatable || 0) - (a.reaction_counts?.relatable || 0)
          ));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTrending();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar onOpenComposer={() => setIsComposerOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="rounded-[28px] bg-[#FF6B00] text-white p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-md font-bold">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white font-heading">Trending on Campus</h1>
            <p className="text-xs text-white/80">Highest engaged confessions, crushes, and hostel chaos this week.</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mx-auto" />
              <p className="text-xs font-mono font-bold text-slate-500">Ranking today&apos;s top confessions...</p>
            </div>
          ) : confessions.length > 0 ? (
            confessions.map((confession) => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6 font-mono">
              No trending confessions yet. Be the first to share something striking!
            </p>
          )}
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
