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
  Send
} from 'lucide-react';
import { PublicConfession } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { ReactionBar } from './reaction-bar';

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
    setPollData({
      ...pollData,
      total_votes: pollData.total_votes + 1,
      options: updatedOptions,
      user_voted_option_id: optionId,
    });
  };

  return (
    <article className="glass-card p-5 sm:p-6 mb-4 relative overflow-hidden group">
      {/* Featured Accent Border if Confession of the Day */}
      {confession.is_featured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500" />
      )}

      {/* Header: Anonymous Badge & Category */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Author Badge: Anonymous • Gender */}
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Anonymous</span>
            {confession.gender !== 'Prefer not to say' && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-400">{confession.gender}</span>
              </>
            )}
            <span className="text-slate-600">•</span>
            <span className="text-slate-500 font-normal">{formatTimeAgo(confession.created_at)}</span>
          </div>

          {/* Target Metadata if present */}
          {(confession.target_batch || confession.target_department) && (
            <span className="bg-slate-900/90 text-slate-400 text-[11px] px-2 py-0.5 rounded-md border border-slate-800">
              Target: {confession.target_department || ''} {confession.target_batch ? `'${confession.target_batch.slice(-2)}` : ''}
            </span>
          )}
        </div>

        {/* Public Code Badge (#CF7K2P) */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-indigo-300 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-all"
          title="Click to copy public confession code"
        >
          {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <span className="font-bold">#</span>}
          <span>{confession.public_code}</span>
        </button>
      </div>

      {/* Category Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <IconComponent className="w-3.5 h-3.5" />
          {confession.category_name}
        </span>
      </div>

      {/* Content */}
      <div className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap mb-4 font-normal">
        {confession.content}
      </div>

      {/* Optional Poll Widget */}
      {pollData && (
        <div className="my-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
            📊 Poll: {pollData.question}
          </div>
          {pollData.options.map((opt) => {
            const pct = pollData.total_votes > 0 ? Math.round((opt.votes / pollData.total_votes) * 100) : 0;
            const isVoted = pollData.user_voted_option_id === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleVotePoll(opt.id)}
                disabled={Boolean(pollData.user_voted_option_id)}
                className={`w-full text-left relative overflow-hidden rounded-xl p-3 border transition-all text-xs font-medium ${
                  isVoted
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                {/* Background Progress Fill */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 transition-all duration-500 pointer-events-none"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex justify-between items-center z-10">
                  <span>{opt.text}</span>
                  <span className="font-mono text-slate-400 font-bold">{pct}%</span>
                </div>
              </button>
            );
          })}
          <div className="text-[11px] text-slate-500 text-right font-mono">
            {pollData.total_votes} total votes
          </div>
        </div>
      )}

      {/* "Think this is about you? 👀" Banner for Crush & Appreciation */}
      {(confession.category_slug === 'crush' || confession.category_slug === 'appreciation') && (
        <div className="my-4 p-3.5 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-pink-300">
            <Eye className="w-4 h-4 text-pink-400" />
            <span>Think this is about you? 👀</span>
          </div>
          <button
            onClick={() => onOpenThinkAboutYou && onOpenThinkAboutYou(confession.public_code)}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send Anonymous Signal
          </button>
        </div>
      )}

      {/* Footer Controls: Reactions, Comments, Bookmarks, Share, Report */}
      <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3">
        {/* Reaction Bar */}
        <ReactionBar
          confessionId={confession.id}
          initialCounts={confession.reaction_counts}
          initialUserReaction={confession.user_reaction}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 text-slate-400">
          <Link
            href={`/confession/${confession.public_code}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800 hover:border-slate-700 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>{confession.comment_count}</span>
          </Link>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-full border transition-all ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Save confession"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyCode}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="Share code"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {onOpenReport && (
            <button
              onClick={() => onOpenReport(confession.public_code)}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
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
