'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Users, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare,
  HelpCircle,
  Zap,
  Radio,
  Flame,
  Laugh,
  Home,
  Compass
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      
      {/* Top Header - Material iOS Floating Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-heading font-black text-xl tracking-tight text-white font-heading">
              ConfessionLnjpit
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs font-mono font-bold text-slate-400 hover:text-cyan-300 hidden sm:inline-block transition-colors"
            >
              Privacy & Anonymity
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:brightness-110 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              Join Your Campus
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 px-4 overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold shadow-lg">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Verified Campus Network • LNJPIT Chhapra
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-white leading-tight font-heading">
            Say it without saying <span className="gradient-text">who you are.</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2 font-sans">
            The anonymous space for your campus — confessions, crushes, hostel stories, questions, and everything left unsaid.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              Join Your Campus
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/guidelines"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold text-xs border border-slate-800 transition-colors flex items-center justify-center font-mono"
            >
              Read Community Guidelines
            </Link>
          </div>

          <p className="text-xs text-slate-500 pt-2 font-mono">
            Verified with Google Auth • Publicly Anonymous to other students
          </p>
        </div>

        {/* Material iOS Stacked Card Preview Showcase */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
          
          {/* Card 1: Crush */}
          <div className="rounded-[28px] bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/40 p-5 shadow-2xl space-y-3 transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Crush Signal</span>
                <span className="text-[10px] font-mono text-rose-400">Anonymous • Female</span>
              </div>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              "To the guy in 3rd year CSE who always wears black hoodie... you make lectures bearable ❤️"
            </p>
          </div>

          {/* Card 2: Confession */}
          <div className="rounded-[28px] bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/40 p-5 shadow-2xl space-y-3 transform sm:scale-105 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Hostel Confession</span>
                <span className="text-[10px] font-mono text-indigo-400">Anonymous • Male</span>
              </div>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              "Mess food was actually fire today, don't tell anyone I said this 🤫"
            </p>
          </div>

          {/* Card 3: Funny */}
          <div className="rounded-[28px] bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/40 p-5 shadow-2xl space-y-3 transform rotate-1 hover:rotate-0 transition-transform">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Laugh className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Funny Moment</span>
                <span className="text-[10px] font-mono text-amber-400">Anonymous • Male</span>
              </div>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              "Slept through entire mid-sem exam thinking it was tomorrow... send help 😂"
            </p>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">How ConfessionLnjpit Works</h2>
            <p className="text-slate-400 text-xs sm:text-sm font-sans">Built for authentic campus interaction with strict safety guardrails.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="rounded-[28px] bg-slate-900/60 border border-slate-800 p-6 space-y-3 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-black text-lg font-mono">
                1
              </div>
              <h3 className="text-base font-bold text-white">Google Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in securely using your real Google account. We verify that you are a real student.
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-900/60 border border-slate-800 p-6 space-y-3 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-lg font-mono">
                2
              </div>
              <h3 className="text-base font-bold text-white">Public Anonymity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Other students see only <span className="text-cyan-300 font-bold font-mono">Anonymous • Gender</span>. Your name and email are never exposed.
              </p>
            </div>

            <div className="rounded-[28px] bg-slate-900/60 border border-slate-800 p-6 space-y-3 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center justify-center font-black text-lg font-mono">
                3
              </div>
              <h3 className="text-base font-bold text-white">Admin Accountability</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorized administrators can resolve identities for severe safety or abuse investigations with full audit logging.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 sm:text-left text-center">
            <div>© 2026 ConfessionLnjpit Campus Platform. All rights reserved.</div>
            <div className="text-[11px] text-pink-400/90 font-medium flex items-center justify-center sm:justify-start gap-1 font-mono">
              Made With <Heart className="w-3 h-3 text-pink-500 fill-pink-500 inline" /> for LNJPIT Students
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono">
            <Link href="/guidelines" className="hover:text-cyan-300">Community Guidelines</Link>
            <Link href="/privacy" className="hover:text-cyan-300">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
