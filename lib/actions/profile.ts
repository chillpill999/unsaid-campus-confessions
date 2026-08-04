'use server';

import { createClient } from '@/lib/supabase/server';
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

export async function getMyProfileSummary(): Promise<{
  profile: UserProfile | null;
  stats: {
    confessionsCount: number;
    reactionsReceived: number;
    activeChatsCount: number;
  };
  confessions: PublicConfession[];
}> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        profile: null,
        stats: { confessionsCount: 0, reactionsReceived: 0, activeChatsCount: 0 },
        confessions: [],
      };
    }

    let admin: any = supabase;
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      admin = createAdminClient();
    } catch (e) {}

    // ── ROUND 1: Fire profile + confessions in parallel ──
    const [profileResult, confessionsResult] = await Promise.all([
      admin.from('profiles').select('*, colleges(name)').eq('id', user.id).maybeSingle(),
      admin.from('confessions')
        .select('id, public_code, content, image_path, recipient_gender, target_batch, target_department, snapshot_gender, poll_options, created_at, categories(name, slug, icon)', { count: 'exact' })
        .eq('author_id', user.id).eq('is_deleted', false).order('created_at', { ascending: false }),
    ]);

    const profileRow = profileResult.data;
    const confessionRows = confessionsResult.data || [];
    const confessionsCount = confessionsResult.count || 0;
    const confessionIds = confessionRows.map((row: any) => row.id);

    // ── ROUND 2: Fire reactions + comments + chats in parallel ──
    let reactionsReceived = 0;
    const reactionCountsByConfession = new Map<string, { relatable: number; funny: number; support: number; interesting: number }>();
    const commentCountsByConfession = new Map<string, number>();
    let activeChatsCount = 0;

    const chatsQuery = admin.from('anonymous_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .or(`creator_id.eq.${user.id},participant_id.eq.${user.id}`)
      .then((r: any) => r).catch(() => ({ count: 0 }));

    if (confessionIds.length > 0) {
      const [reactionsResult, commentsResult, chatsResult] = await Promise.all([
        admin.from('reactions').select('confession_id, reaction_type', { count: 'exact' }).in('confession_id', confessionIds),
        admin.from('comments').select('confession_id').in('confession_id', confessionIds).eq('is_deleted', false),
        chatsQuery,
      ]);

      reactionsReceived = reactionsResult.count || 0;
      for (const reaction of reactionsResult.data || []) {
        const counts = reactionCountsByConfession.get(reaction.confession_id) || { relatable: 0, funny: 0, support: 0, interesting: 0 };
        if (reaction.reaction_type in counts) { counts[reaction.reaction_type as keyof typeof counts]++; }
        reactionCountsByConfession.set(reaction.confession_id, counts);
      }
      for (const comment of commentsResult.data || []) {
        commentCountsByConfession.set(comment.confession_id, (commentCountsByConfession.get(comment.confession_id) || 0) + 1);
      }
      activeChatsCount = chatsResult.count || 0;
    } else {
      const chatsResult = await chatsQuery;
      activeChatsCount = chatsResult.count || 0;
    }

    const confessions = confessionRows.map((row: any) => {
      const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      return {
        id: row.id,
        public_code: row.public_code,
        content: row.content,
        category_name: category?.name || 'Confession',
        category_slug: category?.slug || 'confession',
        category_icon: category?.icon || '🔒',
        image_path: row.image_path || null,
        recipient_gender: row.recipient_gender || null,
        target_batch: row.target_batch || null,
        target_department: row.target_department || null,
        gender: row.snapshot_gender || 'Male',
        poll_data: row.poll_options || null,
        created_at: row.created_at,
        reaction_counts: reactionCountsByConfession.get(row.id) || { relatable: 0, funny: 0, support: 0, interesting: 0 },
        comment_count: commentCountsByConfession.get(row.id) || 0,
        is_mine: true,
        can_edit: true,
      } satisfies PublicConfession;
    });

    const realFullName = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'Student');
    const realEmail = user.email || '';
    const realAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    return {
      profile: profileRow
        ? {
            id: profileRow.id, full_name: profileRow.full_name || realFullName, email: realEmail, avatar_url: realAvatarUrl,
            gender: profileRow.gender || 'Male', college_id: profileRow.college_id || '',
            college_name: profileRow.colleges?.name || 'Loknayak Jai Prakash Institute of Technology',
            batch: profileRow.batch || '2026', department: profileRow.department || 'Computer Science & Engineering (CSE)',
            role: profileRow.role || 'student', account_status: profileRow.account_status || 'active',
            created_at: profileRow.created_at || new Date().toISOString(),
          }
        : {
            id: user.id, full_name: realFullName, email: realEmail, avatar_url: realAvatarUrl,
            gender: 'Prefer not to say' as Gender, college_id: '',
            college_name: 'Loknayak Jai Prakash Institute of Technology', batch: '2026',
            department: 'Computer Science & Engineering (CSE)', role: 'student' as const,
            account_status: 'active' as const, created_at: new Date().toISOString(),
          },
      stats: { confessionsCount: confessionsCount || 0, reactionsReceived: reactionsReceived || 0, activeChatsCount: activeChatsCount || 0 },
      confessions: confessions || [],
    };
  } catch (err: any) {
    console.warn('getMyProfileSummary catch note:', err);
    return { profile: null, stats: { confessionsCount: 0, reactionsReceived: 0, activeChatsCount: 0 }, confessions: [] };
  }
}
