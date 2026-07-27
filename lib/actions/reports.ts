'use server';

import { createClient } from '@/lib/supabase/server';

export async function submitReport(data: {
  confession_code: string;
  reason: string;
  details?: string;
}) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  if (!data.reason || typeof data.reason !== 'string' || !data.reason.trim()) {
    throw new Error('A reason is required for reporting');
  }

  const { data: confession } = await supabase
    .from('confessions')
    .select('id, author_id')
    .eq('public_code', data.confession_code)
    .single();

  if (!confession) {
    throw new Error('Confession not found');
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      confession_id: confession.id,
      reported_user_id: confession.author_id,
      reason: data.reason.trim(),
      details: data.details?.trim() || null,
    });

  if (error) {
    throw new Error('Failed to submit report');
  }

  return { success: true };
}
