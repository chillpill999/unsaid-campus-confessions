'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Sparkles, MessageSquare } from 'lucide-react';
import { PublicConfession } from '@/lib/types';

interface ConfessionOfTheDayProps {
  confession: PublicConfession;
}

export function ConfessionOfTheDay({ confession }: ConfessionOfTheDayProps) {
  return (
    <div className="relative rounded-3xl p-0.5 bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-500 shadow-xl shadow-amber-500/10 mb-6">
      <div className="bg-slate-950 rounded-[23px] p-5 sm:p-6 relative overflow-hidden">
        {/* Glowing aura background circle */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Confession of the Day ✨</span>
          </div>
          <span className="font-mono text-xs text-indigo-400 font-semibold">#{confession.public_code}</span>
        </div>

        {/* Content */}
        <p className="text-slate-100 text-sm font-medium leading-relaxed my-3">
          &ldquo;{confession.content}&rdquo;
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs">
          <div className="text-slate-400 font-medium">
            Anonymous • <span className="text-indigo-400 font-semibold">{confession.gender}</span>
          </div>

          <Link
            href={`/confession/${confession.public_code}`}
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Join Discussion ({confession.comment_count})</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
