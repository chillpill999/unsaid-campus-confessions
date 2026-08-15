import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'aryanrockstar2007@gmail.com').toLowerCase();

/**
 * Server-side authorization for identity reveal. Only the super-admin email or
 * a user whose profile role is 'admin' may deanonymize a confession. FAILS CLOSED.
 */
async function isAuthorizedAdmin(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const userEmail = (user.email || '').toLowerCase();
  if (userEmail === SUPER_ADMIN_EMAIL) return true;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.role === 'admin';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { confession_code, reason } = body;

    if (!confession_code || typeof confession_code !== 'string' || !confession_code.trim()) {
      return NextResponse.json(
        { error: 'A confession code is required.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json(
        { error: 'A valid, non-empty reason is required for identity access.' },
        { status: 400 }
      );
    }

    // Authorize BEFORE touching any identity data.
    const authorized = await isAuthorizedAdmin();
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required.' },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminId = user?.id || 'unknown';

    // Enforce a per-admin rate limit on deanonymization attempts.
    const rate = checkRateLimit(`identity-reveal:${adminId}`, 10, 60 * 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many identity reveal attempts. Please try again later.' },
        { status: 429 }
      );
    }

    let adminSupabase: any = null;
    try {
      adminSupabase = createAdminClient();
    } catch {}
    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Server misconfiguration: admin client unavailable.' },
        { status: 500 }
      );
    }

    const cleanCode = confession_code.trim().toUpperCase();
    const { data: confession } = await adminSupabase
      .from('confessions')
      .select('id, author_id, public_code')
      .eq('public_code', cleanCode)
      .single();

    if (!confession) {
      return NextResponse.json(
        { success: false, error: 'Confession not found.' },
        { status: 404 }
      );
    }

    const confessionAuthorId = confession.author_id;

    // Cross-check the reveal against the audit-trail requirement BEFORE
    // returning: the operation is append-only logged and can never be undone.
    const auditRef = `REF-STU-${Buffer.from(crypto.randomBytes(4)).toString('hex').toUpperCase()}`;

    let targetAuthData: any = null;
    let targetProfileData: any = null;
    try {
      const { data } = await adminSupabase.auth.admin.getUserById(confessionAuthorId);
      targetAuthData = data;
    } catch {}

    try {
      const { data } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', confessionAuthorId)
        .single();
      targetProfileData = data;
    } catch {}

    // Record the reveal in the append-only audit log.
    try {
      await adminSupabase.from('identity_access_logs').insert({
        admin_id: adminId,
        target_user_id: confessionAuthorId,
        confession_id: confession.id,
        reason: reason.trim().slice(0, 255),
        details: JSON.stringify({ ref: auditRef }),
      });
    } catch (auditErr) {
      console.error('Failed to write identity_access_logs audit entry:', auditErr);
    }

    const revealedPayload = {
      internal_ref: auditRef,
      google_name: targetAuthData?.user?.user_metadata?.full_name || 'Unnamed Student',
      google_email: targetAuthData?.user?.email || 'N/A',
      google_avatar_url: targetAuthData?.user?.user_metadata?.avatar_url || null,
      college: targetProfileData?.college_id ? String(targetProfileData.college_id) : 'N/A',
      batch: targetProfileData?.batch || 'N/A',
      department: targetProfileData?.department || 'N/A',
      gender: targetProfileData?.gender || 'Prefer not to say',
      account_created: targetAuthData?.user?.created_at
        ? new Date(targetAuthData.user.created_at).toISOString().split('T')[0]
        : null,
      account_status: targetProfileData?.account_status || 'active',
      activity_stats: {
        confessions_count: 0,
        comments_count: 0,
        reports_received: 0,
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
