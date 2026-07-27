'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { ConfessionComposer } from '@/components/confession-composer';
import { ConfessionOfTheDay } from '@/components/confession-of-the-day';
import { CampusMoodWidget } from '@/components/campus-mood-widget';
import { ReportDialog } from '@/components/report-dialog';
import { EmptyState } from '@/components/empty-state';
import { MOCK_CONFESSIONS, MOCK_CATEGORIES } from '@/lib/mock-data';
import { PublicConfession, Category } from '@/lib/types';
import { Flame, Sparkles, PlusCircle } from 'lucide-react';

export default function FeedPage() {
  const router = useRouter();
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [confessions, setConfessions] = useState<PublicConfession[]>(MOCK_CONFESSIONS);
  const [activeTab, setActiveTab] = useState<'for-you' | 'latest' | 'trending'>('latest');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  // Modals state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [reportingCode, setReportingCode] = useState<string | null>(null);
  const [thinkAboutYouNotice, setThinkAboutYouNotice] = useState<string | null>(null);

  // STRICT Client-Side Authentication Guard — blocks rendering until verified
  useEffect(() => {
    async function verifyAuth() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!user || error) {
          router.replace('/login');
          return;
        }
        setIsAuthVerified(true);
      } catch (err) {
        router.replace('/login');
      }
    }
    verifyAuth();
  }, [router]);

  // BLOCK: Show nothing until auth is confirmed
  if (!isAuthVerified) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Filter Confessions
  const filteredConfessions = confessions.filter((c) => {
    if (selectedCategorySlug && c.category_slug !== selectedCategorySlug) {
      return false;
    }
    return true;
  });

  const handlePostSuccess = (newConfession: PublicConfession) => {
    setConfessions([newConfession, ...confessions]);
  };

  const handleThinkAboutYou = (code: string) => {
    setThinkAboutYouNotice(`Anonymous signal sent for #${code}! If the author accepts, an inbox chat will unlock 👀`);
    setTimeout(() => setThinkAboutYouNotice(null), 4000);
  };

  const featuredConfession = confessions.find((c) => c.is_featured) || confessions[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8 selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenComposer={() => setIsComposerOpen(true)} />

      {/* Main Container: Responsive 3-Column Desktop Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column (Desktop Navigation & Categories Filter) */}
        <aside className="hidden md:block md:col-span-3 space-y-6 sticky top-22 h-fit">
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategorySlug(null)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategorySlug === null
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                All Confessions
              </button>
              {MOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 space-y-2 text-xs text-slate-400">
            <h4 className="font-bold text-white mb-1">Public Anonymity</h4>
            <p className="leading-relaxed">
              Your Google account verifies you're a real student. Posts display only <strong className="text-indigo-300">Anonymous • Gender</strong>.
            </p>
          </div>
        </aside>

        {/* Center Column: Feed Content */}
        <section className="md:col-span-6 space-y-4">
          
          {/* Think About You Toast Notification */}
          {thinkAboutYouNotice && (
            <div className="p-3.5 rounded-2xl bg-pink-500/20 border border-pink-500/30 text-pink-200 text-xs font-semibold animate-fade-in shadow-lg">
              {thinkAboutYouNotice}
            </div>
          )}

          {/* Featured Confession of the Day */}
          {featuredConfession && <ConfessionOfTheDay confession={featuredConfession} />}

          {/* Feed Tabs: For You | Latest | Trending */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1">
              {(['latest', 'for-you', 'trending'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'latest' ? 'Latest' : tab === 'for-you' ? 'For You' : 'Trending 🔥'}
                </button>
              ))}
            </div>

            {/* Mobile Confess Trigger Button */}
            <button
              onClick={() => setIsComposerOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Confess
            </button>
          </div>

          {/* Confessions List */}
          {filteredConfessions.length > 0 ? (
            filteredConfessions.map((confession) => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                onOpenReport={(code) => setReportingCode(code)}
                onOpenThinkAboutYou={handleThinkAboutYou}
              />
            ))
          ) : (
            <EmptyState type="feed" actionText="Create a Confession" onAction={() => setIsComposerOpen(true)} />
          )}
        </section>

        {/* Right Column: Campus Mood & Trending Hot Topics */}
        <aside className="hidden md:block md:col-span-3 space-y-6 sticky top-22 h-fit">
          <CampusMoodWidget />

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Trending Topics
            </h3>
            <div className="space-y-2 text-xs">
              <Link href="/trending" className="block p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 transition-colors">
                <span className="font-bold text-slate-200 block">🔥 Library Confessions</span>
                <span className="text-[11px] text-slate-500">Live community feed</span>
              </Link>
              <Link href="/trending" className="block p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 transition-colors">
                <span className="font-bold text-slate-200 block">👀 Campus Crushes</span>
                <span className="text-[11px] text-slate-500">Anonymous signals</span>
              </Link>
              <Link href="/trending" className="block p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 transition-colors">
                <span className="font-bold text-slate-200 block">😂 Hostel Stories</span>
                <span className="text-[11px] text-slate-500">Campus humor</span>
              </Link>
            </div>
          </div>
        </aside>

      </main>

      {/* Confession Composer Modal */}
      <ConfessionComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostSuccess={handlePostSuccess}
      />

      {/* Report Modal */}
      <ReportDialog
        isOpen={Boolean(reportingCode)}
        onClose={() => setReportingCode(null)}
        targetCode={reportingCode || ''}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenComposer={() => setIsComposerOpen(true)} />
    </div>
  );
}
