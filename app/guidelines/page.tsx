'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ShieldCheck, Heart, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-950 font-heading">Community Guidelines</h1>
            <p className="text-xs text-slate-600">Strict rules to keep LNJPIT confessions safe, fun, and authentic.</p>
          </div>
        </div>

        <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-950">Respect Student Privacy</h3>
                <p className="text-xs text-slate-600 mt-0.5">Do not post phone numbers, personal addresses, private social handles, or sensitive personal photos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-950">Zero Bullying & Harassment</h3>
                <p className="text-xs text-slate-600 mt-0.5">Hate speech, targeted harassment, slurs, and physical threats will result in instant account suspension.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-950">Authentic Campus Experience</h3>
                <p className="text-xs text-slate-600 mt-0.5">ConfessionLnjpit is built for authentic student expression — crushes, hostel banter, academic humor, and genuine questions.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
