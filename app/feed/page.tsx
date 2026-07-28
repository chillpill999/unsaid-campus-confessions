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
import { fetchPublicConfessions } from '@/lib/actions/feed';
import { useRealtimeFeed } from '@/lib/realtime/hooks';
import { RealtimeDevStatus } from '@/components/realtime-dev-status';
import { Flame, Sparkles, PlusCircle, Heart } from 'lucide-react';

export default function FeedPage() {
  const router = useRouter();
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [confessions, setConfessions] = useState<PublicConfession[]>([]);
  const [activeTab, setActiveTab] = useState<'for-you' | 'latest' | 'trending'>('latest');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  // Modals state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [reportingCode, setReportingCode] = useState<string | null>(null);
  const [thinkAboutYouNotice, setThinkAboutYouNotice] = useState<string | null>(null);

  const fetchLiveConfessions = async () => {
    try {
      const res = await fetch('/api/confessions');
      const json = await res.json();
      if (json && json.success && json.confessions) {
        setConfessions(json.confessions);
      }
    } catch (err) {
      console.warn('Realtime feed refetch note:', err);
    }
  };

  // 1. Subscribe to Supabase Realtime Campus Feed Broadcasts
  useRealtimeFeed({
    onConfessionPosted: () => fetchLiveConfessions(),
    onConfessionDeleted: (code) => {
      setConfessions((prev) => prev.filter((c) => c.public_code !== code));
    },
    onReactionUpdated: (code, counts) => {
      setConfessions((prev) =>
        prev.map((c) => (c.public_code === code ? { ...c, reaction_counts: counts } : c))
      );
    },
    onCommentUpdated: (code, count) => {
      setConfessions((prev) =>
        prev.map((c) => (c.public_code === code ? { ...c, comment_count: count } : c))
      );
    },
    onPollUpdated: (code, pollData) => {
      setConfessions((prev) =>
        prev.map((c) => (c.public_code === code ? { ...c, poll_data: pollData } : c))
      );
    },
  });

  // Load shared confessions from Supabase PostgreSQL Database across all devices
  useEffect(() => {
    loadConfessions();

    async function loadConfessions() {
      try {
        const res = await fetch('/api/confessions');
        const json = await res.json();
        if (json && json.success && json.confessions) {
          setConfessions(json.confessions);
          return;
        }
      } catch (err) {
        console.warn('API fetch fallback to Server Action:', err);
      }

      try {
        const serverData = await fetchPublicConfessions();
        if (serverData && serverData.length > 0) {
          setConfessions(serverData as PublicConfession[]);
          return;
        }
      } catch (err) {
        console.error('Failed to load public confessions:', err);
      }
    }
  }, []);

  // STRICT Client-Side Authentication Guard — blocks rendering until verified
  useEffect(() => {
    async function verifyAuth() {
      try {
        // 1. Try to verify via Supabase (to sync cross-device identities)
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (user && !error) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('unsaid_uid', user.id);
            localStorage.setItem('unsaid_session', 'student');
            document.cookie = "unsaid_session=student; path=/; max-age=2592000; SameSite=Lax";
            document.cookie = `unsaid_uid=${user.id}; path=/; max-age=2592000; SameSite=Lax`;

            // Sync profile data from Supabase DB to localStorage
            try {
              const { getProfile } = await import('@/lib/actions/profile');
              const dbProfile = await getProfile();
              if (dbProfile) {
                const profileObj = {
                  fullName: 'Student User',
                  gender: dbProfile.gender,
                  department: dbProfile.department,
                  batch: dbProfile.batch,
                  college: 'Loknayak Jai Prakash Institute of Technology',
                  completedAt: Date.now()
                };
                localStorage.setItem(`unsaid_profile_${user.id}`, JSON.stringify(profileObj));
                localStorage.setItem('unsaid_gender', dbProfile.gender);
                localStorage.setItem('unsaid_department', dbProfile.department);
                localStorage.setItem('unsaid_batch', dbProfile.batch);
              }
            } catch (profileErr) {
              console.error('Failed to sync profile from DB:', profileErr);
            }
          }
          setIsAuthVerified(true);
          return;
        }

        // 2. Fallback check local session for instant student access mode
        if (typeof window !== 'undefined') {
          const hasLocalSession = localStorage.getItem('unsaid_session') || localStorage.getItem('unsaid_demo_role') || document.cookie.includes('unsaid_session=');
          if (hasLocalSession) {
            setIsAuthVerified(true);
            return;
          }
        }

        router.replace('/login');
      } catch (err) {
        // Network/other exception fallback: check local session
        if (typeof window !== 'undefined' && (localStorage.getItem('unsaid_session') || localStorage.getItem('unsaid_demo_role') || document.cookie.includes('unsaid_session='))) {
          setIsAuthVerified(true);
          return;
        }
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

  const featuredConfession = confessions.find((c) => c.is_featured) || confessions[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenComposer={() => setIsComposerOpen(true)} />

      {/* Main Container: Responsive 3-Column Desktop Layout */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
        
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
            <div className="pt-2.5 mt-2 border-t border-slate-800/80 text-[11px] text-pink-400 font-semibold flex items-center gap-1.5">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 inline" />
              <span>of Hothlali Members</span>
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
                className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedCategorySlug === null
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                All
              </button>
              {MOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          
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

      {/* Global Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-1.5 text-pink-400 font-semibold">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 inline" />
          <span>of Hothlali Members</span>
        </div>
      </footer>

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

      {/* Realtime Development Diagnostics Widget */}
      <RealtimeDevStatus />
    </div>
  );
}
