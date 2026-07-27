'use client';

import React, { useState } from 'react';
import { Send, CornerDownRight, Flag, ShieldAlert } from 'lucide-react';
import { PublicComment, Gender } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';

interface CommentSectionProps {
  confessionId: string;
  comments: PublicComment[];
  onAddComment: (content: string, parentCommentId?: string) => void;
  userGender?: Gender;
}

export function CommentSection({
  confessionId,
  comments,
  onAddComment,
  userGender = 'Female',
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitMain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    onAddComment(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyingToId(null);
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-6">
      <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between">
        <span>Campus Discussion</span>
        <span className="text-xs font-normal text-slate-500 font-mono">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </h4>

      {/* Main Comment Box */}
      <form onSubmit={handleSubmitMain} className="flex gap-2">
        <input
          type="text"
          placeholder={`Add an anonymous comment as Anonymous (${userGender})...`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-500"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Comment
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            {/* Comment Header */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                  {comment.anonymous_label}
                </span>
                {comment.gender !== 'Prefer not to say' && (
                  <span className="text-slate-400 text-[11px] font-medium">• {comment.gender}</span>
                )}
                <span className="text-slate-500 font-normal">• {formatTimeAgo(comment.created_at)}</span>
              </div>

              <button
                onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                className="text-slate-400 hover:text-indigo-300 font-semibold text-[11px] transition-colors"
              >
                Reply
              </button>
            </div>

            {/* Comment Content */}
            <p className="text-xs text-slate-300 leading-relaxed font-normal">{comment.content}</p>

            {/* Reply Input Box */}
            {replyingToId === comment.id && (
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder={`Reply to ${comment.anonymous_label}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  maxLength={500}
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Send
                </button>
              </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="pl-4 border-l-2 border-slate-800 space-y-3 pt-2">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <CornerDownRight className="w-3 h-3 text-slate-500" />
                      <span className="font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded text-[11px] border border-purple-500/20">
                        {reply.anonymous_label}
                      </span>
                      <span className="text-slate-500 text-[11px]">{formatTimeAgo(reply.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-300 pl-5">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
