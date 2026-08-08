import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { broadcastCommentUpdate } from '@/lib/realtime/broadcast';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'You must be signed in to post comments.' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && (profile.account_status === 'banned' || profile.account_status === 'suspended')) {
      return NextResponse.json(
        { success: false, error: 'Your account is not allowed to comment.' },
        { status: 403 }
      );
    }

    const rate = checkRateLimit(`comment:${user.id}`, 30, 60 * 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: 'You are commenting too fast. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const confession_id = body?.confession_id;
    const content = (body?.content || '').trim();
    const parent_comment_id = body?.parent_comment_id || null;

    if (!confession_id || !content) {
      return NextResponse.json(
        { success: false, error: 'Confession ID and comment content are required.' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comment must be 500 characters or fewer.' },
        { status: 400 }
      );
    }

    let admin: any;
    try {
      admin = createAdminClient();
    } catch {
      admin = supabase;
    }

    // 1. Insert raw comment record
    const { data: inserted, error: insertError } = await admin
      .from('comments')
      .insert({
        confession_id,
        author_id: user.id,
        parent_comment_id,
        content,
      })
      .select('id, confession_id, content, created_at')
      .single();

    if (insertError || !inserted) {
      console.error('Comment insertion DB error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to post comment. Please try again.' },
        { status: 500 }
      );
    }

    // 2. Fetch thread-scoped anonymous comment from safe public_comments view
    const { data: publicComment } = await supabase
      .from('public_comments')
      .select('id, confession_id, parent_comment_id, content, anonymous_label, gender, created_at')
      .eq('id', inserted.id)
      .maybeSingle();

    const finalComment = publicComment || {
      id: inserted.id,
      confession_id: inserted.confession_id,
      parent_comment_id: parent_comment_id,
      content: inserted.content,
      anonymous_label: 'Anonymous Student',
      gender: 'Prefer not to say',
      created_at: inserted.created_at,
    };

    // 3. Count total comments for confession and trigger realtime broadcast
    const { count } = await admin
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('confession_id', confession_id)
      .eq('is_deleted', false);

    const freshCommentCount = count || 1;

    // Fetch public_code to trigger broadcast
    const { data: conf } = await admin
      .from('confessions')
      .select('public_code')
      .eq('id', confession_id)
      .maybeSingle();

    if (conf?.public_code) {
      broadcastCommentUpdate(conf.public_code, freshCommentCount).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      comment: finalComment,
      comment_count: freshCommentCount,
    });
  } catch (err: any) {
    console.error('POST /api/confessions/comments error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
