'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { CommentSection } from '@/components/comment-section';
import { EmptyState } from '@/components/empty-state';
import { ArrowLeft } from 'lucide-react';
import { MOCK_CONFESSIONS } from '@/lib/mock-data';
import { PublicComment, PublicConfession } from '@/lib/types';
import { fetchPublicComments, createComment } from '@/lib/actions/comments';

export default function SingleConfessionPage() {
  const params = useParams();
  const code = (params?.code as string) || '';

  const [confession, setConfession] = useState<PublicConfession | undefined>(
    MOCK_CONFESSIONS.find((c) => c.public_code.toLowerCase() === code.toLowerCase())
  );
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  useEffect(() => {
    async function loadComments() {
      if (!confession) return;
      setIsLoadingComments(true);
      try {
        const data = await fetchPublicComments(confession.id);
        setComments(data as PublicComment[]);
      } catch (err) {
        console.warn('Failed to load comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
    loadComments();
  }, [confession]);

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

  const handleAddComment = async (content: string, parentCommentId?: string) => {
    try {
      await createComment(confession.id, content, parentCommentId);
      const updated = await fetchPublicComments(confession.id);
      setComments(updated as PublicComment[]);
    } catch (err) {
      console.error('Failed to create comment:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>

        <ConfessionCard confession={confession} isDetailView={true} />

        {isLoadingComments ? (
          <div className="glass-card p-8 text-center text-xs text-slate-400">Loading comments...</div>
        ) : (
          <CommentSection
            confessionId={confession.id}
            comments={comments}
            onAddComment={handleAddComment}
          />
        )}
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
