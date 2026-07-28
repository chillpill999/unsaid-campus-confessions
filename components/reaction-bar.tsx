'use client';

import React, { useState } from 'react';
import { ReactionType } from '@/lib/types';

interface ReactionBarProps {
  confessionId: string;
  initialCounts: Record<ReactionType, number>;
  initialUserReaction?: ReactionType | null;
  onReact?: (type: ReactionType) => void;
  customPillClass?: string;
}

const REACTIONS: { type: ReactionType; label: string; emoji: string }[] = [
  { type: 'relatable', label: 'Relatable', emoji: '❤️' },
  { type: 'funny', label: 'Funny', emoji: '😂' },
  { type: 'support', label: 'Support', emoji: '🫂' },
  { type: 'interesting', label: 'Interesting', emoji: '👀' },
];

export function ReactionBar({
  confessionId,
  initialCounts,
  initialUserReaction = null,
  onReact,
  customPillClass = '',
}: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    relatable: initialCounts.relatable || 0,
    funny: initialCounts.funny || 0,
    support: initialCounts.support || 0,
    interesting: initialCounts.interesting || 0,
  });

  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(initialUserReaction);

  const handleToggle = (type: ReactionType) => {
    setCounts((prev) => {
      const newCounts = { ...prev };
      if (activeReaction === type) {
        newCounts[type] = Math.max(0, newCounts[type] - 1);
        setActiveReaction(null);
      } else {
        if (activeReaction) {
          newCounts[activeReaction] = Math.max(0, newCounts[activeReaction] - 1);
        }
        newCounts[type] = (newCounts[type] || 0) + 1;
        setActiveReaction(type);
      }
      return newCounts;
    });

    if (onReact) {
      onReact(type);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {REACTIONS.map((item) => {
        const isSelected = activeReaction === item.type;
        const count = counts[item.type] || 0;

        return (
          <button
            key={item.type}
            onClick={() => handleToggle(item.type)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0 ${
              isSelected
                ? 'bg-[#FF6B00] text-white border-transparent shadow-md shadow-[#FF6B00]/25 scale-105'
                : customPillClass || 'bg-black/10 text-slate-800 hover:bg-black/20 border border-black/10'
            }`}
          >
            <span className="text-xs sm:text-sm">{item.emoji}</span>
            <span className="font-mono">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
