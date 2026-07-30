'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { EmptyState } from '@/components/empty-state';
import {
  MessageSquare,
  Send,
  Lock,
  ArrowLeft,
  UserPlus,
  Users,
  Clock,
  Check,
  X,
  Search,
  Sparkles,
  ShieldCheck,
  AtSign,
  Edit2,
  CheckCircle2,
  Flame,
  Zap,
  Radio,
  ShieldAlert,
  SmilePlus,
  Loader2
} from 'lucide-react';
import { MOCK_INBOX_CONVERSATIONS, MOCK_CONVERSATION_MESSAGES } from '@/lib/mock-data';
import { AnonymousMessage, DirectMessage, FriendContact, FriendRequest } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import {
  getSavedUsername,
  saveUsername,
  isUsernameLocked,
  initializeChatData,
  getFriendsList,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getDirectMessagesForConv,
  sendDirectMessage,
  getConversationKey,
  getRemainingTimeFormatted,
  purgeExpiredMessages
} from '@/lib/friends-chat';
import {
  syncUserHandle,
  sendFriendRequestAction,
  fetchFriendRequestsAction,
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  fetchFriendsListAction,
  sendDirectMessageAction,
  fetchDirectMessagesAction
} from '@/lib/actions/friends';
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = (rawUrl && rawUrl.startsWith('http')) ? rawUrl : 'https://prkecywvrficjylboior.supabase.co';

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_ANON_KEY = (rawKey && !rawKey.includes('[SENSITIVE]')) ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

const QUICK_REACTION_EMOJIS = ['🔥', '💀', '🤫', '⚡', '💖', '👀', '💯'];

export default function InboxPage() {
  // Inbox Mode: 'direct' (24h Disappearing Cyber DMs) or 'confession' (Anonymous Signals)
  const [inboxMode, setInboxMode] = useState<'direct' | 'confession'>('direct');

  // Direct DM Sub-tabs: 'chats' | 'requests' | 'search'
  const [dmSubTab, setDmSubTab] = useState<'chats' | 'requests' | 'search'>('chats');

  // User handle state
  const [myUsername, setMyUsername] = useState<string>('student_lnj');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameNotice, setUsernameNotice] = useState<string | null>(null);
  const [usernameLocked, setUsernameLocked] = useState(false);

  // Friend contacts & requests
  const [friends, setFriends] = useState<FriendContact[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activeFriend, setActiveFriend] = useState<FriendContact | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [directInputMsg, setDirectInputMsg] = useState('');

  // Add Friend Search Query
  const [searchHandle, setSearchHandle] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [searchNotice, setSearchNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Anonymous Confession Chat state
  const [activeConfessionConvId, setActiveConfessionConvId] = useState<string | null>('conv-1');
  const [confessionMessages, setConfessionMessages] = useState<Record<string, AnonymousMessage[]>>(MOCK_CONVERSATION_MESSAGES);
  const [confessionInputMsg, setConfessionInputMsg] = useState('');

  // 1. Initialize Clean Production State & Fetch Live Server Friends/Requests on load
  useEffect(() => {
    const handle = getSavedUsername();
    setMyUsername(handle);
    setUsernameInput(handle);
    setUsernameLocked(isUsernameLocked());
    initializeChatData(handle);

    // Initial hydration from local cache for instant UI rendering
    const localFriends = getFriendsList();
    setFriends(localFriends);
    setRequests(getFriendRequests());
    if (localFriends.length > 0) {
      setActiveFriend(localFriends[0]);
    }

    // Sync handle with server profile
    syncUserHandle(handle);

    // Fetch live requests and friend contacts from server
    const loadLiveServerData = async () => {
      try {
        const liveRequests = await fetchFriendRequestsAction(handle);
        const liveFriends = await fetchFriendsListAction(handle);

        if (liveRequests && liveRequests.length > 0) {
          setRequests(liveRequests);
        }
        if (liveFriends && liveFriends.length > 0) {
          setFriends(liveFriends);
          if (!activeFriend) {
            setActiveFriend(liveFriends[0]);
          }
        }
      } catch (err) {
        console.warn('Error loading live friends data:', err);
      }
    };

    loadLiveServerData();
  }, []);

  // 2. Subscribe to Supabase Realtime Friend Requests Channel
  useEffect(() => {
    if (!myUsername) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const channel = supabase.channel('campus:friend_requests');

    channel.on('broadcast', { event: 'friend_request_sent' }, (payload) => {
      const req = payload.payload;
      if (req && (req.receiver_username.toLowerCase() === myUsername.toLowerCase() || req.sender_username.toLowerCase() === myUsername.toLowerCase())) {
        setRequests((prev) => {
          if (prev.some((r) => r.id === req.id)) return prev;
          return [req, ...prev];
        });
      }
    });

    channel.on('broadcast', { event: 'friend_request_accepted' }, (payload) => {
      const req = payload.payload;
      if (req && (req.receiver_username.toLowerCase() === myUsername.toLowerCase() || req.sender_username.toLowerCase() === myUsername.toLowerCase())) {
        fetchFriendsListAction(myUsername).then((updatedFriends) => {
          if (updatedFriends && updatedFriends.length > 0) {
            setFriends(updatedFriends);
          }
        });
        fetchFriendRequestsAction(myUsername).then((updatedReqs) => {
          if (updatedReqs) setRequests(updatedReqs);
        });
      }
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myUsername]);

  // 3. Refresh & Subscribe to Active Conversation Direct Messages via Supabase Realtime
  useEffect(() => {
    if (!activeFriend || inboxMode !== 'direct') return;

    const convKey = getConversationKey(myUsername, activeFriend.username);
    
    // Initial fetch from local + server
    const msgs = getDirectMessagesForConv(convKey, myUsername);
    setDmMessages(msgs);

    fetchDirectMessagesAction(convKey, myUsername).then((serverMsgs) => {
      if (serverMsgs && serverMsgs.length > 0) {
        const mapped = serverMsgs.map((m) => ({
          ...m,
          is_mine: m.sender_username.toLowerCase() === myUsername.toLowerCase(),
        }));
        setDmMessages(mapped);
      }
    });

    // Realtime channel subscription for live DMs
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const dmChannel = supabase.channel(`campus:dm:${convKey}`);

    dmChannel.on('broadcast', { event: 'direct_message_sent' }, (payload) => {
      const msg = payload.payload;
      if (msg && msg.conversation_key === convKey) {
        const formattedMsg: DirectMessage = {
          ...msg,
          is_mine: msg.sender_username.toLowerCase() === myUsername.toLowerCase(),
        };
        setDmMessages((prev) => {
          if (prev.some((m) => m.id === formattedMsg.id)) return prev;
          return [...prev, formattedMsg];
        });
      }
    });

    dmChannel.subscribe();

    // Note: Removed destructive 5-second interval that was clobbering DM state
    // with stale localStorage data, causing messages to vanish instantly after sending.
    // Realtime subscription above handles live message delivery correctly.

    return () => {
      supabase.removeChannel(dmChannel);
    };
  }, [activeFriend, myUsername, inboxMode]);

  // Save username handler
  const handleSaveUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || usernameLocked) return;
    const clean = saveUsername(usernameInput);
    setMyUsername(clean);
    setUsernameLocked(true);
    setIsEditingUsername(false);

    // Sync with server profile
    await syncUserHandle(clean);

    setUsernameNotice(`Handle permanently set as @${clean}`);
    setTimeout(() => setUsernameNotice(null), 3000);
  };

  // Send Direct Message (24h volatile)
  const handleSendDirectMessageSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || directInputMsg;
    if (!textToSend.trim() || !activeFriend) return;

    // Send local + server broadcast
    const newMsg = sendDirectMessage(myUsername, activeFriend.username, textToSend.trim());
    setDmMessages((prev) => [...prev, newMsg]);
    if (!customText) setDirectInputMsg('');

    // Trigger server action for multi-device sync
    await sendDirectMessageAction(myUsername, activeFriend.username, textToSend.trim());
  };

  // Send Friend Request
  const handleSendRequestSubmit = async (targetHandle: string) => {
    setSearchNotice(null);
    setIsSendingRequest(true);

    try {
      // 1. Save local request
      const localRes = sendFriendRequest(myUsername, 'LNJPIT Student', targetHandle);
      
      // 2. Trigger global server action with Realtime Broadcast
      const serverRes = await sendFriendRequestAction(myUsername, 'LNJPIT Student', targetHandle);

      if (serverRes.success || localRes.success) {
        const successMsg = serverRes.message || localRes.message;
        setSearchNotice({ type: 'success', text: successMsg });
        
        // Refresh requests state
        if (serverRes.request) {
          setRequests((prev) => [serverRes.request!, ...prev]);
        } else {
          setRequests(getFriendRequests());
        }
        setSearchHandle('');
      } else {
        setSearchNotice({ type: 'error', text: serverRes.message || localRes.message });
      }
    } catch (err: any) {
      setSearchNotice({ type: 'error', text: err.message || 'Error sending request.' });
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async (reqId: string) => {
    const newFriend = acceptFriendRequest(reqId);
    const serverRes = await acceptFriendRequestAction(reqId, myUsername);

    const updatedRequests = getFriendRequests();
    setRequests(updatedRequests);

    const updatedFriends = getFriendsList();
    setFriends(updatedFriends);

    const activeContact = serverRes.friend || newFriend;
    if (activeContact) {
      setActiveFriend(activeContact);
      setDmSubTab('chats');
    }
  };

  // Reject Friend Request
  const handleRejectRequest = async (reqId: string) => {
    rejectFriendRequest(reqId);
    await rejectFriendRequestAction(reqId);
    setRequests(getFriendRequests());
  };

  // Anonymous Confession Chat Send Handler
  const handleSendConfessionMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confessionInputMsg.trim() || !activeConfessionConvId) return;

    const activeConv = MOCK_INBOX_CONVERSATIONS.find((c) => c.id === activeConfessionConvId);
    const newMsg: AnonymousMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConfessionConvId,
      sender_label: activeConv?.my_label || 'Anonymous',
      content: confessionInputMsg.trim(),
      created_at: new Date().toISOString(),
      is_mine: true,
    };

    setConfessionMessages((prev) => ({
      ...prev,
      [activeConfessionConvId]: [...(prev[activeConfessionConvId] || []), newMsg],
    }));
    setConfessionInputMsg('');
  };

  const pendingIncomingRequests = requests.filter(
    (r) => r.receiver_username.toLowerCase() === myUsername.toLowerCase() && r.status === 'pending'
  );

  const pendingOutgoingRequests = requests.filter(
    (r) => r.sender_username.toLowerCase() === myUsername.toLowerCase() && r.status === 'pending'
  );

  const activeConfessionConv = MOCK_INBOX_CONVERSATIONS.find((c) => c.id === activeConfessionConvId);

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-4 pb-24 space-y-4">
        
        {/* Top Header Card */}
        <div className="rounded-[28px] bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            
            {/* Title & Pulse Indicator */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[10px] font-mono text-[#FF6B00] font-bold uppercase tracking-widest">
                  <Radio className="w-3 h-3 text-[#FF6B00] animate-pulse" /> Live Messenger Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-heading tracking-tight flex items-center gap-2.5">
                Campus Cyber-Messenger
              </h1>
              <p className="text-xs text-slate-600 max-w-lg font-sans">
                Encrypted 24-hour volatile student messaging & anonymous confession channels.
              </p>
            </div>

            {/* Handle Bar & Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              {/* User Handle Badge */}
              <div className="flex items-center justify-between gap-3 bg-[#F4F3EF] px-3.5 py-2 rounded-2xl border border-slate-200 shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#FF6B00] flex items-center justify-center font-bold text-white text-xs shadow-md">
                    @
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-mono text-slate-500 tracking-wider">Your Handle</span>
                    <span className="text-xs font-bold font-mono text-[#FF6B00]">@{myUsername}</span>
                  </div>
                </div>
                {!usernameLocked && (
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="p-1.5 rounded-lg bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 text-[#FF6B00] transition-colors border border-[#FF6B00]/20"
                    title="Claim Handle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {usernameLocked && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="relative z-10 flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setInboxMode('direct')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide transition-all duration-300 ${
                inboxMode === 'direct'
                  ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20 scale-[1.02]'
                  : 'bg-[#F4F3EF] text-slate-600 hover:text-slate-950 border border-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Direct DMs (24h Ephemeral ⏱️)</span>
            </button>

            <button
              onClick={() => setInboxMode('confession')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide transition-all duration-300 ${
                inboxMode === 'confession'
                  ? 'bg-[#121212] text-white shadow-lg shadow-black/20 scale-[1.02]'
                  : 'bg-[#F4F3EF] text-slate-600 hover:text-slate-950 border border-slate-200'
              }`}
            >
              <Lock className="w-4 h-4 text-white" />
              <span>Anonymous Signals</span>
            </button>
          </div>

          {/* Toast Notification */}
          {usernameNotice && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {usernameNotice}
            </div>
          )}
        </div>

        {/* ----------------- MODE 1: CYBER DIRECT CHAT (24h Volatile) ----------------- */}
        {inboxMode === 'direct' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1" style={{ minHeight: '520px' }}>
            
            {/* Left Sidebar: Contact list & Friends management */}
            <aside className={`md:col-span-4 rounded-[28px] bg-white border border-slate-200/80 p-4 space-y-4 flex flex-col shadow-xl ${activeFriend && dmSubTab === 'chats' ? 'hidden md:flex' : 'flex'}`}>
              
              {/* Sub-tabs header */}
              <div className="grid grid-cols-3 gap-1 bg-[#F4F3EF] p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setDmSubTab('chats')}
                  className={`py-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 ${
                    dmSubTab === 'chats' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Chats ({friends.length})
                </button>
                <button
                  onClick={() => setDmSubTab('requests')}
                  className={`py-2 rounded-xl transition-all text-center relative flex items-center justify-center gap-1 ${
                    dmSubTab === 'requests' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Requests
                  {pendingIncomingRequests.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  )}
                </button>
                <button
                  onClick={() => setDmSubTab('search')}
                  className={`py-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 ${
                    dmSubTab === 'search' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  + Add
                </button>
              </div>

              {/* Sub-tab 1: Friend Chats List */}
              {dmSubTab === 'chats' && (
                <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  {friends.length > 0 ? (
                    friends.map((friend) => {
                      const isActive = activeFriend?.username === friend.username;
                      return (
                        <button
                          key={friend.username}
                          onClick={() => setActiveFriend(friend)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 relative overflow-hidden group ${
                            isActive
                              ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-slate-950 shadow-sm'
                              : 'bg-[#F4F3EF] border-slate-200 hover:border-[#FF6B00]/40 text-slate-800'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B00]" />
                          )}
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] flex items-center justify-center font-black text-white text-xs shadow-md group-hover:scale-105 transition-transform">
                              {friend.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" title="Active Signal" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="truncate text-[#FF6B00] font-mono">@{friend.username}</span>
                              <span className="text-[10px] text-pink-600 font-mono flex items-center gap-0.5 bg-pink-500/10 px-1.5 py-0.5 rounded-md border border-pink-500/20">
                                <Clock className="w-2.5 h-2.5 inline" /> 24h
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5">{friend.full_name}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center space-y-3 px-2">
                      <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center mx-auto">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">No active student signals</p>
                        <p className="text-[11px] text-slate-500 mt-1">Connect using student handles to begin ephemeral 24h chats.</p>
                      </div>
                      <button
                        onClick={() => setDmSubTab('search')}
                        className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs transition-all shadow-md"
                      >
                        + Connect Student Handle
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Pending Friend Requests */}
              {dmSubTab === 'requests' && (
                <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Incoming Signals</h3>
                  {pendingIncomingRequests.length > 0 ? (
                    pendingIncomingRequests.map((req) => (
                      <div key={req.id} className="p-3.5 rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-xs font-bold text-[#FF6B00] font-mono">@{req.sender_username}</span>
                            <span className="text-[11px] text-slate-600">{req.sender_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{formatTimeAgo(req.created_at)}</span>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 py-1.5 rounded-xl bg-[#FF6B00] text-white text-xs font-bold flex items-center justify-center gap-1 shadow"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2 font-mono">No incoming requests pending.</p>
                  )}

                  {pendingOutgoingRequests.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Sent Requests</h4>
                      {pendingOutgoingRequests.map((r) => (
                        <div key={r.id} className="p-3 rounded-xl bg-[#F4F3EF] border border-slate-200 text-xs flex justify-between items-center">
                          <span className="text-[#FF6B00] font-bold font-mono">@{r.receiver_username}</span>
                          <span className="text-[10px] text-amber-600 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Awaiting Answer</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Add Friend / Search Handles */}
              {dmSubTab === 'search' && (
                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700">Connect Student Handle</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <AtSign className="w-4 h-4 text-[#FF6B00] absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchHandle}
                          onChange={(e) => setSearchHandle(e.target.value)}
                          placeholder="student_handle"
                          className="w-full bg-[#F4F3EF] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] font-mono"
                        />
                      </div>
                      <button
                        onClick={() => handleSendRequestSubmit(searchHandle)}
                        disabled={!searchHandle.trim() || isSendingRequest}
                        className="px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1 shadow-md"
                      >
                        {isSendingRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Request'}
                      </button>
                    </div>

                    {searchNotice && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium ${
                        searchNotice.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700'
                          : 'bg-rose-500/10 border border-rose-500/30 text-rose-700'
                      }`}>
                        {searchNotice.text}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
                      24h Volatile Cyber Protocol
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Share your handle (<span className="font-mono text-[#FF6B00] font-bold">@{myUsername}</span>) with friends. Direct messages self-destruct exactly 24 hours after being sent.
                    </p>
                  </div>
                </div>
              )}

            </aside>

            {/* Right Main Cyber Chat Window */}
            <section className={`md:col-span-8 rounded-[28px] bg-white border border-slate-200/80 p-4 flex flex-col justify-between shadow-xl relative overflow-hidden ${!activeFriend ? 'hidden md:flex' : 'flex'}`}>
              {activeFriend ? (
                <>
                  {/* Cyber Chat Header */}
                  <div className="border-b border-slate-100 pb-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveFriend(null)}
                          className="md:hidden p-1.5 rounded-xl bg-[#F4F3EF] text-slate-600 hover:text-slate-900"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="relative">
                          <div className="w-11 h-11 rounded-2xl bg-[#FF6B00] flex items-center justify-center font-black text-white text-sm shadow-md">
                            {activeFriend.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" title="Active Signal" />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                            <span className="font-mono text-[#FF6B00]">@{activeFriend.username}</span>
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 px-2 py-0.5 rounded-full">Connected</span>
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            {activeFriend.full_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ephemeral Warning Banner */}
                    <div className="bg-pink-500/10 border border-pink-500/20 px-3.5 py-2 rounded-2xl flex items-center justify-between text-[11px] font-semibold text-pink-700">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-pink-600 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>24h Auto-Purge Active</span>
                      </span>
                      <span className="text-[10px] text-pink-700 font-mono bg-white px-2 py-0.5 rounded-lg border border-pink-200">
                        Self-destruct timer ⏱️
                      </span>
                    </div>
                  </div>

                  {/* Cyber Message Bubbles Thread */}
                  <div className="py-4 space-y-3.5 overflow-y-auto flex-1 px-1 custom-scrollbar" style={{ maxHeight: '420px' }}>
                    {dmMessages.length > 0 ? (
                      dmMessages.map((msg) => {
                        const remainingText = getRemainingTimeFormatted(msg.expires_at);
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'} group`}
                          >
                            <div
                              className={`max-w-[80%] p-4 rounded-3xl text-xs leading-relaxed shadow-md relative transition-transform duration-200 group-hover:scale-[1.01] ${
                                msg.is_mine
                                  ? 'bg-[#FF6B00] text-white rounded-br-xs'
                                  : 'bg-[#F4F3EF] border border-slate-200 text-slate-900 rounded-bl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1 px-1">
                              <span>{formatTimeAgo(msg.created_at)}</span>
                              <span>•</span>
                              <span className="text-pink-600 font-bold flex items-center gap-1 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-200">
                                <Clock className="w-2.5 h-2.5" /> Purges in {remainingText}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-16 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center mx-auto animate-pulse">
                          <Zap className="w-7 h-7" />
                        </div>
                        <p className="text-xs font-bold text-slate-900 font-heading">Start the signal</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Messages sent here will automatically disappear 24 hours after dispatch.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Reaction Pill Bar */}
                  <div className="flex items-center gap-1.5 pt-2 pb-1 overflow-x-auto">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                      <SmilePlus className="w-3 h-3 text-[#FF6B00]" /> Quick:
                    </span>
                    {QUICK_REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSendDirectMessageSubmit(undefined, emoji)}
                        className="px-2.5 py-1 rounded-xl bg-[#F4F3EF] hover:bg-slate-200 border border-slate-200 text-xs transition-transform active:scale-95 shrink-0"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Direct Message Input Bar */}
                  <form onSubmit={(e) => handleSendDirectMessageSubmit(e)} className="flex gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder={`Send ephemeral signal to @${activeFriend.username}...`}
                      value={directInputMsg}
                      onChange={(e) => setDirectInputMsg(e.target.value)}
                      className="flex-1 bg-[#F4F3EF] border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] placeholder-slate-500 font-sans shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!directInputMsg.trim()}
                      className="px-5 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-[#FF6B00]/20 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="py-24 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center mx-auto">
                    <Radio className="w-8 h-8 text-[#FF6B00] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950 font-heading">Select a classmate's signal to chat</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Messages in direct chats auto-delete after 24 hours.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ----------------- MODE 2: ANONYMOUS CONFESSION SIGNALS ----------------- */}
        {inboxMode === 'confession' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1" style={{ minHeight: '520px' }}>
            
            {/* Left List of Confession Threads */}
            <aside className={`md:col-span-4 rounded-3xl bg-slate-900/60 border border-slate-800 p-4 space-y-3 flex flex-col backdrop-blur-md ${activeConfessionConvId ? 'hidden md:flex' : 'flex'}`}>
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lock className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-white font-heading">Anonymous Signals</h2>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {MOCK_INBOX_CONVERSATIONS.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConfessionConvId(conv.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                      activeConfessionConvId === conv.id
                        ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/30 border-purple-500/50 text-white shadow-md'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-purple-300 font-mono">{conv.peer_label}</span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">#{conv.confession_code}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{conv.last_message}</p>
                  </button>
                ))}
              </div>
            </aside>

            {/* Right Active Confession Chat Thread */}
            <section className={`md:col-span-8 rounded-3xl bg-slate-900/60 border border-slate-800 p-4 flex flex-col justify-between backdrop-blur-md ${!activeConfessionConvId ? 'hidden md:flex' : 'flex'}`}>
              {activeConfessionConv ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveConfessionConvId(null)}
                        className="md:hidden p-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-purple-400" />
                          <span className="font-mono">{activeConfessionConv.peer_label}</span>
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Originating from Confession #{activeConfessionConv.confession_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 space-y-3 overflow-y-auto flex-1 px-1 custom-scrollbar" style={{ maxHeight: '420px' }}>
                    {(confessionMessages[activeConfessionConv.id] || []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-3xl text-xs leading-relaxed ${
                            msg.is_mine
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs border border-purple-400/30'
                              : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                          {formatTimeAgo(msg.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendConfessionMsg} className="flex gap-2 pt-3 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Type an anonymous reply..."
                      value={confessionInputMsg}
                      onChange={(e) => setConfessionInputMsg(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!confessionInputMsg.trim()}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <EmptyState type="inbox" />
              )}
            </section>
          </div>
        )}

      </main>

      {/* Edit Username Modal */}
      {isEditingUsername && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 font-heading">
                <AtSign className="w-5 h-5 text-[#FF6B00]" />
                {usernameLocked ? 'Student Handle (Locked)' : 'Initialize Student Handle'}
              </h3>
              <button onClick={() => setIsEditingUsername(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {usernameLocked ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-800">Your handle is permanently set</p>
                  <p className="text-lg font-black text-[#FF6B00] font-mono">@{myUsername}</p>
                  <p className="text-[11px] text-slate-500">Student handles cannot be changed once claimed to ensure identity consistency.</p>
                </div>
                <button
                  onClick={() => setIsEditingUsername(false)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveUsernameSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Username Handle</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-[#FF6B00] text-xs font-mono font-bold">@</span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="student_lnj"
                      className="w-full bg-[#F4F3EF] border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs text-slate-950 focus:outline-none focus:border-[#FF6B00] font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-amber-600 mt-1 font-semibold">
                    ⚠️ Choose carefully — your handle is permanent and cannot be changed later.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingUsername(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white text-xs font-black shadow-md"
                  >
                    Lock Handle Permanently
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
