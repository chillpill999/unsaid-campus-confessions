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
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center justify-center shrink-0 shadow-sm font-bold">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-950 font-heading">Saved Confessions</h1>
            <p className="text-xs text-slate-600">Private bookmarks accessible only to you.</p>
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
