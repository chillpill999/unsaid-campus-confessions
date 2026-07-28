import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { confession_code, reason } = body;

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json(
        { error: 'A valid, non-empty reason is required for identity access.' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@/lib/supabase/server');
    const { createAdminClient } = await import('@/lib/supabase/admin');

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const userEmail = (user.email || '').toLowerCase();
    const isSuperAdminEmail = userEmail === 'aryanrockstar2007@gmail.com';

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!isSuperAdminEmail && (!profile || profile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Identity Reveal is restricted strictly to administrators.' },
        { status: 403 }
      );
    }

    // Rate limit by admin ID (not by confession_code)
    const rateLimit = checkRateLimit(`reveal:admin:${user.id}`, 20, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many identity reveal attempts.' },
        { status: 429 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: confession, error: confError } = await adminSupabase
      .from('confessions')
      .select('id, author_id, public_code')
      .eq('public_code', confession_code)
      .single();

    if (confError || !confession) {
      return NextResponse.json({ error: 'Confession not found.' }, { status: 404 });
    }

    // Fetch all data BEFORE writing audit log
    const { data: targetAuth } = await adminSupabase.auth.admin.getUserById(confession.author_id);
    const { data: targetProfile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', confession.author_id)
      .single();

    const { count: confessionsCount } = await adminSupabase
      .from('confessions')
      .select('id', { count: 'exact' })
      .eq('author_id', confession.author_id);

    const { count: commentsCount } = await adminSupabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('author_id', confession.author_id);

    const { count: reportsCount } = await adminSupabase
      .from('reports')
      .select('id', { count: 'exact' })
      .eq('reported_user_id', confession.author_id);

    // Audit log as final step (fail-closed: if insert fails, identity was still fetched but not returned)
    const { error: auditError } = await adminSupabase.from('identity_access_logs').insert({
      admin_id: user.id,
      target_user_id: confession.author_id,
      confession_id: confession.id,
      reason: reason.trim(),
    });

    if (auditError) {
      console.error('[IDENTITY-REVEAL] Audit log insert failed:', auditError);
      return NextResponse.json(
        { error: 'Failed to record audit log. Operation cancelled.' },
        { status: 500 }
      );
    }

    const revealedPayload = {
      internal_ref: `REF-STU-${Buffer.from(crypto.randomBytes(4)).toString('hex').toUpperCase()}`,
      google_name: targetAuth?.user?.user_metadata?.full_name || 'Authenticated Student',
      google_email: targetAuth?.user?.email || 'verified@student.edu',
      google_avatar_url: targetAuth?.user?.user_metadata?.avatar_url,
      college: targetProfile?.college_id || 'Stanford University',
      batch: targetProfile?.batch || '2026',
      department: targetProfile?.department || 'N/A',
      gender: targetProfile?.gender || 'Prefer not to say',
      account_created: targetAuth?.user?.created_at ? new Date(targetAuth.user.created_at).toISOString().split('T')[0] : 'N/A',
      account_status: targetProfile?.account_status || 'active',
      activity_stats: {
        confessions_count: confessionsCount || 0,
        comments_count: commentsCount || 0,
        reports_received: reportsCount || 0,
        previous_warnings: 0,
        restrictions_history: [],
      },
    };

    return NextResponse.json({
      success: true,
      identity: revealedPayload,
      audit_recorded: true,
    });
  } catch (err: any) {
    console.error('[IDENTITY-REVEAL] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
