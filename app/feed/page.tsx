'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { ConfessionComposer } from '@/components/confession-composer';
import { EmptyState } from '@/components/empty-state';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import { PublicConfession } from '@/lib/types';
import { Sparkles, Radio, Heart, Eye, CheckCircle2, AlertCircle, Loader2, TrendingUp } from 'lucide-react';
import { useRealtimeFeed } from '@/lib/realtime/hooks';
import { createClient } from '@/lib/supabase/client';

export default function FeedPage() {
  const router = RouterCheck();
  const [confessions, setConfessions] = useState<PublicConfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [reportingCode, setReportingCode] = useState<string | null>(null);
  const [thinkAboutYouNotice, setThinkAboutYouNotice] = useState<string | null>(null);
  
  // Realtime Live Feed Status Banner
  const [realtimePulseCount, setRealtimePulseCount] = useState<number>(0);
  const [isAuthVerified, setIsAuthVerified] = useState(false);

  function RouterCheck() {
    try {
      return useRouter();
    } catch {
      return null;
    }
  }

  // 1. Enforce strict auth verification on client load
  useEffect(() => {
    async function verifyAuthSession() {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          if (router) router.replace('/login?redirect=/feed');
          return;
        }

        setIsAuthVerified(true);
      } catch (err) {
        console.error('Auth verification failed:', err);
        if (router) router.replace('/login?redirect=/feed');
      }
    }

    verifyAuthSession();
  }, [router]);

  // 2. Fetch Initial Confessions from Supabase PostgreSQL API
  const fetchConfessions = useCallback(async () => {
    if (!isAuthVerified) return;

    setLoading(true);
    try {
      const res = await fetch('/api/confessions?limit=20');
      const json = await res.json();

      if (json.success && json.confessions) {
        setConfessions(json.confessions);
        setHasMore(json.hasMore || false);
        setNextCursor(json.nextCursor || null);
      } else {
        const { fetchPublicConfessions } = await import('@/lib/actions/feed');
        const fallbackData = await fetchPublicConfessions();
        setConfessions(fallbackData as PublicConfession[]);
      }
    } catch (err) {
      console.warn('API fetch error, using server action fallback:', err);
      try {
        const { fetchPublicConfessions } = await import('@/lib/actions/feed');
        const fallbackData = await fetchPublicConfessions();
        setConfessions(fallbackData as PublicConfession[]);
      } catch (fallbackErr) {
        console.error('Fallback fetch failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthVerified]);

  useEffect(() => {
    fetchConfessions();
  }, [fetchConfessions]);

  // 3. Enable Realtime Feed Synchronization across all clients
  useRealtimeFeed({
    onConfessionPosted: (publicCode: string) => {
      setRealtimePulseCount((prev) => prev + 1);
      fetch('/api/confessions?limit=5')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.confessions) {
            setConfessions((prev) => {
              const existingCodes = new Set(prev.map((c) => c.public_code));
              const newItems = json.confessions.filter((c: PublicConfession) => !existingCodes.has(c.public_code));
              return [...newItems, ...prev];
            });
          }
        })
        .catch((err) => console.warn('Realtime fetch error:', err));
    },
  });

  // 4. Cursor Pagination Load More
  const loadMoreConfessions = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);

    try {
      const res = await fetch(`/api/confessions?cursor=${encodeURIComponent(nextCursor)}&limit=20`);
      const json = await res.json();

      if (json.success && json.confessions) {
        setConfessions((prev) => [...prev, ...json.confessions]);
        setHasMore(json.hasMore || false);
        setNextCursor(json.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to load more confessions:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!isAuthVerified) {
    return (
      <div className="min-h-screen bg-[#F4F3EF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-600 font-bold font-mono">Verifying authentication...</p>
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
    setConfessions((prev) => {
      const exists = prev.some((c) => c.public_code === newConfession.public_code);
      if (exists) return prev;
      return [newConfession, ...prev];
    });
  };

  const handleThinkAboutYou = (code: string) => {
    setThinkAboutYouNotice(`Anonymous signal sent for #${code}! If the author accepts, an inbox chat will unlock 👀`);
    setTimeout(() => setThinkAboutYouNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar onOpenComposer={() => setIsComposerOpen(true)} />

      {/* Main Container: Responsive 3-Column Desktop Layout */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
        
        {/* Left Column (Stitch Google Light Desktop Categories Sidebar) */}
        <aside className="hidden md:block md:col-span-3 space-y-6 sticky top-22 h-fit">
          <div className="rounded-[28px] bg-white border border-slate-200/80 p-5 space-y-4 shadow-xl">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Categories</h3>
              <span className="text-[10px] font-mono text-[#FF6B00] font-bold">Stitch Light</span>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategorySlug(null)}
                className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  selectedCategorySlug === null
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Confessions
              </button>
              {MOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white border border-slate-200/80 p-5 space-y-2 text-xs text-slate-600 shadow-md">
            <h4 className="font-black text-slate-950 mb-1 font-heading">Public Anonymity Verified</h4>
            <p className="leading-relaxed text-[11px]">
              Your student login authorizes your feed. Posts display strictly as <strong className="text-[#FF6B00]">Anonymous • Gender</strong>.
            </p>
            <div className="pt-3 mt-2 border-t border-slate-100 text-[11px] text-[#FF6B00] font-bold flex items-center gap-1.5 font-mono">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00] inline" />
              <span>for LNJPIT Students</span>
            </div>
          </div>
        </aside>

        {/* Center Column: Feed Content */}
        <section className="md:col-span-6 space-y-3 sm:space-y-4">
          {/* Mobile Categories: Horizontal Scrollable Pill Bar */}
          <div className="md:hidden overflow-x-auto -mx-3 px-3 pb-1 scrollbar-none">
            <div className="flex items-center gap-2 min-w-max">
              <button
                onClick={() => setSelectedCategorySlug(null)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedCategorySlug === null
                    ? 'bg-[#FF6B00] text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                All
              </button>
              {MOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-[#FF6B00] text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Realtime Live Pulse Notice Banner */}
          {realtimePulseCount > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold flex items-center justify-between shadow-md animate-fade-in">
              <span className="flex items-center gap-2 font-mono">
                <Radio className="w-4 h-4 text-[#FF6B00] animate-pulse" />
                {realtimePulseCount} new confession{realtimePulseCount > 1 ? 's' : ''} live in feed!
              </span>
              <button
                onClick={() => setRealtimePulseCount(0)}
                className="text-[10px] uppercase tracking-wider font-mono text-[#FF6B00] hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Anonymous Signal Toast Notice */}
          {thinkAboutYouNotice && (
            <div className="p-3.5 rounded-2xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-slate-900 text-xs font-bold flex items-center gap-2 shadow-md animate-slide-down">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#FF6B00] shrink-0" />
              {thinkAboutYouNotice}
            </div>
          )}

          {/* Confession Cards Stack */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mx-auto" />
              <p className="text-xs font-mono font-bold text-slate-500">Loading campus confessions...</p>
            </div>
          ) : filteredConfessions.length > 0 ? (
            <>
              {filteredConfessions.map((confession) => (
                <ConfessionCard
                  key={confession.id}
                  confession={confession}
                  onOpenReport={(code) => setReportingCode(code)}
                  onOpenThinkAboutYou={handleThinkAboutYou}
                />
              ))}

              {/* Infinite Scroll / Load More */}
              {hasMore && (
                <div className="pt-2 pb-6 text-center">
                  <button
                    onClick={loadMoreConfessions}
                    disabled={loadingMore}
                    className="px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-xs font-black transition-all shadow-md disabled:opacity-50 inline-flex items-center gap-2 font-mono"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                        Fetching more confessions...
                      </>
                    ) : (
                      'Load Earlier Confessions'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState type="feed" />
          )}
        </section>

        {/* Right Column: Stitch Google Live Metrics & Trending Bento Card */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-22 h-fit">
          <div className="rounded-[28px] bg-white border border-slate-200/80 p-5 space-y-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Campus Pulse</h3>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">LIVE</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121212] text-white space-y-1 shadow-md">
              <span className="text-[10px] text-[#FF6B00] font-mono uppercase tracking-wider block font-bold">TOTAL CONFESSIONS</span>
              <div className="text-2xl font-black text-white font-mono">$64,320+</div>
              <span className="text-[11px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                <TrendingUp className="w-3 h-3 inline" /> +18.4% this week
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {['#LNJPITConfessions', '#HostelNight', '#MidSemTrauma', '#CrushAlert'].map((tag, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#F4F3EF] border border-slate-200 text-xs flex justify-between items-center hover:border-[#FF6B00]/40 transition-all">
                  <span className="font-bold text-slate-900 font-mono">{tag}</span>
                  <span className="text-[10px] text-[#FF6B00] font-mono font-bold">{12 + idx * 8} signals</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </main>

      {/* Composer Modal */}
      {isComposerOpen && (
        <ConfessionComposer
          onClose={() => setIsComposerOpen(false)}
          onPostSuccess={handlePostSuccess}
        />
      )}

      <MobileNav onOpenComposer={() => setIsComposerOpen(true)} />
    </div>
  );
}
