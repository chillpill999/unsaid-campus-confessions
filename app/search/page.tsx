'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { EmptyState } from '@/components/empty-state';
import { Search, Filter, Hash } from 'lucide-react';
import { MOCK_CONFESSIONS } from '@/lib/mock-data';
import { PublicConfession } from '@/lib/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = MOCK_CONFESSIONS.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const matchCode = c.public_code.toLowerCase().includes(q) || `#${c.public_code.toLowerCase()}`.includes(q);
    const matchContent = c.content.toLowerCase().includes(q);
    const matchCategory = c.category_name.toLowerCase().includes(q);
    return matchCode || matchContent || matchCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white font-heading flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            Search Confessions
          </h1>
          <p className="text-xs text-slate-400">
            Search by public code (e.g. <span className="font-mono text-indigo-300">#CF7K2P</span>), keywords, or category. Author lookup is strictly disabled.
          </p>

          {/* Search Bar Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code #CF7K2P, library, hostel, CS 106B..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-500"
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
