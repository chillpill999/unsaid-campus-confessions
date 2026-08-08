'use server';

import { createClient } from '@/lib/supabase/server';
import { generatePublicCode } from '@/lib/utils';
import { Gender } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limit';

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
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to post a confession.' };
    }

    const { data: statusProfile } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', user.id)
      .maybeSingle();

    if (statusProfile && (statusProfile.account_status === 'banned' || statusProfile.account_status === 'suspended')) {
      return { success: false, error: 'Your account is not allowed to post.' };
    }

    const rate = checkRateLimit(`confess:${user.id}`, 10, 60 * 60 * 1000);
    if (!rate.success) {
      return { success: false, error: 'You are posting too fast. Please try again later.' };
    }

    if (!data.content.trim() || data.content.length > 1000) {
      return { success: false, error: 'Confession must be between 1 and 1000 characters.' };
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
          { id: 'c1000000-0000-0000-0000-000000000001', name: 'Confession', slug: 'confession', icon: '🔒', active: true },
          { id: 'c1000000-0000-0000-0000-000000000002', name: 'Crush', slug: 'crush', icon: '❤️', active: true },
          { id: 'c1000000-0000-0000-0000-000000000003', name: 'Funny', slug: 'funny', icon: '😂', active: true },
          { id: 'c1000000-0000-0000-0000-000000000004', name: 'Hostel', slug: 'hostel', icon: '🏠', active: true },
          { id: 'c1000000-0000-0000-0000-000000000005', name: 'Appreciation', slug: 'appreciation', icon: '✨', active: true },
          { id: 'c1000000-0000-0000-0000-000000000006', name: 'Question', slug: 'question', icon: '❓', active: true },
          { id: 'c1000000-0000-0000-0000-000000000007', name: 'Campus Life', slug: 'campus-life', icon: '🧭', active: true }
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

    const categoryId = category?.id || 'c1000000-0000-0000-0000-000000000001';

    const { error } = await supabase
      .from('confessions')
      .insert({
        author_id: user.id,
        public_code: publicCode,
        content: data.content.trim(),
        category_id: categoryId,
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
      return { success: false, error: 'Database insert error: ' + error.message };
    }

    return {
      success: true,
      public_code: publicCode,
    };
  } catch (err: any) {
    console.error('Server action error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
