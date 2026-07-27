'use client';

import React from 'react';
import { Lock, Bookmark, Bell, MessageSquare, Search, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  type: 'feed' | 'saved' | 'notifications' | 'inbox' | 'search' | '404';
  title?: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

const CONFIGS = {
  feed: {
    icon: Lock,
    title: 'Quiet campus today... suspiciously quiet 👀',
    subtitle: 'Be the first to say what everyone else is thinking.',
  },
  saved: {
    icon: Bookmark,
    title: 'Nothing saved yet.',
    subtitle: 'Future-you has nothing to read.',
  },
  notifications: {
    icon: Bell,
    title: 'All quiet.',
    subtitle: 'Enjoy the peace while it lasts.',
  },
  inbox: {
    icon: MessageSquare,
    title: "Nobody's knocking yet 👀",
    subtitle: 'Anonymous signals from "Think this is about you?" will land here.',
  },
  search: {
    icon: Search,
    title: 'Nothing escaped the rumor mill with that search.',
    subtitle: 'Try searching by public code (e.g. #CF7K2P), category, or different keywords.',
  },
  '404': {
    icon: FileQuestion,
    title: 'This confession disappeared into the void.',
    subtitle: 'It may have been removed or never existed.',
  },
};

export function EmptyState({ type, title, subtitle, actionText, onAction }: EmptyStateProps) {
  const config = CONFIGS[type] || CONFIGS.feed;
  const Icon = config.icon;

  return (
    <div className="glass-card p-10 text-center flex flex-col items-center justify-center my-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-white">{title || config.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{subtitle || config.subtitle}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
