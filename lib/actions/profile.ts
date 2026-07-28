'use server';

import { createClient } from '@/lib/supabase/server';
import { Gender } from '@/lib/types';

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
