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
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MOCK_INBOX_CONVERSATIONS, MOCK_CONVERSATION_MESSAGES } from '@/lib/mock-data';
import { AnonymousMessage, DirectMessage, FriendContact, FriendRequest } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import {
  getSavedUsername,
  saveUsername,
  initializeDemoChatData,
  getFriendsList,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getDirectMessagesForConv,
  sendDirectMessage,
  getConversationKey,
  getRemainingTimeFormatted,
  MOCK_CAMPUS_DIRECTORY,
  purgeExpiredMessages
} from '@/lib/friends-chat';

export default function InboxPage() {
  // Inbox Mode: 'direct' (Instagram-style 24h chat) or 'confession' (Anonymous post chat)
  const [inboxMode, setInboxMode] = useState<'direct' | 'confession'>('direct');

  // Direct DM Sub-tabs: 'chats' | 'requests' | 'search'
  const [dmSubTab, setDmSubTab] = useState<'chats' | 'requests' | 'search'>('chats');

  // User handle state
  const [myUsername, setMyUsername] = useState<string>('student_lnj');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameNotice, setUsernameNotice] = useState<string | null>(null);

  // Friend contacts & requests
  const [friends, setFriends] = useState<FriendContact[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activeFriend, setActiveFriend] = useState<FriendContact | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [directInputMsg, setDirectInputMsg] = useState('');

  // Add Friend Search Query
  const [searchHandle, setSearchHandle] = useState('');
  const [searchNotice, setSearchNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Anonymous Confession Chat state (Existing feature)
  const [activeConfessionConvId, setActiveConfessionConvId] = useState<string | null>('conv-1');
  const [confessionMessages, setConfessionMessages] = useState<Record<string, AnonymousMessage[]>>(MOCK_CONVERSATION_MESSAGES);
  const [confessionInputMsg, setConfessionInputMsg] = useState('');

  // 1. Initialize Username & Demo Data on load
  useEffect(() => {
    const handle = getSavedUsername();
    setMyUsername(handle);
    setUsernameInput(handle);
    initializeDemoChatData(handle);

    setFriends(getFriendsList());
    setRequests(getFriendRequests());
  }, []);

  // 2. Refresh active Direct Chat messages & Auto-purge expired 24h messages
  useEffect(() => {
    if (!activeFriend || inboxMode !== 'direct') return;

    const convKey = getConversationKey(myUsername, activeFriend.username);
    const msgs = getDirectMessagesForConv(convKey, myUsername);
    setDmMessages(msgs);

    // Auto-purge interval every 5 seconds to wipe messages > 24 hours live
    const interval = setInterval(() => {
      purgeExpiredMessages();
      const updatedMsgs = getDirectMessagesForConv(convKey, myUsername);
      setDmMessages(updatedMsgs);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeFriend, myUsername, inboxMode]);

  // Set default active friend if available
  useEffect(() => {
    if (friends.length > 0 && !activeFriend) {
      setActiveFriend(friends[0]);
    }
  }, [friends, activeFriend]);

  // Save username handler
  const handleSaveUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    const clean = saveUsername(usernameInput);
    setMyUsername(clean);
    setIsEditingUsername(false);
    setUsernameNotice(`Username updated to @${clean}!`);
    setTimeout(() => setUsernameNotice(null), 3000);
  };

  // Send Direct Message (24h volatile)
  const handleSendDirectMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInputMsg.trim() || !activeFriend) return;

    const newMsg = sendDirectMessage(myUsername, activeFriend.username, directInputMsg.trim());
    setDmMessages((prev) => [...prev, newMsg]);
    setDirectInputMsg('');
  };

  // Send Friend Request
  const handleSendRequestSubmit = (targetHandle: string) => {
    setSearchNotice(null);
    const res = sendFriendRequest(myUsername, 'Me', targetHandle);
    if (res.success) {
      setSearchNotice({ type: 'success', text: res.message });
      setRequests(getFriendRequests());
    } else {
      setSearchNotice({ type: 'error', text: res.message });
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = (reqId: string) => {
    const newFriend = acceptFriendRequest(reqId);
    setRequests(getFriendRequests());
    const updatedFriends = getFriendsList();
    setFriends(updatedFriends);
    if (newFriend) {
      setActiveFriend(newFriend);
      setDmSubTab('chats');
    }
  };

  // Reject Friend Request
  const handleRejectRequest = (reqId: string) => {
    rejectFriendRequest(reqId);
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

  const pendingIncomingRequests = requests.filter((r) => r.receiver_username.toLowerCase() === myUsername.toLowerCase() && r.status === 'pending');
  const activeConfessionConv = MOCK_INBOX_CONVERSATIONS.find((c) => c.id === activeConfessionConvId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 flex-1 w-full flex flex-col space-y-4" style={{ minHeight: 'calc(100vh - 10rem)' }}>
        
        {/* Main Inbox Header & Primary Mode Switcher */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h1 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Campus Messenger
              </h1>
              <p className="text-xs text-slate-400">
                Connect with verified students or reply to anonymous signals.
              </p>
            </div>

            {/* Username Badge */}
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1 text-xs font-mono text-indigo-300 font-bold">
                <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                <span>{myUsername}</span>
              </div>
              <button
                onClick={() => setIsEditingUsername(true)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Edit Username"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {usernameNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {usernameNotice}
            </div>
          )}

          {/* Primary Tabs: Direct Messages vs Anonymous Confessions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInboxMode('direct')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                inboxMode === 'direct'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Direct Messages (24h Disappearing ⏱️)</span>
            </button>

            <button
              onClick={() => setInboxMode('confession')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                inboxMode === 'confession'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Confession Inbox</span>
            </button>
          </div>
        </div>

        {/* ----------------- MODE 1: INSTAGRAM DIRECT CHAT (24h Volatile) ----------------- */}
        {inboxMode === 'direct' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1" style={{ height: 'calc(100vh - 16rem)' }}>
            
            {/* Left Sidebar: Sub-tabs & Contact List */}
            <aside className={`md:col-span-4 glass-card p-4 space-y-3 flex flex-col ${activeFriend && dmSubTab === 'chats' ? 'hidden md:flex' : 'flex'}`}>
              
              {/* DM Sub-tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setDmSubTab('chats')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    dmSubTab === 'chats' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Chats ({friends.length})
                </button>
                <button
                  onClick={() => setDmSubTab('requests')}
                  className={`py-1.5 rounded-lg transition-all text-center relative ${
                    dmSubTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Requests
                  {pendingIncomingRequests.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-pink-500 text-white text-[10px] rounded-full font-bold">
                      {pendingIncomingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setDmSubTab('search')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    dmSubTab === 'search' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + Add Friend
                </button>
              </div>

              {/* Sub-tab 1: Active Friends Chat List */}
              {dmSubTab === 'chats' && (
                <div className="space-y-2 overflow-y-auto flex-1">
                  {friends.length > 0 ? (
                    friends.map((friend) => {
                      const isActive = activeFriend?.username === friend.username;
                      return (
                        <button
                          key={friend.username}
                          onClick={() => setActiveFriend(friend)}
                          className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                            isActive
                              ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${friend.avatar_gradient || 'from-indigo-600 to-purple-600'} flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md`}>
                            {friend.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="truncate text-indigo-300">@{friend.username}</span>
                              <span className="text-[10px] text-pink-400 font-mono flex items-center gap-0.5">
                                <Clock className="w-3 h-3 inline" /> 24h
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{friend.full_name} • {friend.department}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-medium">No friends added yet.</p>
                      <button
                        onClick={() => setDmSubTab('search')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                      >
                        Find Students by Username
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Pending Friend Requests */}
              {dmSubTab === 'requests' && (
                <div className="space-y-3 overflow-y-auto flex-1">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Incoming Requests</h3>
                  {pendingIncomingRequests.length > 0 ? (
                    pendingIncomingRequests.map((req) => (
                      <div key={req.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="block text-xs font-bold text-indigo-300">@{req.sender_username}</span>
                            <span className="text-[11px] text-slate-400">{req.sender_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{formatTimeAgo(req.created_at)}</span>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold border border-slate-800"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">No pending incoming friend requests.</p>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Add Friend / Search Campus Handles */}
              {dmSubTab === 'search' && (
                <div className="space-y-4 overflow-y-auto flex-1">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">Send Friend Request</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchHandle}
                          onChange={(e) => setSearchHandle(e.target.value)}
                          placeholder="enter_username"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <button
                        onClick={() => handleSendRequestSubmit(searchHandle)}
                        disabled={!searchHandle.trim()}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
                      >
                        Request
                      </button>
                    </div>

                    {searchNotice && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium ${
                        searchNotice.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                      }`}>
                        {searchNotice.text}
                      </div>
                    )}
                  </div>

                  {/* Campus Directory Suggestions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Campus Students</h4>
                    <div className="space-y-2">
                      {MOCK_CAMPUS_DIRECTORY.map((user) => (
                        <div key={user.username} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${user.avatar_gradient} flex items-center justify-center font-bold text-white text-[11px]`}>
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-indigo-300">@{user.username}</span>
                              <span className="text-[10px] text-slate-400">{user.full_name} ({user.department})</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendRequestSubmit(user.username)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-all"
                          >
                            + Request
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </aside>

            {/* Right Chat Window for Selected Friend */}
            <section className={`md:col-span-8 glass-card p-4 flex flex-col justify-between ${!activeFriend ? 'hidden md:flex' : 'flex'}`}>
              {activeFriend ? (
                <>
                  {/* Chat Header with 24h Volatile Badge */}
                  <div className="border-b border-slate-800 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveFriend(null)}
                          className="md:hidden text-slate-400 hover:text-white"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeFriend.avatar_gradient || 'from-indigo-600 to-purple-600'} flex items-center justify-center font-bold text-white text-sm shadow-md`}>
                          {activeFriend.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            @{activeFriend.username}
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            {activeFriend.full_name} • {activeFriend.department} ({activeFriend.batch})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 24-Hour Ephemeral Warning Banner */}
                    <div className="bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-xl flex items-center justify-between text-[11px] font-semibold text-pink-300">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-pink-400" />
                        24-Hour Volatile Chat Active
                      </span>
                      <span className="text-[10px] text-pink-400/80 font-mono">
                        All messages self-destruct 24h after sending ⏱️
                      </span>
                    </div>
                  </div>

                  {/* Message Thread List */}
                  <div className="py-4 space-y-3 overflow-y-auto flex-1 px-2">
                    {dmMessages.length > 0 ? (
                      dmMessages.map((msg) => {
                        const remainingText = getRemainingTimeFormatted(msg.expires_at);
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                                msg.is_mine
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                              }`}
                            >
                              <p>{msg.content}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-1 px-1">
                              <span>{formatTimeAgo(msg.created_at)}</span>
                              <span>•</span>
                              <span className="text-pink-400 flex items-center gap-0.5 font-bold">
                                <Clock className="w-3 h-3" /> {remainingText}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center space-y-2">
                        <Clock className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                        <p className="text-xs font-bold text-slate-300">No messages in this chat yet.</p>
                        <p className="text-[11px] text-slate-500">Say hello! Messages will automatically disappear 24 hours after sending.</p>
                      </div>
                    )}
                  </div>

                  {/* Send Direct Message Input */}
                  <form onSubmit={handleSendDirectMessageSubmit} className="flex gap-2 pt-3 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder={`Message @${activeFriend.username}... (disappears in 24h)`}
                      value={directInputMsg}
                      onChange={(e) => setDirectInputMsg(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!directInputMsg.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <Users className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Select a friend to start chatting</h3>
                  <p className="text-xs text-slate-400">
                    All direct messages auto-delete 24 hours after sending.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ----------------- MODE 2: ANONYMOUS CONFESSION INBOX ----------------- */}
        {inboxMode === 'confession' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1" style={{ height: 'calc(100vh - 16rem)' }}>
            {/* Left List of Conversations */}
            <aside className={`md:col-span-4 glass-card p-4 space-y-3 flex flex-col ${activeConfessionConvId ? 'hidden md:flex' : 'flex'}`}>
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Confession Signals</h2>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1">
                {MOCK_INBOX_CONVERSATIONS.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConfessionConvId(conv.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      activeConfessionConvId === conv.id
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-indigo-300">{conv.peer_label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">#{conv.confession_code}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{conv.last_message}</p>
                  </button>
                ))}
              </div>
            </aside>

            {/* Right Active Chat View */}
            <section className={`md:col-span-8 glass-card p-4 flex flex-col justify-between ${!activeConfessionConvId ? 'hidden md:flex' : 'flex'}`}>
              {activeConfessionConv ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveConfessionConvId(null)}
                        className="md:hidden text-slate-400 hover:text-white"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-indigo-400" />
                          {activeConfessionConv.peer_label}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Originating from Confession #{activeConfessionConv.confession_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 space-y-3 overflow-y-auto flex-1 px-2">
                    {(confessionMessages[activeConfessionConv.id] || []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.is_mine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            msg.is_mine
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
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
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!confessionInputMsg.trim()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
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
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AtSign className="w-5 h-5 text-indigo-400" />
                Claim Your Student Handle
              </h3>
              <button onClick={() => setIsEditingUsername(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username Handle</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-mono font-bold">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="alex_lnj"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Only letters, numbers, and underscores allowed.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Save Handle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
