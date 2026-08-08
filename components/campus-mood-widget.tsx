'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { CampusMood, MoodStat } from '@/lib/types';

const MOOD_META: { mood: CampusMood; label: string; emoji: string }[] = [
  { mood: 'chaos', label: 'Chaos', emoji: '😂' },
  { mood: 'exhausted', label: 'Exhausted', emoji: '😴' },
  { mood: 'trauma', label: 'Assignment Trauma', emoji: '😭' },
  { mood: 'romantic', label: 'Romantic', emoji: '❤️' },
  { mood: 'motivated', label: 'Motivated', emoji: '🔥' },
  { mood: 'surviving', label: 'Surviving', emoji: '🫠' },
];

function buildMoods(stats: Record<string, number>): MoodStat[] {
  const total = Object.values(stats).reduce((acc, c) => acc + c, 0);
  return MOOD_META.map((meta) => {
    const count = stats[meta.mood] || 0;
    return {
      mood: meta.mood,
      label: meta.label,
      emoji: meta.emoji,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      count,
    };
  });
}

export function CampusMoodWidget() {
  const [moods, setMoods] = useState<MoodStat[]>(buildMoods({}));
  const [loading, setLoading] = useState(true);
  const [userVotedMood, setUserVotedMood] = useState<CampusMood | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { getMoodStats } = await import('@/lib/actions/feed');
        const stats = await getMoodStats();
        if (!mounted) return;
        const byMood: Record<string, number> = {};
        stats.forEach((s) => { byMood[s.mood] = s.count; });
        setMoods(buildMoods(byMood));
      } catch (err) {
        console.warn('Mood stats load note:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleVote = async (selectedMood: CampusMood) => {
    if (userVotedMood) return; // Only 1 vote per day

    // Optimistic local update
    setMoods((prev) => {
      const next = prev.map((m) =>
        m.mood === selectedMood ? { ...m, count: m.count + 1 } : m
      );
      const total = next.reduce((acc, m) => acc + m.count, 0);
      return next.map((m) => ({
        ...m,
        percentage: total > 0 ? Math.round((m.count / total) * 100) : 0,
      }));
    });
    setUserVotedMood(selectedMood);

    try {
      const { voteMood } = await import('@/lib/actions/feed');
      await voteMood(selectedMood);
    } catch (err) {
      console.warn('Mood vote note:', err);
      setUserVotedMood(null);
    }
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
