'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { EmptyState } from '@/components/empty-state';
import { 
  Bell, 
  MessageSquare, 
  Heart, 
  Eye, 
  CheckCheck, 
  Loader2, 
  UserPlus, 
  Flame, 
  Radio, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight,
  Send,
  MessageCircle
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { 
  fetchFriendRequestsAction, 
  acceptFriendRequestAction, 
  rejectFriendRequestAction 
} from '@/lib/actions/friends';
import { fetchPublicConfessions } from '@/lib/actions/feed';
import { PublicConfession } from '@/lib/types';
import { getSavedUsername } from '@/lib/friends-chat';

interface Notification {
  id: string;
  type: string;
  confession_id: string | null;
  comment_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

interface FriendRequestItem {
  id: string;
  sender_username: string;
  sender_name?: string;
  receiver_username: string;
  receiver_name?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

type FilterCategory = 'all' | 'requests' | 'reactions' | 'comments' | 'campus';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([]);
  const [recentConfessions, setRecentConfessions] = useState<PublicConfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [myUsername, setMyUsername] = useState<string>('student_lnj');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Load username & data
  const loadData = useCallback(async () => {
    try {
      const savedUser = getSavedUsername();
      setMyUsername(savedUser);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Fetch personal notifications from DB
      if (user) {
        const { data: notifData } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(40);

        if (notifData) {
          setNotifs(notifData);
        }
      }

      // 2. Fetch live friend requests
      const reqs = await fetchFriendRequestsAction(savedUser);
      if (reqs) {
        setFriendRequests(reqs as FriendRequestItem[]);
      }

      // 3. Fetch latest campus confessions for Instagram-style feed activity
      const confessions = await fetchPublicConfessions(8);
      if (confessions) {
        setRecentConfessions(confessions);
      }
    } catch (err) {
      console.error('Failed to load notification activity:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const supabase = createClient();

    // 1. Listen for user notifications
    const notifChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const newNotif = payload.new as Notification;
          setNotifs((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    // 2. Listen for friend requests broadcast
    const friendChannel = supabase
      .channel('campus:friend_requests')
      .on('broadcast', { event: 'friend_request_sent' }, (payload) => {
        const req = payload.payload;
        if (req && req.receiver_username.toLowerCase() === myUsername.toLowerCase()) {
          setFriendRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
        }
      })
      .on('broadcast', { event: 'friend_request_accepted' }, (payload) => {
        const req = payload.payload;
        if (req) {
          setFriendRequests((prev) =>
            prev.map((r) => (r.id === req.id ? { ...r, status: 'accepted' } : r))
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(friendChannel);
    };
  }, [loadData, myUsername]);

  // Handle Accept Friend Request
  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const res = await acceptFriendRequestAction(requestId, myUsername);
      if (res && res.success) {
        setFriendRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'accepted' } : r))
        );
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle Decline Friend Request
  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await rejectFriendRequestAction(requestId);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error('Error declining friend request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Mark all notifications as read
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
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  // Pending friend requests targeted to me
  const pendingRequests = useMemo(() => {
    return friendRequests.filter(
      (r) => r.receiver_username.toLowerCase() === myUsername.toLowerCase() && r.status === 'pending'
    );
  }, [friendRequests, myUsername]);

  const unreadCount = notifs.filter((n) => !n.is_read).length + pendingRequests.length;

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-12 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-3 sm:px-6 pt-6 flex-1 w-full space-y-6">
        
        {/* Header with Instagram style counters */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md shadow-[#FF6B00]/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-heading flex items-center gap-2">
                Activity
                {unreadCount > 0 && (
                  <span className="text-xs bg-[#FF6B00] text-white px-2 py-0.5 rounded-full font-mono font-bold shadow-sm">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-600 font-sans">
                Friend requests, confession reactions, comments & campus pulses.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] hover:text-[#E05E00] font-mono px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Instagram Style Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'All Activity', icon: Sparkles },
            { id: 'requests', label: `Requests (${pendingRequests.length})`, icon: UserPlus },
            { id: 'reactions', label: 'Reactions', icon: Heart },
            { id: 'comments', label: 'Comments', icon: MessageSquare },
            { id: 'campus', label: 'Campus Posts', icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as FilterCategory)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 font-heading ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-950'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF6B00]' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 1. Instagram-Style "Follow / Friend Requests" Banner */}
        {(activeFilter === 'all' || activeFilter === 'requests') && pendingRequests.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#FF6B00]/30 p-4 sm:p-5 shadow-lg shadow-[#FF6B00]/5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono">
                  Friend & Signal Requests ({pendingRequests.length})
                </h2>
              </div>
              <span className="text-[11px] text-[#FF6B00] font-mono font-bold">Action required</span>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingRequests.map((req) => (
                <div key={req.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                      {req.sender_username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-950 font-heading truncate">
                        {req.sender_name || `@${req.sender_username}`}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        wants to connect on campus • {formatTimeAgo(req.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={processingRequestId === req.id}
                      onClick={() => handleAcceptRequest(req.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs font-heading shadow-md shadow-[#FF6B00]/20 flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      {processingRequestId === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                      Confirm
                    </button>
                    <button
                      disabled={processingRequestId === req.id}
                      onClick={() => handleDeclineRequest(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs font-heading transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Main Activity Timeline */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
              <p className="text-xs text-slate-500 font-mono">Syncing campus activity feed...</p>
            </div>
          ) : (
            <>
              {/* Accepted Connection Alerts */}
              {(activeFilter === 'all' || activeFilter === 'requests') &&
                friendRequests
                  .filter((r) => r.status === 'accepted')
                  .slice(0, 4)
                  .map((req) => {
                    const peer =
                      req.sender_username.toLowerCase() === myUsername.toLowerCase()
                        ? req.receiver_username
                        : req.sender_username;
                    return (
                      <div
                        key={`accepted-${req.id}`}
                        className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-900 font-medium">
                              You and <span className="font-bold text-slate-950 font-heading">@{peer}</span> are now connected.
                            </p>
                            <span className="text-[11px] text-slate-500 font-mono">
                              24h Direct Messages unlocked • {formatTimeAgo(req.created_at)}
                            </span>
                          </div>
                        </div>

                        <Link
                          href="/inbox"
                          className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs font-heading shrink-0 flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Message
                        </Link>
                      </div>
                    );
                  })}

              {/* Personal Notification Alerts (Reactions, Comments, Milestones) */}
              {(activeFilter === 'all' || activeFilter === 'reactions' || activeFilter === 'comments') &&
                notifs.map((notif) => {
                  const code = notif.metadata?.confession_code || notif.metadata?.public_code || '';
                  const href = code ? `/confession/${code}` : '#';
                  return (
                    <Link
                      key={notif.id}
                      href={href}
                      onClick={() => !notif.is_read && markRead(notif.id)}
                      className={`flex items-start justify-between p-4 rounded-2xl border transition-all ${
                        !notif.is_read
                          ? 'bg-white border-[#FF6B00]/40 shadow-md'
                          : 'bg-white/90 border-slate-200/80 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 w-9 h-9 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
                          {notif.type === 'comment' && <MessageSquare className="w-4 h-4" />}
                          {notif.type === 'think_about_you' && <Eye className="w-4 h-4 text-pink-500" />}
                          {notif.type === 'reaction' && <Heart className="w-4 h-4 text-rose-500" />}
                          {notif.type === 'milestone' && <Flame className="w-4 h-4 text-amber-500" />}
                          {!['comment', 'think_about_you', 'reaction', 'milestone'].includes(notif.type) && (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 font-sans truncate">
                            {notif.metadata?.text || (notif.type === 'comment' ? 'Someone commented on your confession 👀' : 'New reaction on your confession')}
                          </p>
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
                })}

              {/* Instagram Style "Campus Buzz / Latest Posts" Section */}
              {(activeFilter === 'all' || activeFilter === 'campus') && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Fresh Campus Confessions
                    </h3>
                    <Link href="/feed" className="text-xs font-bold text-[#FF6B00] hover:underline font-mono flex items-center gap-0.5">
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {recentConfessions.slice(0, 5).map((conf) => (
                    <Link
                      key={`conf-${conf.id}`}
                      href={`/confession/${conf.public_code}`}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm flex items-start justify-between gap-3 group transition-all"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:bg-[#FF6B00] group-hover:text-white transition-colors">
                          #{conf.public_code.slice(0, 3)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs text-slate-800 font-sans line-clamp-2 leading-relaxed">
                            {conf.content}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span className="text-[#FF6B00] font-bold">#{conf.category_name}</span>
                            <span>•</span>
                            <span>{conf.comment_count || 0} comments</span>
                            <span>•</span>
                            <span>{formatTimeAgo(conf.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:text-[#FF6B00] group-hover:bg-[#FF6B00]/10 transition-colors shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Empty state when no activity in selected filter */}
              {activeFilter === 'requests' && pendingRequests.length === 0 && (
                <EmptyState type="notifications" />
              )}
            </>
          )}
        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
