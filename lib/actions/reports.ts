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

  // Look the confession up via the admin (service-role) client: direct SELECT on
  // confessions is revoked for the anon/authenticated role, and the public view
  // intentionally does not expose author identity. This server action is the
  // trusted path, so it is safe to resolve author_id here.
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  const { data: confession } = await admin
    .from('confessions')
    .select('id, author_id')
    .eq('public_code', data.confession_code)
    .maybeSingle();

  if (!confession) {
    throw new Error('Confession not found');
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      confession_id: confession.id,
      reported_user_id: confession.author_id,
      reason: data.reason.trim().slice(0, 100),
      details: data.details?.trim() || null,
    });

  if (error) {
    throw new Error('Failed to submit report');
  }

  return { success: true };
}
