'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyAdmin(): Promise<string> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const userEmail = (user.email || '').toLowerCase();
  const isSuperAdminEmail = userEmail === 'aryanrockstar2007@gmail.com';

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, account_status')
    .eq('id', user.id)
    .single();

  if (isSuperAdminEmail && profile && profile.role !== 'admin') {
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    } catch {}
  }

  if (!isSuperAdminEmail && (!profile || profile.role !== 'admin')) {
    throw new Error('Forbidden');
  }

  if (profile && (profile.account_status === 'banned' || profile.account_status === 'suspended')) {
    throw new Error('Account restricted');
  }

  return user.id;
}

export async function adminFetchConfessions() {
  await verifyAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('confessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch confessions');
  return data;
}

export async function adminDeleteConfession(id: string) {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('confessions').delete().eq('id', id);
  if (error) throw new Error('Failed to delete confession');
}

export async function adminFetchUsers() {
  await verifyAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch users');
  return data;
}

export async function adminUpdateUserStatus(id: string, newStatus: 'active' | 'restricted' | 'suspended' | 'banned') {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('profiles')
    .update({ account_status: newStatus })
    .eq('id', id);

  if (error) throw new Error('Failed to update user status');
}

export async function adminFetchReports() {
  await verifyAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch reports');
  return data;
}

export async function adminUpdateReportStatus(id: string, newStatus: 'actioned' | 'dismissed') {
  await verifyAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('reports')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) throw new Error('Failed to update report');
}

export async function adminFetchAuditLogs() {
  await verifyAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('identity_access_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch audit logs');
  return data;
}

export async function adminFetchStats() {
  await verifyAdmin();
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const { count: studentsCount } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const { count: confessionsCount } = await admin
    .from('confessions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayISO);

  const { count: commentsCount } = await admin
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayISO);

  const { count: reportsCount } = await admin
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    activeStudents: studentsCount || 0,
    confessionsToday: confessionsCount || 0,
    commentsToday: commentsCount || 0,
    reportsPending: reportsCount || 0,
  };
}
