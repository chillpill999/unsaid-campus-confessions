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
  ChevronRight, 
  CheckCircle2, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              Unsaid
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 hidden sm:inline-block"
            >
              Privacy & Anonymity
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20"
            >
              Join Your Campus
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verified Students • Public Anonymity</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-heading">
            Say it without saying <span className="gradient-text">who you are.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            The anonymous space for your campus — confessions, crushes, hostel stories, questions, and everything left unsaid.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold text-base shadow-xl shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Join Your Campus
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/guidelines"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition-colors flex items-center justify-center"
            >
              Read Community Guidelines
            </Link>
          </div>

          <p className="text-xs text-slate-500 pt-2 font-mono">
            Verified with Google Auth • Anonymous to other students
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How Unsaid Works</h2>
            <p className="text-slate-400 text-xs sm:text-sm">Built for authentic campus interaction with strict safety guardrails.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-white">Google Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in securely using your real Google account. We verify that you are a real student.
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-white">Public Anonymity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Other students see only <span className="text-indigo-400 font-semibold">Anonymous • Gender</span>. Your name and email are never shown.
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-lg">
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
          <div>© 2026 Unsaid Campus Platform. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/guidelines" className="hover:text-slate-300">Community Guidelines</Link>
            <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
