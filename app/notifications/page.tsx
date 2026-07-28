'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { EmptyState } from '@/components/empty-state';
import { Bell, MessageSquare, Heart, Eye, CheckCheck, Loader2 } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  confession_id: string | null;
  comment_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

function getNotifText(notif: Notification): string {
  const meta = notif.metadata || {};
  if (meta.text) return meta.text;

  switch (notif.type) {
    case 'comment':
      return 'Someone commented on your confession 👀';
    case 'reaction':
      return `Someone reacted ${meta.reaction_type === 'funny' ? '😂' : '❤️'} to your confession.`;
    case 'milestone':
      return `Your confession just reached ${meta.count || 'a'} reactions 🔥`;
    case 'think_about_you':
      return 'Someone thinks your confession might be about them 👀';
    default:
      return 'You have a new notification.';
  }
}

function getConfessionCode(notif: Notification): string {
  return notif.metadata?.confession_code || notif.metadata?.public_code || '';
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifs(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notification inserts
    const supabase = createClient();
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifs((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAllRead = async () => {
    setNotifs(notifs.map((n) => ({ ...n, is_read: true })));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const markRead = async (id: string) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n)));

    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-950 font-heading flex items-center">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-[#FF6B00] text-white px-2 py-0.5 rounded-full font-mono">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-600 font-sans">Strictly anonymous alerts about your activity.</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline font-mono"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
            </div>
          ) : notifs.length > 0 ? (
            notifs.map((notif) => {
              const code = getConfessionCode(notif);
              const href = code ? `/confession/${code}` : '#';
              return (
                <Link
                  key={notif.id}
                  href={href}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                    !notif.is_read
                      ? 'bg-white border-[#FF6B00]/40 shadow-md'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00]">
                      {notif.type === 'comment' && <MessageSquare className="w-4 h-4" />}
                      {notif.type === 'think_about_you' && <Eye className="w-4 h-4 text-pink-500" />}
                      {notif.type === 'reaction' && <Heart className="w-4 h-4 text-rose-500" />}
                      {notif.type === 'milestone' && <Bell className="w-4 h-4 text-amber-500" />}
                      {!['comment', 'think_about_you', 'reaction', 'milestone'].includes(notif.type) && (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 font-sans">{getNotifText(notif)}</p>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {code ? `Confession #${code} • ` : ''}{formatTimeAgo(notif.created_at)}
                      </span>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] shrink-0 mt-2" />
                  )}
                </Link>
              );
            })
          ) : (
            <EmptyState type="notifications" />
          )}
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
