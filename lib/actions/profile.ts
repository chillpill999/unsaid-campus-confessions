'use server';

import { createClient } from '@/lib/supabase/server';
import { Gender, PublicConfession, UserProfile } from '@/lib/types';

export async function createProfile(data: {
  gender: Gender;
  batch: string;
  department: string;
  college_id: string;
}) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
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
    throw new Error('Failed to create profile');
  }

  return { success: true, existing: false };
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
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  const { data: profileRow } = await admin
    .from('profiles')
    .select('*, colleges(name)')
    .eq('id', user.id)
    .maybeSingle();

  const { data: confessionRows, count: confessionsCount } = await admin
    .from('confessions')
    .select('id, public_code, content, image_path, recipient_gender, target_batch, target_department, snapshot_gender, poll_options, created_at, categories(name, slug, icon)', { count: 'exact' })
    .eq('author_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  const confessionIds = (confessionRows || []).map((row: any) => row.id);
  let reactionsReceived = 0;
  const reactionCountsByConfession = new Map<string, {
    relatable: number;
    funny: number;
    support: number;
    interesting: number;
  }>();
  const commentCountsByConfession = new Map<string, number>();

  if (confessionIds.length > 0) {
    const { data: reactionRows, count } = await admin
      .from('reactions')
      .select('confession_id, reaction_type', { count: 'exact' })
      .in('confession_id', confessionIds);

    reactionsReceived = count || 0;

    for (const reaction of reactionRows || []) {
      const counts = reactionCountsByConfession.get(reaction.confession_id) || {
        relatable: 0,
        funny: 0,
        support: 0,
        interesting: 0,
      };
      if (reaction.reaction_type in counts) {
        counts[reaction.reaction_type as keyof typeof counts]++;
      }
      reactionCountsByConfession.set(reaction.confession_id, counts);
    }

    const { data: commentRows } = await admin
      .from('comments')
      .select('confession_id')
      .in('confession_id', confessionIds)
      .eq('is_deleted', false);

    for (const comment of commentRows || []) {
      commentCountsByConfession.set(
        comment.confession_id,
        (commentCountsByConfession.get(comment.confession_id) || 0) + 1
      );
    }
  }

  const { count: activeChatsCount } = await admin
    .from('anonymous_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .or(`creator_id.eq.${user.id},participant_id.eq.${user.id}`);

  const confessions = (confessionRows || []).map((row: any) => {
    const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;

    return {
      id: row.id,
      public_code: row.public_code,
      content: row.content,
      category_name: category?.name || 'Confession',
      category_slug: category?.slug || 'confession',
      category_icon: category?.icon || 'Lock',
      image_path: row.image_path || null,
      recipient_gender: row.recipient_gender || null,
      target_batch: row.target_batch || null,
      target_department: row.target_department || null,
      gender: row.snapshot_gender,
      poll_data: row.poll_options || null,
      created_at: row.created_at,
      reaction_counts: reactionCountsByConfession.get(row.id) || {
        relatable: 0,
        funny: 0,
        support: 0,
        interesting: 0,
      },
      comment_count: commentCountsByConfession.get(row.id) || 0,
      is_mine: true,
      can_edit: true,
    } satisfies PublicConfession;
  });

  return {
    profile: profileRow
      ? {
          id: profileRow.id,
          full_name: 'Student User',
          gender: profileRow.gender,
          college_id: profileRow.college_id,
          college_name: profileRow.colleges?.name || 'Loknayak Jai Prakash Institute of Technology',
          batch: profileRow.batch,
          department: profileRow.department,
          role: profileRow.role,
          account_status: profileRow.account_status,
          created_at: profileRow.created_at,
        }
      : null,
    stats: {
      confessionsCount: confessionsCount || 0,
      reactionsReceived,
      activeChatsCount: activeChatsCount || 0,
    },
    confessions,
  };
}
