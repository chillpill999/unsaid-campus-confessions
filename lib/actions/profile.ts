'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Gender, PublicConfession, UserProfile } from '@/lib/types';

export async function createProfile(data: {
  gender: Gender;
  batch: string;
  department: string;
  college_id: string;
}) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: true, fallback: true };
    }

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      gender: data.gender,
      batch: data.batch,
      department: data.department,
      college_id: data.college_id,
      role: 'student',
      account_status: 'active',
    });

    if (error) {
      if (error.code === '23505') {
        return { success: true, existing: true };
      }
      console.warn('Profile DB insert note:', error);
      return { success: true, fallback: true };
    }

    return { success: true, existing: false };
  } catch (err: any) {
    console.warn('createProfile catch note:', err);
    return { success: true, fallback: true };
  }
}

export async function getProfile() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (err) {
    return null;
  }
}

// ── FAST: Profile header only (single query, instant) ──
export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    let admin: any;
    try { admin = createAdminClient(); } catch { admin = supabase; }

    const { data: profileRow } = await admin.from('profiles').select('*, colleges(name)').eq('id', user.id).maybeSingle();

    const realFullName = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'Student');
    const realEmail = user.email || '';
    const realAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    // Derive deterministic default username from email prefix or user ID
    const defaultHandle = (user.email ? user.email.split('@')[0] : `student_${user.id.slice(0, 6)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    let finalUsername = profileRow?.username || defaultHandle;

    // Auto-persist handle to DB if missing so all devices see the exact same handle
    if (profileRow && !profileRow.username) {
      try {
        await admin.from('profiles').update({ username: defaultHandle }).eq('id', user.id);
      } catch (err) {
        console.warn('Auto-save username note:', err);
      }
    }

    return profileRow
      ? {
          id: profileRow.id, full_name: profileRow.full_name || realFullName, email: realEmail, avatar_url: realAvatarUrl,
          username: finalUsername,
          gender: profileRow.gender || 'Male', college_id: profileRow.college_id || '',
          college_name: profileRow.colleges?.name || 'Loknayak Jai Prakash Institute of Technology',
          batch: profileRow.batch || '2026', department: profileRow.department || 'Computer Science & Engineering (CSE)',
          role: profileRow.role || 'student', account_status: profileRow.account_status || 'active',
          created_at: profileRow.created_at || new Date().toISOString(),
        }
      : {
          id: user.id, full_name: realFullName, email: realEmail, avatar_url: realAvatarUrl,
          username: finalUsername,
          gender: 'Prefer not to say' as Gender, college_id: '',
          college_name: 'Loknayak Jai Prakash Institute of Technology', batch: '2026',
          department: 'Computer Science & Engineering (CSE)', role: 'student' as const,
          account_status: 'active' as const, created_at: new Date().toISOString(),
        };
  } catch (err) {
    return null;
  }
}

// ── HEAVY: Stats + confessions (all queries fire in ONE Promise.all) ──
export async function getMyStatsAndConfessions(): Promise<{
  stats: { confessionsCount: number; reactionsReceived: number; activeChatsCount: number };
  confessions: PublicConfession[];
}> {
  const empty = { stats: { confessionsCount: 0, reactionsReceived: 0, activeChatsCount: 0 }, confessions: [] };
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return empty;

    let admin: any;
    try { admin = createAdminClient(); } catch { admin = supabase; }

    // Fire confessions + chats count in ONE round
    const [confessionsResult, chatsResult] = await Promise.all([
      admin.from('confessions')
        .select('id, public_code, content, image_path, recipient_gender, target_batch, target_department, snapshot_gender, poll_options, created_at, categories(name, slug, icon)', { count: 'exact' })
        .eq('author_id', user.id).eq('is_deleted', false).order('created_at', { ascending: false }),
      admin.from('anonymous_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(`creator_id.eq.${user.id},participant_id.eq.${user.id}`)
        .then((r: any) => r).catch(() => ({ count: 0 })),
    ]);

    const confessionRows = confessionsResult.data || [];
    const confessionsCount = confessionsResult.count || 0;
    const confessionIds = confessionRows.map((row: any) => row.id);
    const activeChatsCount = chatsResult.count || 0;

    let reactionsReceived = 0;
    const reactionCountsByConfession = new Map<string, { relatable: number; funny: number; support: number; interesting: number }>();
    const commentCountsByConfession = new Map<string, number>();

    if (confessionIds.length > 0) {
      // Fire reactions + comments in parallel
      const [reactionsResult, commentsResult] = await Promise.all([
        admin.from('reactions').select('confession_id, reaction_type', { count: 'exact' }).in('confession_id', confessionIds),
        admin.from('comments').select('confession_id').in('confession_id', confessionIds).eq('is_deleted', false),
      ]);

      reactionsReceived = reactionsResult.count || 0;
      for (const r of reactionsResult.data || []) {
        const c = reactionCountsByConfession.get(r.confession_id) || { relatable: 0, funny: 0, support: 0, interesting: 0 };
        if (r.reaction_type in c) { c[r.reaction_type as keyof typeof c]++; }
        reactionCountsByConfession.set(r.confession_id, c);
      }
      for (const c of commentsResult.data || []) {
        commentCountsByConfession.set(c.confession_id, (commentCountsByConfession.get(c.confession_id) || 0) + 1);
      }
    }

    const confessions = confessionRows.map((row: any) => {
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      return {
        id: row.id, public_code: row.public_code, content: row.content,
        category_name: cat?.name || 'Confession', category_slug: cat?.slug || 'confession',
        category_icon: cat?.icon || '🔒', image_path: row.image_path || null,
        recipient_gender: row.recipient_gender || null, target_batch: row.target_batch || null,
        target_department: row.target_department || null, gender: row.snapshot_gender || 'Male',
        poll_data: row.poll_options || null, created_at: row.created_at,
        reaction_counts: reactionCountsByConfession.get(row.id) || { relatable: 0, funny: 0, support: 0, interesting: 0 },
        comment_count: commentCountsByConfession.get(row.id) || 0,
        is_mine: true, can_edit: true,
      } satisfies PublicConfession;
    });

    return {
      stats: { confessionsCount, reactionsReceived, activeChatsCount },
      confessions,
    };
  } catch (err: any) {
    console.warn('getMyStatsAndConfessions note:', err);
    return empty;
  }
}

// ── LEGACY: Combined (kept for backward compat, calls split functions in parallel) ──
export async function getMyProfileSummary() {
  const [profile, data] = await Promise.all([
    getMyProfile(),
    getMyStatsAndConfessions(),
  ]);
  return { profile, ...data };
}

// ── USERNAME: Save/claim username to DB (synced across all devices) ──
export async function saveUsernameAction(newUsername: string): Promise<{
  success: boolean;
  username?: string;
  message: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'You must be signed in.' };
    }

    const clean = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters (letters, numbers, underscores).' };
    }
    if (clean.length > 30) {
      return { success: false, message: 'Username must be 30 characters or fewer.' };
    }

    let admin: any;
    try { admin = createAdminClient(); } catch { admin = supabase; }

    // Check if this username is already taken by someone else
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('username', clean)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return { success: false, message: `@${clean} is already taken. Try another handle.` };
    }

    // Save to DB
    const { error } = await admin
      .from('profiles')
      .update({ username: clean, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      // Unique constraint violation
      if (error.code === '23505') {
        return { success: false, message: `@${clean} is already taken. Try another handle.` };
      }
      console.warn('saveUsernameAction DB error:', error);
      return { success: false, message: 'Failed to save username. Please try again.' };
    }

    return { success: true, username: clean, message: `Handle @${clean} claimed successfully!` };
  } catch (err: any) {
    console.warn('saveUsernameAction catch:', err);
    return { success: false, message: 'An error occurred. Please try again.' };
  }
}
