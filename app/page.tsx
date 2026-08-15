'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { HeroNetworkCanvas } from '@/components/hero-network-canvas';
import { 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare,
  Zap,
  Radio,
  Laugh,
  Home,
  TrendingUp,
  Compass
} from 'lucide-react';

export default function LandingPage() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsSignedIn(Boolean(data.user));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col selection:bg-[#FF6B00] selection:text-white">
      
      {/* Top Header - Stitch Google Light Porcelain Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-[#F4F3EF]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00] flex items-center justify-center text-white font-black shadow-md shadow-[#FF6B00]/25 group-hover:scale-105 transition-transform shrink-0">
              <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-slate-950 group-hover:text-[#FF6B00] transition-colors">
              ConfessionLnjpit
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/privacy"
              className="text-xs font-mono font-bold text-slate-600 hover:text-[#FF6B00] hidden sm:inline-block transition-colors"
            >
              Privacy & Anonymity
            </Link>
            <Link
              href={isSignedIn ? '/feed' : '/login'}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs transition-all shadow-md shadow-[#FF6B00]/25 shrink-0"
            >
              {isSignedIn ? 'Go to Feed' : 'Join Campus'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 pb-12 sm:pt-20 sm:pb-24 px-4 overflow-hidden">
        {/* Interactive 3D Particle Network Canvas Background */}
        <div className="absolute inset-0 z-0 opacity-40 sm:opacity-55 pointer-events-auto">
          <HeroNetworkCanvas particleCount={65} />
        </div>

        {/* Glow background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-60 h-60 sm:w-80 sm:h-80 bg-[#769B6C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 rounded-full bg-white border border-slate-200 text-[#FF6B00] text-[11px] sm:text-xs font-mono font-bold shadow-sm max-w-full truncate">
            <Radio className="w-3.5 h-3.5 text-[#FF6B00] animate-pulse shrink-0" />
            <span className="truncate">Verified Campus Network • LNJPIT Chhapra</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-slate-950 leading-[1.15] sm:leading-tight font-heading">
            Say it without saying <span className="text-[#FF6B00]">who you are.</span>
          </h1>

          <p className="text-slate-600 text-xs sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-1 font-sans">
            The anonymous space for your campus — confessions, crushes, hostel stories, questions, and everything left unsaid.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto w-full">
            <Link
              href="/feed"
              className="w-full sm:w-auto px-7 py-3.5 sm:py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-sm shadow-xl shadow-[#FF6B00]/25 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore Campus Feed
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={isSignedIn ? '/feed' : '/login'}
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 transition-colors flex items-center justify-center font-mono shadow-sm"
            >
              {isSignedIn ? 'Continue as Student' : 'Google Student Sign-In'}
            </Link>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-500 pt-1 font-mono">
            Verified with Google OAuth • Publicly Anonymous to all students
          </p>
        </div>

      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 px-4 border-t border-slate-200 bg-white/60">
        <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-3xl font-black text-slate-950 font-heading">How ConfessionLnjpit Works</h2>
            <p className="text-slate-600 text-xs sm:text-sm font-sans">Built for authentic LNJPIT Chapra campus interaction with strict safety guardrails.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-2xl sm:rounded-[28px] bg-white border border-slate-200 p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center justify-center font-black text-base sm:text-lg font-mono">
                1
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950">Google Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log in securely using your real Google account. We verify that you are a real LNJPIT student.
              </p>
            </div>

            <div className="rounded-2xl sm:rounded-[28px] bg-white border border-slate-200 p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#769B6C]/20 text-[#2E5E24] border border-[#769B6C]/30 flex items-center justify-center font-black text-base sm:text-lg font-mono">
                2
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950">Public Anonymity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Other students see only <span className="text-[#FF6B00] font-bold font-mono">Anonymous • Gender</span>. Your name and email are never exposed.
              </p>
            </div>

            <div className="rounded-2xl sm:rounded-[28px] bg-white border border-slate-200 p-5 sm:p-6 space-y-2.5 sm:space-y-3 shadow-md">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#D1311F]/20 text-[#D1311F] border border-[#D1311F]/30 flex items-center justify-center font-black text-base sm:text-lg font-mono">
                3
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-950">Admin Accountability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorized administrators can resolve identities for severe safety or abuse investigations with full audit logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* High-Impact SEO Information Section for Google Search Engines */}
      <section className="py-12 sm:py-16 px-4 border-t border-slate-200/80 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">
              LNJPIT Confession — Loknayak Jai Prakash Institute of Technology (Chapra)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Welcome to <strong>ConfessionLnjpit</strong>, the official anonymous student community platform designed exclusively for <strong>Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar)</strong>. Whether you are a B.Tech student in Computer Science & Engineering (CSE), Food Processing & Preservation (FPP), Electrical Engineering (EE), Civil Engineering, or Mechanical Engineering, this platform allows you to voice your unsaid thoughts safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-[#F4F3EF] border border-slate-200/80 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6B00]" />
                LNJPIT Campus Confessions & Stories
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore real, unedited anonymous campus confessions from LNJPIT hostels, library sessions, semester exams, and college events. Share your own stories without fear of judgment or exposure.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F4F3EF] border border-slate-200/80 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#FF6B00]" />
                Anonymous Crush Signals & Peer Support
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Got a crush in your batch or department at LNJPIT Chapra? Send anonymous crush signals and start private, end-to-end encrypted anonymous chats without revealing who you are.
              </p>
            </div>
          </div>

          {/* Search Engine FAQ Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-lg font-black text-slate-950 font-heading">
              Frequently Asked Questions (LNJPIT Chapra Student Portal)
            </h3>

            <div className="space-y-3 font-sans text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">How do I search or post on LNJPIT Confessions?</h4>
                <p className="text-slate-600">
                  Visit <Link href="/feed" className="text-[#FF6B00] font-bold underline">confessionlnjpit.in/feed</Link> to browse the live campus feed, search confessions by public code or department, and submit your own confession anonymously after single sign-in.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Is ConfessionLnjpit safe and 100% anonymous?</h4>
                <p className="text-slate-600">
                  Yes! All public confessions and comments strip author metadata at the database level. Your peers will only see your anonymous snapshot label and gender.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-600 pb-24 sm:pb-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 sm:text-left text-center">
            <div>© 2026 ConfessionLnjpit Campus Platform. All rights reserved.</div>
            <div className="text-[11px] text-[#FF6B00] font-medium flex items-center justify-center sm:justify-start gap-1 font-mono">
              Made with <Heart className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00] inline animate-pulse" /> love of Hothlali Department
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 font-mono text-[11px] sm:text-xs">
            <Link href="/guidelines" className="hover:text-[#FF6B00]">Community Guidelines</Link>
            <Link href="/privacy" className="hover:text-[#FF6B00]">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
