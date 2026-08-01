'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { EmptyState } from '@/components/empty-state';
import { PublicConfession, PublicComment } from '@/lib/types';
import { ArrowLeft, MessageSquare, Send, Radio, Loader2 } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export default function ConfessionDetailPage() {
  const params = useParams();
  const code = (params?.code as string) || '';

  const [confession, setConfession] = useState<PublicConfession | null>(null);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!code) return;

    async function loadDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/confessions?code=${encodeURIComponent(code)}`);
        const json = await res.json();

        if (json.success && json.confession) {
          setConfession(json.confession);
          setComments(json.comments || []);
        } else {
          // Check MOCK_CONFESSIONS fallback
          const { MOCK_CONFESSIONS } = await import('@/lib/mock-data');
          const clean = code.trim().replace(/^#/, '').toLowerCase();
          const found = MOCK_CONFESSIONS.find(
            (c) => c.public_code.toLowerCase() === clean || c.id.toLowerCase() === clean
          );
          if (found) {
            setConfession(found);
            setComments([]);
          } else {
            setConfession(null);
          }
        }
      } catch (err) {
        console.error('Failed to load confession detail:', err);
        const { MOCK_CONFESSIONS } = await import('@/lib/mock-data');
        const clean = code.trim().replace(/^#/, '').toLowerCase();
        const found = MOCK_CONFESSIONS.find(
          (c) => c.public_code.toLowerCase() === clean || c.id.toLowerCase() === clean
        );
        if (found) setConfession(found);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [code]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !confession) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/confessions/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confession_id: confession.id,
          content: commentText.trim(),
        }),
      });
      const json = await res.json();

      if (res.ok && json.success && json.comment) {
        setComments((prev) => [...prev, json.comment]);
        setCommentText('');
        if (confession) {
          setConfession({
            ...confession,
            comment_count: (confession.comment_count || 0) + 1,
          });
        }
      } else {
        // Local optimism fallback for smooth UI interaction
        const mockComment: PublicComment = {
          id: `comment-${Date.now()}`,
          confession_id: confession.id,
          content: commentText.trim(),
          anonymous_label: 'Anonymous Student',
          gender: 'Prefer not to say',
          created_at: new Date().toISOString(),
        };
        setComments((prev) => [...prev, mockComment]);
        setCommentText('');
      }
    } catch (err: any) {
      const mockComment: PublicComment = {
        id: `comment-${Date.now()}`,
        confession_id: confession.id,
        content: commentText.trim(),
        anonymous_label: 'Anonymous Student',
        gender: 'Prefer not to say',
        created_at: new Date().toISOString(),
      };
      setComments((prev) => [...prev, mockComment]);
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-32 sm:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 flex-1 w-full space-y-4 sm:space-y-6">
        {/* Mobile Header Nav */}
        <div className="flex items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-[24px] border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/feed"
              className="p-2.5 rounded-xl sm:rounded-2xl bg-[#F4F3EF] hover:bg-slate-200 text-slate-700 hover:text-slate-950 transition-all active:scale-95 shrink-0"
              title="Return to Feed"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </Link>
            <div>
              <h1 className="text-base sm:text-xl font-black text-slate-950 font-heading font-mono flex items-center gap-1.5">
                <span>Confession</span>
                <span className="text-[#FF6B00]">#{code}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-sans">Anonymous campus thread</p>
            </div>
          </div>

          <Link
            href="/feed"
            className="text-[11px] sm:text-xs font-bold text-[#FF6B00] bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 px-3 py-1.5 rounded-full border border-[#FF6B00]/20 transition-all active:scale-95 shrink-0"
          >
            Campus Feed
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-2xl sm:rounded-[28px] border border-slate-200/80 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00] mx-auto" />
            <p className="text-xs font-mono font-bold text-slate-500">Loading confession thread...</p>
          </div>
        ) : confession ? (
          <div className="space-y-4 sm:space-y-6">
            <ConfessionCard confession={confession} isDetailView />

            {/* Comment Section */}
            <div className="rounded-2xl sm:rounded-[28px] bg-white border border-slate-200/80 p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs sm:text-sm font-black text-slate-950 font-heading flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#FF6B00]" />
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-3">
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {errorMsg}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add an anonymous comment..."
                    className="flex-1 bg-[#F4F3EF] border border-slate-200 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#FF6B00] font-sans"
                    maxLength={500}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !commentText.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post Comment
                  </button>
                </div>
              </form>

              {/* Comments Stream */}
              <div className="space-y-3 pt-2">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#FF6B00] font-mono text-[11px] sm:text-xs">
                          {comment.anonymous_label || 'Anonymous Student'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-6 font-mono">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState type="404" />
        )}
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
