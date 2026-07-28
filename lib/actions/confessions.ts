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

  // Query profile details using maybeSingle to avoid crashes if onboarding was skipped/not synced yet
  const { data: profile } = await supabase
    .from('profiles')
    .select('gender, batch, department')
    .eq('id', user.id)
    .maybeSingle();

  // Retrieve category
  let { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', data.category_slug)
    .maybeSingle();

  // Auto-seed categories and colleges if empty
  if (!category) {
    try {
      const { data: cols } = await supabase.from('colleges').select('id').limit(1);
      if (!cols || cols.length === 0) {
        await supabase.from('colleges').insert({
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Loknayak Jai Prakash Institute of Technology',
          short_name: 'LNJPIT',
          email_domain: 'lnjpit.ac.in',
          location: 'Chhapra, Bihar'
        });
      }

      await supabase.from('categories').insert([
        { id: 'c1000000-0000-0000-0000-000000000001', name: 'Confession', slug: 'confession', icon: 'lock', active: true },
        { id: 'c1000000-0000-0000-0000-000000000002', name: 'Crush', slug: 'crush', icon: 'heart', active: true },
        { id: 'c1000000-0000-0000-0000-000000000003', name: 'Funny', slug: 'funny', icon: 'laugh', active: true },
        { id: 'c1000000-0000-0000-0000-000000000004', name: 'Hostel', slug: 'hostel', icon: 'home', active: true },
        { id: 'c1000000-0000-0000-0000-000000000005', name: 'Appreciation', slug: 'appreciation', icon: 'sparkles', active: true },
        { id: 'c1000000-0000-0000-0000-000000000006', name: 'Question', slug: 'question', icon: 'help-circle', active: true },
        { id: 'c1000000-0000-0000-0000-000000000007', name: 'Campus Life', slug: 'campus-life', icon: 'compass', active: true }
      ]);

      const { data: newCat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', data.category_slug)
        .maybeSingle();
      
      category = newCat;
    } catch (seedErr) {
      console.error('Failed to auto-seed database:', seedErr);
    }
  }

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
      snapshot_gender: data.gender || profile?.gender || 'Male',
      snapshot_batch: profile?.batch || '2026',
      snapshot_department: profile?.department || null,
      recipient_gender: data.recipient_gender || null,
      target_batch: data.target_batch || null,
      target_department: data.target_department || null,
      poll_options: data.poll_data || null,
    });

  if (error) {
    console.error('Failed to insert confession:', error);
    throw new Error('Failed to create confession');
  }

  return {
    success: true,
    public_code: publicCode,
  };
}
