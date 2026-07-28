'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Lock, 
  Heart, 
  Laugh, 
  Home, 
  Sparkles, 
  HelpCircle, 
  Compass, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Flag, 
  Eye,
  Check,
  Send,
  Zap,
  Radio
} from 'lucide-react';
import { PublicConfession, ReactionType } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { ReactionBar } from './reaction-bar';
import { toggleReaction } from '@/lib/actions/feed';
import { broadcastReactionUpdate, broadcastPollUpdate } from '@/lib/realtime/broadcast';

interface ConfessionCardProps {
  confession: PublicConfession;
  onOpenReport?: (confessionCode: string) => void;
  onOpenThinkAboutYou?: (confessionCode: string) => void;
  isDetailView?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Lock,
  Heart,
  Laugh,
  Home,
  Sparkles,
  HelpCircle,
  Compass,
};

// Stitch Google Vibrant Ledger Category Card Color Schemes
const CATEGORY_THEMES: Record<string, {
  cardClass: string;
  pillClass: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  subtextColor: string;
  dividerColor: string;
}> = {
  crush: {
    cardClass: 'bg-[#FF6B00] text-white border-transparent shadow-xl',
    pillClass: 'bg-black/20 text-white border border-white/20',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    subtextColor: 'text-white/80',
    dividerColor: 'border-white/20',
  },
  funny: {
    cardClass: 'bg-[#FCDAD7] text-slate-950 border-transparent shadow-xl',
    pillClass: 'bg-slate-950/10 text-slate-900 border border-slate-950/10',
    iconBg: 'bg-[#D1311F]/15',
    iconColor: 'text-[#D1311F]',
    textColor: 'text-slate-950',
    subtextColor: 'text-slate-700',
    dividerColor: 'border-slate-950/10',
  },
  hostel: {
    cardClass: 'bg-[#C6EAA5] text-slate-950 border-transparent shadow-xl',
    pillClass: 'bg-slate-950/10 text-slate-900 border border-slate-950/10',
    iconBg: 'bg-[#769B6C]/25',
    iconColor: 'text-[#2E5E24]',
    textColor: 'text-slate-950',
    subtextColor: 'text-slate-700',
    dividerColor: 'border-slate-950/10',
  },
  appreciation: {
    cardClass: 'bg-[#EAE8E3] text-slate-950 border-transparent shadow-xl',
    pillClass: 'bg-slate-950/10 text-slate-900 border border-slate-950/10',
    iconBg: 'bg-slate-950/10',
    iconColor: 'text-slate-900',
    textColor: 'text-slate-950',
    subtextColor: 'text-slate-700',
    dividerColor: 'border-slate-950/10',
  },
  question: {
    cardClass: 'bg-[#121212] text-white border border-slate-800 shadow-xl',
    pillClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    iconBg: 'bg-[#FF6B00]/20',
    iconColor: 'text-[#FF6B00]',
    textColor: 'text-white',
    subtextColor: 'text-slate-400',
    dividerColor: 'border-slate-800',
  },
  'campus-life': {
    cardClass: 'bg-slate-900 text-white border border-slate-800 shadow-xl',
    pillClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    iconBg: 'bg-[#FF6B00]/20',
    iconColor: 'text-[#FF6B00]',
    textColor: 'text-white',
    subtextColor: 'text-slate-400',
    dividerColor: 'border-slate-800',
  },
  confession: {
    cardClass: 'bg-[#121212] text-white border border-slate-800 shadow-xl',
    pillClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    iconBg: 'bg-[#FF6B00]/20',
    iconColor: 'text-[#FF6B00]',
    textColor: 'text-white',
    subtextColor: 'text-slate-400',
    dividerColor: 'border-slate-800',
  },
};

export function ConfessionCard({
  confession,
  onOpenReport,
  onOpenThinkAboutYou,
  isDetailView = false,
}: ConfessionCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(confession.is_bookmarked || false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pollData, setPollData] = useState(confession.poll_data);

  const IconComponent = CATEGORY_ICONS[confession.category_icon] || Lock;
  const theme = CATEGORY_THEMES[confession.category_slug] || CATEGORY_THEMES.confession;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(confession.public_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleVotePoll = (optionId: string) => {
    if (!pollData || pollData.user_voted_option_id) return;
    const updatedOptions = pollData.options.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    const updatedPoll = {
      ...pollData,
      total_votes: pollData.total_votes + 1,
      options: updatedOptions,
      user_voted_option_id: optionId,
    };
    setPollData(updatedPoll);
    broadcastPollUpdate(confession.public_code, updatedPoll);
  };

  return (
    <article className={`rounded-2xl sm:rounded-[28px] ${theme.cardClass} p-4 sm:p-6 mb-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl group`}>
      
      {/* Featured Accent Indicator */}
      {confession.is_featured && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#FF6B00]" />
      )}

      {/* Header: Author Info + Category & Code Tags (Mobile Wrap Layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3.5">
        
        {/* Left: Avatar + Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl ${theme.iconBg} ${theme.iconColor} flex items-center justify-center font-bold shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs sm:text-sm font-black font-heading truncate ${theme.textColor}`}>
                Anonymous Student
              </span>
              {confession.gender && confession.gender !== 'Prefer not to say' && (
                <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-md ${theme.pillClass} shrink-0`}>
                  {confession.gender}
                </span>
              )}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-mono flex items-center gap-1 mt-0.5 ${theme.subtextColor}`}>
              <Radio className="w-2.5 h-2.5 text-[#FF6B00] animate-pulse shrink-0" />
              {formatTimeAgo(confession.created_at)}
            </span>
          </div>
        </div>

        {/* Right: Category Pill & Public Code Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
          <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${theme.pillClass}`}>
            {confession.category_name}
          </span>
          <button
            onClick={handleCopyCode}
            className={`flex items-center gap-1 font-mono text-[10px] sm:text-xs px-2.5 py-1 rounded-full transition-all ${theme.pillClass}`}
            title="Click to copy public code"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="font-black">#</span>}
            <span className="font-bold">{confession.public_code}</span>
          </button>
        </div>
      </div>

      {/* Target Audience Badge */}
      {(confession.target_batch || confession.target_department) && (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full ${theme.pillClass}`}>
            Target: {confession.target_department || ''} {confession.target_batch ? `'${confession.target_batch.slice(-2)}` : ''}
          </span>
        </div>
      )}

      {/* Confession Content */}
      <div className={`text-xs sm:text-base leading-relaxed whitespace-pre-wrap mb-3.5 font-sans font-medium tracking-wide ${theme.textColor}`}>
        {confession.content}
      </div>

      {/* Optional Interactive Poll Widget */}
      {pollData && (
        <div className={`my-3 sm:my-4 p-3 sm:p-4 rounded-2xl bg-black/10 border ${theme.dividerColor} space-y-2`}>
          <div className={`text-[11px] sm:text-xs font-bold font-mono mb-1.5 uppercase tracking-wider flex items-center gap-1.5 ${theme.textColor}`}>
            <Zap className="w-3.5 h-3.5 text-[#FF6B00]" /> Poll: {pollData.question}
          </div>
          {pollData.options.map((opt) => {
            const pct = pollData.total_votes > 0 ? Math.round((opt.votes / pollData.total_votes) * 100) : 0;
            const isVoted = pollData.user_voted_option_id === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleVotePoll(opt.id)}
                disabled={Boolean(pollData.user_voted_option_id)}
                className={`w-full text-left relative overflow-hidden rounded-xl p-2.5 sm:p-3.5 border transition-all text-xs font-bold ${
                  isVoted
                    ? 'border-[#FF6B00] bg-[#FF6B00]/20 text-[#FF6B00]'
                    : `border-black/10 bg-black/5 hover:bg-black/10 ${theme.textColor}`
                }`}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#FF6B00]/25 transition-all duration-500 pointer-events-none"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex justify-between items-center z-10">
                  <span className="truncate pr-2">{opt.text}</span>
                  <span className="font-mono font-black text-xs shrink-0">{pct}%</span>
                </div>
              </button>
            );
          })}
          <div className={`text-[10px] sm:text-[11px] text-right font-mono ${theme.subtextColor}`}>
            {pollData.total_votes} votes recorded
          </div>
        </div>
      )}

      {/* Anonymous Signal Banner (Crush / Appreciation) */}
      {(confession.category_slug === 'crush' || confession.category_slug === 'appreciation') && (
        <div className={`my-3 sm:my-4 p-3 sm:p-4 rounded-2xl bg-black/10 border ${theme.dividerColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-sm`}>
          <div className={`flex items-center gap-2 text-xs font-bold ${theme.textColor}`}>
            <Eye className="w-4 h-4 text-[#FF6B00] animate-bounce shrink-0" />
            <span>Is this confession about you? 👀</span>
          </div>
          <button
            onClick={() => onOpenThinkAboutYou && onOpenThinkAboutYou(confession.public_code)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-950 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md hover:bg-slate-900"
          >
            <Send className="w-3.5 h-3.5" />
            Send Signal
          </button>
        </div>
      )}

      {/* Footer Controls: Reaction Bar & Action Buttons */}
      <div className={`pt-3 border-t ${theme.dividerColor} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        {/* Reaction Bar */}
        <ReactionBar
          confessionId={confession.id}
          initialCounts={confession.reaction_counts}
          initialUserReaction={confession.user_reaction}
          customPillClass={theme.pillClass}
          onReact={async (type) => {
            try {
              await toggleReaction(confession.id, type);
              const updatedCounts = { ...confession.reaction_counts };
              updatedCounts[type] = (updatedCounts[type] || 0) + 1;
              broadcastReactionUpdate(confession.public_code, updatedCounts);
            } catch (err) {
              console.warn('Reaction note:', err);
            }
          }}
        />

        {/* Action Buttons: Comments, Bookmark, Share, Report */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
          <Link
            href={`/confession/${confession.public_code}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${theme.pillClass}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{confession.comment_count}</span>
          </Link>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-full transition-all ${theme.pillClass} ${
              isBookmarked ? 'bg-[#FF6B00] text-white border-transparent' : ''
            }`}
            title="Save confession"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyCode}
            className={`p-2 rounded-full transition-all ${theme.pillClass}`}
            title="Share code"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {onOpenReport && (
            <button
              onClick={() => onOpenReport(confession.public_code)}
              className={`p-2 rounded-full transition-all hover:text-rose-500 ${theme.pillClass}`}
              title="Report confession"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
