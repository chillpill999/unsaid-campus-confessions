'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastReactionUpdate } from '@/lib/realtime/broadcast';

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
    // Use admin client to bypass RLS for aggregate queries
    const admin = createAdminClient();

    // 1a. Fetch current user's own reaction (for highlight state)
    const { data: reactions } = await admin
      .from('reactions')
      .select('confession_id, reaction_type')
      .in('confession_id', confessionIds)
      .eq('user_id', user.id);

    for (const r of (reactions || [])) {
      userReactions[r.confession_id] = r.reaction_type;
    }

    // 1b. Fetch current user's bookmarks
    const { data: bookmarks } = await admin
      .from('bookmarks')
      .select('confession_id')
      .in('confession_id', confessionIds)
      .eq('user_id', user.id);

    for (const b of (bookmarks || [])) {
      userBookmarks.add(b.confession_id);
    }

    // 2. Fetch ALL reaction counts across ALL users (admin bypasses RLS)
    const { data: reactionCounts } = await admin
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

  // Use admin client — reactions table only has INSERT/DELETE grants, missing SELECT/UPDATE
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('reactions')
    .select('id, reaction_type')
    .eq('user_id', user.id)
    .eq('confession_id', confessionId)
    .single();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      await admin.from('reactions').delete().eq('id', existing.id);
    } else {
      await admin.from('reactions').update({ reaction_type: reactionType }).eq('id', existing.id);
    }
  } else {
    await admin.from('reactions').insert({
      user_id: user.id,
      confession_id: confessionId,
      reaction_type: reactionType,
    });
  }

  // Return fresh counts so the broadcaster has accurate data
  const { data: allReactions } = await admin
    .from('reactions')
    .select('reaction_type')
    .eq('confession_id', confessionId);

  const freshCounts = { relatable: 0, funny: 0, support: 0, interesting: 0 };
  for (const r of (allReactions || [])) {
    if (r.reaction_type in freshCounts) {
      freshCounts[r.reaction_type as keyof typeof freshCounts]++;
    }
  }

  // Trigger server-side broadcast to all active campus feed clients
  try {
    const { data: conf } = await admin
      .from('confessions')
      .select('public_code')
      .eq('id', confessionId)
      .single();

    if (conf?.public_code) {
      await broadcastReactionUpdate(conf.public_code, freshCounts);
    }
  } catch (bErr) {
    console.warn('Server-side reaction broadcast note:', bErr);
  }

  return freshCounts;
}

export async function votePoll(confessionId: string, optionId: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Use admin client to update the confessions table (bypasses RLS on author-only rows)
  let admin: any = supabase;
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    admin = createAdminClient();
  } catch (e) {}

  // Fetch the current poll_options JSONB from the confessions table
  const { data: confession, error: fetchError } = await admin
    .from('confessions')
    .select('id, poll_options')
    .eq('id', confessionId)
    .single();

  if (fetchError || !confession || !confession.poll_options) {
    throw new Error('Confession or poll not found');
  }

  const pollData = confession.poll_options;

  // Check if user already voted (tracked in poll_options.voters array)
  const voters: string[] = pollData.voters || [];
  if (voters.includes(user.id)) {
    // Already voted - return current state without error
    return { alreadyVoted: true, poll_options: pollData };
  }

  // Increment the selected option's vote count
  const updatedOptions = (pollData.options || []).map((opt: any) =>
    opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
  );

  const updatedPollData = {
    ...pollData,
    total_votes: (pollData.total_votes || 0) + 1,
    options: updatedOptions,
    voters: [...voters, user.id],
  };

  // Persist to database
  const { error: updateError } = await admin
    .from('confessions')
    .update({ poll_options: updatedPollData })
    .eq('id', confessionId);

  if (updateError) {
    console.error('Failed to persist poll vote:', updateError);
    throw new Error('Failed to save poll vote');
  }

  return { alreadyVoted: false, poll_options: updatedPollData };
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
