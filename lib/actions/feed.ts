'use server';

import { createClient } from '@/lib/supabase/server';

export async function fetchPublicConfessions() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: confessions, error } = await supabase
    .from('public_confessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch confessions');
  }

  const confessionIds = (confessions || []).map((c: any) => c.id);

  let userReactions: Record<string, string> = {};
  let userBookmarks: Set<string> = new Set();

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
  }

  const confessionMap = new Map<string, any>();
  const { data: reactionCounts } = await supabase
    .from('reactions')
    .select('confession_id, reaction_type');

  for (const r of (reactionCounts || [])) {
    const existing = confessionMap.get(r.confession_id) || {};
    confessionMap.set(r.confession_id, existing);
  }

  return (confessions || []).map((c: any) => ({
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
    reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
    comment_count: c.comment_count || 0,
    user_reaction: userReactions[c.id] || null,
    is_bookmarked: userBookmarks.has(c.id),
    is_mine: false,
    can_edit: false,
  }));
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
