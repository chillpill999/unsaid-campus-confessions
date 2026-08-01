'use server';

import { createClient } from '@/lib/supabase/server';

export async function fetchPublicConfessions(limit: number = 20, cursor?: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let query = supabase
    .from('public_confessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: rawConfessions, error } = await query;

  if (error) {
    console.error('Failed to fetch confessions:', error);
    throw new Error('Failed to fetch confessions');
  }

  const hasMore = (rawConfessions || []).length > limit;
  const confessions = hasMore ? (rawConfessions || []).slice(0, limit) : (rawConfessions || []);
  const confessionIds = confessions.map((c: any) => c.id);

  let userReactions: Record<string, string> = {};
  let userBookmarks: Set<string> = new Set();
  const reactionCountsMap = new Map<string, { relatable: number; funny: number; support: number; interesting: number }>();

  if (confessionIds.length > 0) {
    const { data: reactions } = await supabase
      .from('reactions')
      .select('confession_id, reaction_type')
      .in('confession_id', confessionIds)
      .eq('user_id', user.id);

    for (const r of (reactions || [])) {
      userReactions[r.confession_id] = r.reaction_type;
    }

    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('confession_id')
      .in('confession_id', confessionIds)
      .eq('user_id', user.id);

    for (const b of (bookmarks || [])) {
      userBookmarks.add(b.confession_id);
    }

    // 2. Fetch real reaction counts for all confessions in view
    const { data: reactionCounts } = await supabase
      .from('reactions')
      .select('confession_id, reaction_type')
      .in('confession_id', confessionIds);

    for (const r of (reactionCounts || [])) {
      const counts = reactionCountsMap.get(r.confession_id) || { relatable: 0, funny: 0, support: 0, interesting: 0 };
      if (r.reaction_type in counts) {
        counts[r.reaction_type as keyof typeof counts]++;
      }
      reactionCountsMap.set(r.confession_id, counts);
    }
  }

  const result = (confessions || []).map((c: any) => ({
    id: c.id,
    public_code: c.public_code,
    content: c.content,
    category_name: c.category_name,
    category_slug: c.category_slug,
    category_icon: c.category_icon,
    image_path: c.image_path,
    recipient_gender: c.recipient_gender,
    target_batch: c.target_batch,
    target_department: c.target_department,
    gender: c.gender,
    poll_data: c.poll_options,
    created_at: c.created_at,
    reaction_counts: reactionCountsMap.get(c.id) || { relatable: 0, funny: 0, support: 0, interesting: 0 },
    comment_count: c.comment_count || 0,
    user_reaction: userReactions[c.id] || null,
    is_bookmarked: userBookmarks.has(c.id),
    // The public_confessions view does not expose author_id (anonymity), so a
    // feed row can never be flagged as "mine".
    is_mine: false,
    can_edit: false,
  }));

  return result;
}

export async function fetchPublicConfessionsPaginated(limit: number = 20, cursor?: string) {
  const confessions = await fetchPublicConfessions(limit, cursor);
  const hasMore = confessions.length === limit;
  const nextCursor = confessions.length > 0 ? confessions[confessions.length - 1].created_at : null;

  return { confessions, nextCursor, hasMore };
}

export async function toggleReaction(confessionId: string, reactionType: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: existing } = await supabase
    .from('reactions')
    .select('id, reaction_type')
    .eq('user_id', user.id)
    .eq('confession_id', confessionId)
    .single();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').update({ reaction_type: reactionType }).eq('id', existing.id);
    }
  } else {
    await supabase.from('reactions').insert({
      user_id: user.id,
      confession_id: confessionId,
      reaction_type: reactionType,
    });
  }
}

export async function toggleBookmark(confessionId: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('confession_id', confessionId)
    .single();

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id);
    return { bookmarked: false };
  } else {
    await supabase.from('bookmarks').insert({
      user_id: user.id,
      confession_id: confessionId,
    });
    return { bookmarked: true };
  }
}
