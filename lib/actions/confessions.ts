'use server';

import { createClient } from '@/lib/supabase/server';
import { generatePublicCode } from '@/lib/utils';
import { Gender } from '@/lib/types';

export async function createConfession(data: {
  content: string;
  category_slug: string;
  category_name: string;
  category_icon: string;
  gender: Gender;
  recipient_gender?: string | null;
  target_batch?: string | null;
  target_department?: string | null;
  poll_data?: any;
}) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (!data.content.trim() || data.content.length > 1000) {
    throw new Error('Confession must be between 1 and 1000 characters');
  }

  const publicCode = generatePublicCode();

  const { data: profile } = await supabase
    .from('profiles')
    .select('snapshot_gender, snapshot_batch, snapshot_department')
    .eq('id', user.id)
    .single();

  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', data.category_slug)
    .maybeSingle();

  if (!category) {
    throw new Error('Invalid category');
  }

  const { error } = await supabase
    .from('confessions')
    .insert({
      author_id: user.id,
      public_code: publicCode,
      content: data.content.trim(),
      category_id: category.id,
      moderation_status: 'approved',
      snapshot_gender: data.gender,
      snapshot_batch: profile?.snapshot_batch || '2026',
      snapshot_department: profile?.snapshot_department || null,
      recipient_gender: data.recipient_gender || null,
      target_batch: data.target_batch || null,
      target_department: data.target_department || null,
      poll_options: data.poll_data || null,
    });

  if (error) {
    throw new Error('Failed to create confession');
  }

  return {
    success: true,
    public_code: publicCode,
  };
}
