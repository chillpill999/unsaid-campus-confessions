'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { CommentSection } from '@/components/comment-section';
import { EmptyState } from '@/components/empty-state';
import { ArrowLeft } from 'lucide-react';
import { MOCK_CONFESSIONS, MOCK_COMMENTS } from '@/lib/mock-data';
import { PublicComment } from '@/lib/types';

export default function SingleConfessionPage() {
  const params = useParams();
  const code = (params?.code as string) || '';

  const confession = MOCK_CONFESSIONS.find(
    (c) => c.public_code.toLowerCase() === code.toLowerCase()
  );

  const [comments, setComments] = useState<PublicComment[]>(
    confession ? MOCK_COMMENTS[confession.id] || [] : []
  );

  if (!confession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-12 flex-1 w-full">
          <EmptyState type="404" />
        </main>
      </div>
    );
  }

  const handleAddComment = (content: string, parentCommentId?: string) => {
    const newCommentObj: PublicComment = {
      id: `comm-${Date.now()}`,
      confession_id: confession.id,
      parent_comment_id: parentCommentId || null,
      content,
      anonymous_label: `Anonymous ${String.fromCharCode(65 + comments.length)}`,
      gender: 'Female',
      created_at: new Date().toISOString(),
    };

    if (parentCommentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentCommentId
            ? { ...c, replies: [...(c.replies || []), newCommentObj] }
            : c
        )
      );
    } else {
      setComments((prev) => [...prev, newCommentObj]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>

        {/* Confession Card Detail View */}
        <ConfessionCard confession={confession} isDetailView={true} />

        {/* Comment Thread */}
        <CommentSection
          confessionId={confession.id}
          comments={comments}
          onAddComment={handleAddComment}
        />
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
