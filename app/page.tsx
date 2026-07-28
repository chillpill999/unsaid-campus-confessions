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
              Made with <Heart className="w-3 h-3 text-[#FF6B00] fill-[#FF6B00] inline" /> love of Hothlali Members
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
