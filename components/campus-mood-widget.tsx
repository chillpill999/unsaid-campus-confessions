'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { CampusMood, MoodStat } from '@/lib/types';
import { MOCK_CAMPUS_MOOD } from '@/lib/mock-data';

export function CampusMoodWidget() {
  const [moods, setMoods] = useState<MoodStat[]>(MOCK_CAMPUS_MOOD);
  const [userVotedMood, setUserVotedMood] = useState<CampusMood | null>(null);

  const handleVote = (selectedMood: CampusMood) => {
    if (userVotedMood) return; // Only 1 vote per day

    setMoods((prev) => {
      const total = prev.reduce((acc, curr) => acc + (curr.mood === selectedMood ? curr.count + 1 : curr.count), 0);
      return prev.map((m) => {
        const count = m.mood === selectedMood ? m.count + 1 : m.count;
        return {
          ...m,
          count,
          percentage: Math.round((count / total) * 100),
        };
      });
    });

    setUserVotedMood(selectedMood);
  };

  return (
    <div className="glass-card p-5 space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-extrabold text-white">Campus Mood Today</h3>
        </div>
        {userVotedMood && (
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Voted
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {moods.map((stat) => {
          const isSelected = userVotedMood === stat.mood;
          return (
            <button
              key={stat.mood}
              onClick={() => handleVote(stat.mood)}
              disabled={Boolean(userVotedMood)}
              className={`w-full text-left relative overflow-hidden rounded-xl p-3 border transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                  : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 text-slate-300'
              }`}
            >
              {/* Animated Percentage Fill Bar */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 transition-all duration-500 pointer-events-none"
                style={{ width: `${stat.percentage}%` }}
              />

              <div className="relative flex items-center justify-between text-xs font-semibold z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{stat.emoji}</span>
                  <span>{stat.label}</span>
                </div>
                <span className="font-mono text-indigo-300">{stat.percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-500 text-center font-mono">
        1 vote per student daily • Fully Anonymous
      </div>
    </div>
  );
}
