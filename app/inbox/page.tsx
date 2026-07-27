'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { EmptyState } from '@/components/empty-state';
import { MessageSquare, Send, Shield, Lock, ArrowLeft } from 'lucide-react';
import { MOCK_INBOX_CONVERSATIONS, MOCK_CONVERSATION_MESSAGES } from '@/lib/mock-data';
import { AnonymousMessage } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

export default function InboxPage() {
  const [activeConvId, setActiveConvId] = useState<string | null>('conv-1');
  const [messages, setMessages] = useState<Record<string, AnonymousMessage[]>>(MOCK_CONVERSATION_MESSAGES);
  const [inputMsg, setInputMsg] = useState('');

  const activeConv = MOCK_INBOX_CONVERSATIONS.find((c) => c.id === activeConvId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeConvId) return;

    const newMsg: AnonymousMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConvId,
      sender_label: activeConv?.my_label || 'Anonymous',
      content: inputMsg.trim(),
      created_at: new Date().toISOString(),
      is_mine: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));

    setInputMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-6 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-6 h-[80vh]">
        {/* Left List of Conversations */}
        <aside className={`md:col-span-4 glass-card p-4 space-y-3 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Anonymous Inbox</h2>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {MOCK_INBOX_CONVERSATIONS.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all ${
                  activeConvId === conv.id
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
        <section className={`md:col-span-8 glass-card p-4 flex flex-col justify-between ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      {activeConv.peer_label}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Originating from Confession #{activeConv.confession_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="py-4 space-y-3 overflow-y-auto flex-1 px-2">
                {(messages[activeConv.id] || []).map((msg) => (
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

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Type an anonymous reply..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
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
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
