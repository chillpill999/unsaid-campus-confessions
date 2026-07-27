'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { EmptyState } from '@/components/empty-state';
import { Bell, MessageSquare, Heart, Eye, CheckCheck } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'comment' | 'reaction' | 'milestone' | 'think_about_you';
  text: string;
  confession_code: string;
  created_at: string;
  is_read: boolean;
}

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 'n1',
    type: 'comment',
    text: 'Someone commented on your confession 👀',
    confession_code: 'CF7K2P',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    is_read: false,
  },
  {
    id: 'n2',
    type: 'think_about_you',
    text: 'Someone thinks your confession might be about them 👀',
    confession_code: 'CF7K2P',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    is_read: false,
  },
  {
    id: 'n3',
    type: 'milestone',
    text: 'Your confession just reached 100 reactions 🔥',
    confession_code: 'CF9K4M',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    is_read: true,
  },
  {
    id: 'n4',
    type: 'reaction',
    text: 'Someone reacted ❤️ to your confession.',
    confession_code: 'CF9K4M',
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    is_read: true,
  },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);

  const markAllRead = () => {
    setNotifs(notifs.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-heading">Notifications</h1>
              <p className="text-xs text-slate-400">Strictly anonymous alerts about your activity.</p>
            </div>
          </div>

          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>

        <div className="space-y-3">
          {notifs.length > 0 ? (
            notifs.map((notif) => (
              <Link
                key={notif.id}
                href={`/confession/${notif.confession_code}`}
                className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                  !notif.is_read
                    ? 'bg-slate-900 border-indigo-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    {notif.type === 'comment' && <MessageSquare className="w-4 h-4" />}
                    {notif.type === 'think_about_you' && <Eye className="w-4 h-4 text-pink-400" />}
                    {notif.type === 'reaction' && <Heart className="w-4 h-4 text-rose-400" />}
                    {notif.type === 'milestone' && <Bell className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{notif.text}</p>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Confession #{notif.confession_code} • {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>

                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                )}
              </Link>
            ))
          ) : (
            <EmptyState type="notifications" />
          )}
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
