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
  Flame,
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

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
  crush: {
    bg: 'from-rose-950/40 via-slate-900/90 to-slate-950',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  },
  funny: {
    bg: 'from-amber-950/40 via-slate-900/90 to-slate-950',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  hostel: {
    bg: 'from-emerald-950/40 via-slate-900/90 to-slate-950',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  appreciation: {
    bg: 'from-purple-950/40 via-slate-900/90 to-slate-950',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  question: {
    bg: 'from-cyan-950/40 via-slate-900/90 to-slate-950',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  'campus-life': {
    bg: 'from-orange-950/40 via-slate-900/90 to-slate-950',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  },
  confession: {
    bg: 'from-indigo-950/40 via-slate-900/90 to-slate-950',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
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
  const style = CATEGORY_STYLES[confession.category_slug] || CATEGORY_STYLES.confession;

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
    <article className={`rounded-[28px] bg-gradient-to-b ${style.bg} border ${style.border} p-5 sm:p-6 mb-4 relative overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 group`}>
      
      {/* Top Accent Gradient Bar for Featured Posts */}
      {confession.is_featured && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400" />
      )}

      {/* Material iOS Card Header: Category Icon Ring & Author Badge */}
      <div className="flex items-center justify-between gap-3 mb-4">
        
        <div className="flex items-center gap-3">
          {/* Category Avatar Icon Ring */}
          <div className={`w-11 h-11 rounded-2xl ${style.badgeBg} flex items-center justify-center border shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-heading">
                Anonymous Student
              </span>
              {confession.gender !== 'Prefer not to say' && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${style.badgeBg}`}>
                  {confession.gender}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              {formatTimeAgo(confession.created_at)}
            </span>
          </div>
        </div>

        {/* Public Code Pill (#CF7K2P) */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-inner transition-all shrink-0"
          title="Click to copy public confession code"
        >
          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="font-black text-cyan-400">#</span>}
          <span className="font-bold">{confession.public_code}</span>
        </button>
      </div>

      {/* Target Tag Pill */}
      {(confession.target_batch || confession.target_department) && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-950 text-slate-300 px-3 py-1 rounded-full border border-slate-800">
            Target: {confession.target_department || ''} {confession.target_batch ? `'${confession.target_batch.slice(-2)}` : ''}
          </span>
        </div>
      )}

      {/* Confession Body Content */}
      <div className="text-slate-100 text-base leading-relaxed whitespace-pre-wrap mb-4 font-sans font-normal tracking-wide">
        {confession.content}
      </div>

      {/* Optional Interactive Poll Widget */}
      {pollData && (
        <div className="my-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-inner">
          <div className="text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Poll: {pollData.question}
          </div>
          {pollData.options.map((opt) => {
            const pct = pollData.total_votes > 0 ? Math.round((opt.votes / pollData.total_votes) * 100) : 0;
            const isVoted = pollData.user_voted_option_id === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleVotePoll(opt.id)}
                disabled={Boolean(pollData.user_voted_option_id)}
                className={`w-full text-left relative overflow-hidden rounded-xl p-3.5 border transition-all text-xs font-semibold ${
                  isVoted
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-md'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500/30 to-indigo-600/30 transition-all duration-500 pointer-events-none"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex justify-between items-center z-10">
                  <span>{opt.text}</span>
                  <span className="font-mono text-cyan-300 font-black text-xs">{pct}%</span>
                </div>
              </button>
            );
          })}
          <div className="text-[11px] text-slate-500 text-right font-mono">
            {pollData.total_votes} votes recorded
          </div>
        </div>
      )}

      {/* Anonymous Signal Banner (Crush / Appreciation) */}
      {(confession.category_slug === 'crush' || confession.category_slug === 'appreciation') && (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-indigo-500/15 border border-pink-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
            <Eye className="w-4 h-4 text-pink-400 animate-bounce" />
            <span>Is this confession about you? 👀</span>
          </div>
          <button
            onClick={() => onOpenThinkAboutYou && onOpenThinkAboutYou(confession.public_code)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            Send Anonymous Signal
          </button>
        </div>
      )}

      {/* Footer Controls: Reactions, Comments, Bookmarks, Share, Report */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Reaction Bar */}
        <ReactionBar
          confessionId={confession.id}
          initialCounts={confession.reaction_counts}
          initialUserReaction={confession.user_reaction}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 text-slate-400">
          <Link
            href={`/confession/${confession.public_code}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-950 hover:bg-slate-900 text-slate-200 text-xs font-bold border border-slate-800 hover:border-slate-700 transition-all shadow-inner"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>{confession.comment_count}</span>
          </Link>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-full border transition-all ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Save confession"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyCode}
            className="p-2 rounded-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="Share code"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {onOpenReport && (
            <button
              onClick={() => onOpenReport(confession.public_code)}
              className="p-2 rounded-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
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
