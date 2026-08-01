'use server';

import { createClient } from '@/lib/supabase/server';
import { broadcastCommentUpdate } from '@/lib/realtime/broadcast';

export async function fetchPublicComments(confessionId: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: comments, error } = await supabase
    .from('public_comments')
    .select('*')
    .eq('confession_id', confessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch comments');
  }

  const commentMap = new Map<string, any>();
  const topLevel: any[] = [];

  for (const c of (comments || [])) {
    commentMap.set(c.id, { ...c, replies: [] });
  }

  for (const c of (comments || [])) {
    if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
      commentMap.get(c.parent_comment_id).replies.push(commentMap.get(c.id));
    } else if (!c.parent_comment_id) {
      topLevel.push(commentMap.get(c.id));
    }
  }

  return topLevel;
}

export async function createComment(confessionId: string, content: string, parentCommentId?: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (!content.trim() || content.length > 500) {
    throw new Error('Comment must be between 1 and 500 characters');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      confession_id: confessionId,
      author_id: user.id,
      parent_comment_id: parentCommentId || null,
      content: content.trim(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to create comment');
  }

  // Fetch updated total comment count and public_code for realtime broadcast.
  // Direct SELECT on confessions/comments is revoked for the client role, so
  // use the admin (service-role) client for these read-only lookups.
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    const { data: confession } = await admin
      .from('confessions')
      .select('public_code')
      .eq('id', confessionId)
      .single();

    const { count } = await admin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('confession_id', confessionId)
      .eq('is_deleted', false);

    if (confession?.public_code) {
      broadcastCommentUpdate(confession.public_code, count || 1);
    }
  } catch (bcErr) {
    console.warn('Realtime comment broadcast note:', bcErr);
  }

  return { success: true, comment_id: data.id };
}
