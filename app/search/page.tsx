'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { EmptyState } from '@/components/empty-state';
import { Search } from 'lucide-react';
import { PublicConfession } from '@/lib/types';
import { fetchPublicConfessions } from '@/lib/actions/feed';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [confessions, setConfessions] = useState<PublicConfession[]>([]);

  useEffect(() => {
    async function loadSearchCatalog() {
      try {
        const res = await fetch('/api/confessions?limit=100');
        const json = await res.json();
        if (json && json.success && json.confessions) {
          setConfessions(json.confessions);
          return;
        }
      } catch (err) {
        console.warn('Search fetch note:', err);
      }

      try {
        const serverData = await fetchPublicConfessions(100);
        if (serverData) setConfessions(serverData as PublicConfession[]);
      } catch (err) {
        console.error('Failed search fetch:', err);
      }
    }

    loadSearchCatalog();
  }, []);

  const filtered = confessions.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const matchCode = c.public_code.toLowerCase().includes(q) || `#${c.public_code.toLowerCase()}`.includes(q);
    const matchContent = c.content.toLowerCase().includes(q);
    const matchCategory = c.category_name.toLowerCase().includes(q);
    return matchCode || matchContent || matchCategory;
  });

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 shadow-md space-y-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950 font-heading flex items-center gap-2">
              <Search className="w-6 h-6 text-[#FF6B00]" />
              Search Confessions
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Search by public code (e.g. <span className="font-mono text-[#FF6B00]">#CF7K2P</span>), keywords, or category. Author lookup is strictly disabled.
            </p>
          </div>

          {/* Search Bar Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code #CF7K2P, library, hostel, CSE..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#F4F3EF] border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] font-mono shadow-inner"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((confession) => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))
          ) : (
            <EmptyState type="search" />
          )}
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
