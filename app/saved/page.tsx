'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { EmptyState } from '@/components/empty-state';
import { Bookmark } from 'lucide-react';
import { MOCK_CONFESSIONS } from '@/lib/mock-data';

export default function SavedPage() {
  const [savedConfessions, setSavedConfessions] = useState(
    MOCK_CONFESSIONS.filter((c) => c.is_bookmarked || c.id === 'conf-1')
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Saved Confessions</h1>
            <p className="text-xs text-slate-400">Private bookmarks accessible only to you.</p>
          </div>
        </div>

        <div className="space-y-4">
          {savedConfessions.length > 0 ? (
            savedConfessions.map((confession) => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))
          ) : (
            <EmptyState type="saved" />
          )}
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
