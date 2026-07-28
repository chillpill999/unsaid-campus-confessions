'use client';

import React from 'react';
import Link from 'next/link';
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
  DollarSign
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col selection:bg-[#FF6B00] selection:text-white">
      
      {/* Top Header - Stitch Google Light Porcelain Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-[#F4F3EF]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] flex items-center justify-center text-white font-black shadow-md shadow-[#FF6B00]/25">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-heading font-black text-xl tracking-tight text-slate-950">
              ConfessionLnjpit
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs font-mono font-bold text-slate-600 hover:text-[#FF6B00] hidden sm:inline-block transition-colors"
            >
              Privacy & Anonymity
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs transition-all shadow-md shadow-[#FF6B00]/25"
            >
              Join Your Campus
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 px-4 overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-[#769B6C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[#FF6B00] text-xs font-mono font-bold shadow-sm">
            <Radio className="w-3.5 h-3.5 text-[#FF6B00] animate-pulse" />
            Verified Campus Network • LNJPIT Chhapra
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight text-slate-950 leading-tight font-heading">
            Say it without saying <span className="text-[#FF6B00]">who you are.</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2 font-sans">
            The anonymous space for your campus — confessions, crushes, hostel stories, questions, and everything left unsaid.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-sm shadow-xl shadow-[#FF6B00]/25 transition-all flex items-center justify-center gap-2"
            >
              Join Your Campus
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/guidelines"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center font-mono shadow-sm"
            >
              Read Community Guidelines
            </Link>
          </div>

          <p className="text-xs text-slate-500 pt-2 font-mono">
            Verified with Google Auth • Publicly Anonymous to other students
          </p>
        </div>

        {/* Stitch Google Bento Card Showcase Grid on Light Warm Canvas */}
        <div className="max-w-5xl mx-auto mt-14 grid grid-cols-1 sm:grid-cols-12 gap-4 px-2">
          
          {/* Card 1: Primary Vibrant Orange Bento Card */}
          <div className="sm:col-span-6 rounded-[28px] bg-[#FF6B00] text-white p-6 shadow-xl space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold">
                <Heart className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/20 text-white border border-white/20 font-mono">
                Crush Signal
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-white/80 uppercase tracking-wider block">Anonymous • Female</span>
              <p className="text-lg font-bold text-white mt-1 leading-snug font-sans">
                "To the 3rd year CSE guy in black hoodie... you make 8 AM lectures worth attending ❤️"
              </p>
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-white/80 pt-2 border-t border-white/20">
              <span>Public Code #CF921K</span>
              <span>142 Reactions</span>
            </div>
          </div>

          {/* Card 2: Dark Feature Metric Card (#121212) */}
          <div className="sm:col-span-6 rounded-[28px] bg-[#121212] text-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B00] font-bold">LIVE METRICS</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                Active 24/7
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white font-mono tracking-tight">$64,320+</div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span className="text-emerald-400 font-bold">+18.4%</span> campus engagement this week
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LNJPIT Verified Student Single Source of Truth</span>
            </div>
          </div>

          {/* Card 3: Sage Green Bento Card */}
          <div className="sm:col-span-4 rounded-[28px] bg-[#C6EAA5] text-slate-950 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#769B6C]/25 text-[#2E5E24] flex items-center justify-center font-bold">
                <Home className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950/10 text-slate-900 font-mono">
                Hostel Life
              </span>
            </div>
            <p className="text-xs font-bold text-slate-950 leading-relaxed font-sans">
              "Hostel 2 warden is doing night round... turn off loud speakers guys! 💀"
            </p>
          </div>

          {/* Card 4: Pastel Soft Rust Card */}
          <div className="sm:col-span-4 rounded-[28px] bg-[#FCDAD7] text-slate-950 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#D1311F]/15 text-[#D1311F] flex items-center justify-center font-bold">
                <Laugh className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950/10 text-slate-900 font-mono">
                Funny
              </span>
            </div>
            <p className="text-xs font-bold text-slate-950 leading-relaxed font-sans">
              "Slept through mid-sem exam thinking it was tomorrow... send help 😂"
            </p>
          </div>

          {/* Card 5: Soft Warm Cream Card */}
          <div className="sm:col-span-4 rounded-[28px] bg-[#EAE8E3] text-slate-950 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-950/10 text-slate-900 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-950/10 text-slate-900 font-mono">
                Appreciation
              </span>
            </div>
            <p className="text-xs font-bold text-slate-950 leading-relaxed font-sans">
              "Shoutout to the library uncle for keeping extra water bottles during heatwave! ✨"
            </p>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 border-t border-slate-200 bg-white/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading">How ConfessionLnjpit Works</h2>
            <p className="text-slate-600 text-xs sm:text-sm font-sans">Built for authentic campus interaction with strict safety guardrails.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="rounded-[28px] bg-white border border-slate-200 p-6 space-y-3 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center justify-center font-black text-lg font-mono">
                1
              </div>
              <h3 className="text-base font-bold text-slate-950">Google Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log in securely using your real Google account. We verify that you are a real student.
              </p>
            </div>

            <div className="rounded-[28px] bg-white border border-slate-200 p-6 space-y-3 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-[#769B6C]/20 text-[#2E5E24] border border-[#769B6C]/30 flex items-center justify-center font-black text-lg font-mono">
                2
              </div>
              <h3 className="text-base font-bold text-slate-950">Public Anonymity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Other students see only <span className="text-[#FF6B00] font-bold font-mono">Anonymous • Gender</span>. Your name and email are never exposed.
              </p>
            </div>

            <div className="rounded-[28px] bg-white border border-slate-200 p-6 space-y-3 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-[#D1311F]/20 text-[#D1311F] border border-[#D1311F]/30 flex items-center justify-center font-black text-lg font-mono">
                3
              </div>
              <h3 className="text-base font-bold text-slate-950">Admin Accountability</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorized administrators can resolve identities for severe safety or abuse investigations with full audit logging.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 sm:text-left text-center">
            <div>© 2026 ConfessionLnjpit Campus Platform. All rights reserved.</div>
            <div className="text-[11px] text-[#FF6B00] font-medium flex items-center justify-center sm:justify-start gap-1 font-mono">
              Made With <Heart className="w-3 h-3 text-[#FF6B00] fill-[#FF6B00] inline" /> for LNJPIT Students
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono">
            <Link href="/guidelines" className="hover:text-[#FF6B00]">Community Guidelines</Link>
            <Link href="/privacy" className="hover:text-[#FF6B00]">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
