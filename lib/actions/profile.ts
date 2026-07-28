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

export async function createVerifiedStudentAccount() {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();

    const rand = Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4);
    const email = `student_${rand}@unsaid.campus`;
    const password = `StudentPass_${rand}!`;

    const { data: { user }, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !user) {
      throw new Error(error?.message || 'Failed to create verified student account');
    }

    return {
      success: true,
      email,
      password,
    };
  } catch (err: any) {
    console.error('Failed to create verified student account:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}
