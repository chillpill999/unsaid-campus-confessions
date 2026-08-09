'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SUPER_ADMIN_EMAIL = 'aryanrockstar2007@gmail.com';

/**
 * Server-side admin authorization. This is the real security boundary for every
 * admin operation. It FAILS CLOSED: any missing session, DB error, or non-admin
 * role results in an Unauthorized error — never a silent grant.
 */
async function requireAdmin(): Promise<string> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: You must be signed in.');
  }

  const userEmail = (user.email || '').toLowerCase();

  if (userEmail === SUPER_ADMIN_EMAIL) {
    // The bootstrap super-admin is always allowed. Keep their profile flag
    // consistent so the client-side gate also recognizes them.
    try {
      const admin = createAdminClient();
      await admin.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    } catch {}
    return user.id;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin') {
    return user.id;
  }

  throw new Error('Unauthorized: Admin access required.');
}

/** Non-throwing wrapper used by the client AdminLayout to gate the UI. */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function adminFetchConfessions() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('confessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch confessions');
  return data;
}

export async function adminDeleteConfession(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('confessions').delete().eq('id', id);
  if (error) throw new Error('Failed to delete confession');
}

export async function adminFetchUsers() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from('profiles')
    .select('*, colleges(name)')
    .order('created_at', { ascending: false });

  let allAuthUsers: any[] = [];
  try {
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ page, perPage });
      if (authErr || !authData || !authData.users || authData.users.length === 0) {
        break;
      }
      allAuthUsers.push(...authData.users);
      if (authData.users.length < perPage) {
        break;
      }
      page++;
    }
  } catch (err) {
    console.warn('listUsers admin fetch note:', err);
  }

  const authUsersMap = new Map(allAuthUsers.map((u: any) => [u.id, u]));
  const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const allUserIds = Array.from(new Set([...authUsersMap.keys(), ...profilesMap.keys()]));

  const mergedUsers = allUserIds.map((id) => {
    const u = authUsersMap.get(id);
    const p = profilesMap.get(id);

    const realEmail = u?.email || p?.email || 'N/A';

    const metadataName =
      u?.user_metadata?.full_name ||
      u?.user_metadata?.name ||
      (u?.user_metadata?.first_name
        ? `${u.user_metadata.first_name} ${u.user_metadata.last_name || ''}`.trim()
        : null);

    const fallbackName = realEmail !== 'N/A' ? realEmail.split('@')[0] : 'LNJPIT Student';
    const realFullName = p?.full_name || metadataName || fallbackName;

    const realAvatarUrl =
      p?.avatar_url || u?.user_metadata?.avatar_url || u?.user_metadata?.picture || null;

    const emailPrefix =
      realEmail !== 'N/A' ? realEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
    const defaultHandle = emailPrefix || `student_${id.slice(0, 6)}`;
    const username = p?.username || defaultHandle;

    const provider =
      u?.app_metadata?.provider || (u?.identities && u.identities[0]?.provider) || 'email';

    return {
      id,
      full_name: realFullName,
      email: realEmail,
      username,
      college_name: p?.colleges?.name || p?.college_name || 'Loknayak Jai Prakash Institute of Technology',
      batch: p?.batch || '2026',
      department: p?.department || 'Computer Science & Engineering (CSE)',
      gender: p?.gender || 'Prefer not to say',
      role: p?.role || (realEmail.toLowerCase().includes('aryanrockstar') ? 'admin' : 'student'),
      account_status: p?.account_status || 'active',
      avatar_url: realAvatarUrl,
      provider,
      last_sign_in_at: u?.last_sign_in_at || null,
      created_at: p?.created_at || u?.created_at || new Date().toISOString(),
    };
  });

  mergedUsers.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return mergedUsers;
}

export async function adminUpdateUserStatus(id: string, newStatus: 'active' | 'restricted' | 'suspended' | 'banned') {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('profiles')
      .update({ account_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error('Failed to update user status: ' + error.message);
  } else {
    const { error } = await admin
      .from('profiles')
      .insert({
        id,
        gender: 'Prefer not to say',
        batch: '2026',
        department: 'Computer Science & Engineering (CSE)',
        role: 'student',
        account_status: newStatus,
        updated_at: new Date().toISOString(),
      });

    if (error) throw new Error('Failed to update user status: ' + error.message);
  }
}

export async function adminFetchReports() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch reports');
  return data;
}

export async function adminUpdateReportStatus(id: string, newStatus: 'actioned' | 'dismissed') {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('reports')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) throw new Error('Failed to update report');
}

export async function adminFetchAuditLogs() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('identity_access_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch audit logs');
  return data;
}

export async function adminFetchStats() {
  await requireAdmin();
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  let authUserCount = 0;
  try {
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: authData, error: authErr } = await admin.auth.admin.listUsers({ page, perPage });
      if (authErr || !authData || !authData.users || authData.users.length === 0) {
        break;
      }
      authUserCount += authData.users.length;
      if (authData.users.length < perPage) {
        break;
      }
      page++;
    }
  } catch {}

  const { count: profilesCount } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const activeStudents = Math.max(authUserCount, profilesCount || 0);

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
    activeStudents,
    confessionsToday: confessionsCount || 0,
    commentsToday: commentsCount || 0,
    reportsPending: reportsCount || 0,
  };
}
