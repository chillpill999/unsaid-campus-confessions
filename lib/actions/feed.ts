'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastReactionUpdate } from '@/lib/realtime/broadcast';
import { sanitizePollData } from '@/lib/utils';
import { PublicConfession } from '@/lib/types';

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
    // 1a. Fetch current user's own reaction (for highlight state)
    const { data: reactions } = await supabase
      .from('reactions')
      .select('confession_id, reaction_type')
      .in('confession_id', confessionIds)
      .eq('user_id', user.id);

    for (const r of (reactions || [])) {
      userReactions[r.confession_id] = r.reaction_type;
    }

    // 1b. Fetch current user's bookmarks
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('confession_id')
      .in('confession_id', confessionIds)
      .eq('user_id', user.id);

    for (const b of (bookmarks || [])) {
      userBookmarks.add(b.confession_id);
    }
  }

  const result = (confessions || []).map((c: any) => {
    const rawCounts = c.reaction_counts || {};
    const reactionCounts = {
      relatable: typeof rawCounts.relatable === 'number' ? rawCounts.relatable : 0,
      funny: typeof rawCounts.funny === 'number' ? rawCounts.funny : 0,
      support: typeof rawCounts.support === 'number' ? rawCounts.support : 0,
      interesting: typeof rawCounts.interesting === 'number' ? rawCounts.interesting : 0,
    };

    return {
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
      poll_data: sanitizePollData(c.poll_options),
      created_at: c.created_at,
      reaction_counts: reactionCounts,
      comment_count: c.comment_count || 0,
      user_reaction: (userReactions[c.id] as PublicConfession['user_reaction']) || null,
      is_bookmarked: userBookmarks.has(c.id),
      is_mine: false,
      can_edit: false,
    };
  });

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
      .select('public_code, author_id')
      .eq('id', confessionId)
      .single();

    if (conf?.public_code) {
      await broadcastReactionUpdate(conf.public_code, freshCounts);

      // Notify the confession author of a brand-new reaction (not on removals).
      if (!existing && conf.author_id && conf.author_id !== user.id) {
        try {
          await admin.from('notifications').insert({
            recipient_id: conf.author_id,
            type: 'reaction',
            confession_id: confessionId,
            metadata: {
              reaction_type: reactionType,
              confession_code: conf.public_code,
            },
          });
        } catch (notifErr) {
          console.warn('Reaction notification insert note:', notifErr);
        }
      }
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

  // Atomic, race-safe poll voting via the vote_poll RPC. The function validates
  // that the option belongs to the poll, prevents double voting in a single
  // guarded UPDATE, and returns the fresh poll_options for the client.
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  const { data: pollOptions, error } = await admin.rpc('vote_poll', {
    p_confession_id: confessionId,
    p_option_id: optionId,
    p_user_id: user.id,
  });

  if (error) {
    const message = (error.message || '').toLowerCase();
    if (message.includes('poll_not_found')) {
      throw new Error('Confession or poll not found');
    }
    if (message.includes('invalid_option')) {
      throw new Error('Invalid poll option');
    }
    console.error('Failed to persist poll vote:', error);
    throw new Error('Failed to save poll vote');
  }

  return { alreadyVoted: false, poll_options: sanitizePollData(pollOptions) };
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

export async function getMoodStats(): Promise<{ mood: string; count: number }[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let admin: any;
  try { admin = createAdminClient(); } catch { admin = supabase; }

  const { data } = await admin.from('mood_votes').select('mood');
  const statsMap = new Map<string, number>();
  for (const row of (data || [])) {
    statsMap.set(row.mood, (statsMap.get(row.mood) || 0) + 1);
  }
  return Array.from(statsMap.entries()).map(([mood, count]) => ({ mood, count }));
}

export async function voteMood(mood: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let admin: any;
  try { admin = createAdminClient(); } catch { admin = supabase; }

  // One vote per user per day (enforced by mood_votes.vote_date + unique(user_id, vote_date))
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await admin.from('mood_votes').upsert(
    {
      user_id: user.id,
      mood,
      vote_date: today,
    },
    { onConflict: 'user_id,vote_date' }
  );

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: 'You already voted today. One vote per student daily.' };
    }
    console.warn('Mood vote DB error:', error);
    return { success: false, message: 'Failed to record your mood vote.' };
  }

  // Realtime sync to all connected clients
  try {
    const refreshed = await admin.from('mood_votes').select('mood');
    const statsMap = new Map<string, number>();
    for (const r of (refreshed.data || [])) {
      statsMap.set(r.mood, (statsMap.get(r.mood) || 0) + 1);
    }
    const stats = Array.from(statsMap.entries()).map(([m, c]) => ({ mood: m, count: c }));
    const { broadcastCampusMoodUpdate } = await import('@/lib/realtime/broadcast');
    await broadcastCampusMoodUpdate(pjToWidget(stats));
  } catch (err) {
    console.warn('Mood broadcast note:', err);
  }

  return { success: true, message: 'Mood vote recorded.' };
}

function pjToWidget(stats: { mood: string; count: number }[]) {
  const total = stats.reduce((acc, s) => acc + s.count, 0);
  return stats.map((s) => ({
    mood: s.mood,
    count: s.count,
    percentage: total > 0 ? Math.round((s.count / total) * 100) : 0,
  }));
}

export async function getBookmarkedConfessions(): Promise<PublicConfession[]> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  let admin: any;
  try { admin = createAdminClient(); } catch { admin = supabase; }

  // 1. Fetch the user's bookmark rows
  const { data: bookmarkRows } = await admin
    .from('bookmarks')
    .select('confession_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const confessionIds = (bookmarkRows || []).map((b: any) => b.confession_id);
  if (confessionIds.length === 0) return [];

  // 2. Fetch those confessions from the safe public view
  const { data: viewRows } = await admin
    .from('public_confessions')
    .select('*')
    .in('id', confessionIds);

  const rowsById = new Map((viewRows || []).map((r: any) => [r.id, r]));

  // 3. Preserve bookmark order (most recently saved first)
  const ordered = (bookmarkRows || [])
    .map((b: any) => rowsById.get(b.confession_id))
    .filter(Boolean);

  return ordered.map((row: any) => ({
    id: row.id,
    public_code: row.public_code || row.id.slice(0, 6).toUpperCase(),
    content: row.content,
    category_name: row.category_name || 'Confession',
    category_slug: row.category_slug || 'confession',
    category_icon: row.category_icon || '🔒',
    image_path: row.image_path || null,
    gender: row.gender || 'Male',
    recipient_gender: row.recipient_gender || null,
    target_batch: row.target_batch || null,
    target_department: row.target_department || null,
    created_at: row.created_at,
    reaction_counts: row.reaction_counts || { relatable: 0, funny: 0, support: 0, interesting: 0 },
    comment_count: row.comment_count || 0,
    poll_data: sanitizePollData(row.poll_options) || null,
    is_bookmarked: true,
  }));
}
