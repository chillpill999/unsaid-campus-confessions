import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { generatePublicCode } from '@/lib/utils';
import { PublicConfession } from '@/lib/types';
import { broadcastConfessionEvent } from '@/lib/realtime/broadcast';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');

    // ---------------- SINGLE CONFESSION DETAIL LOOKUP BY CODE ----------------
    if (code) {
      const cleanCode = code.trim().replace(/^#/, '').toUpperCase();

      // 1. Try public_confessions view
      const { data: singleView } = await supabase
        .from('public_confessions')
        .select('*')
        .or(`public_code.ilike.${cleanCode},id.eq.${code.trim()}`)
        .maybeSingle();

      let targetConfession: PublicConfession | null = null;

      if (singleView) {
        targetConfession = {
          id: singleView.id,
          public_code: singleView.public_code || singleView.id.slice(0, 6).toUpperCase(),
          content: singleView.content,
          category_name: singleView.category_name || 'Confession',
          category_slug: singleView.category_slug || 'confession',
          category_icon: singleView.category_icon || '🔒',
          image_path: singleView.image_path || null,
          gender: singleView.gender || 'Male',
          recipient_gender: singleView.recipient_gender || null,
          target_batch: singleView.target_batch || null,
          target_department: singleView.target_department || null,
          created_at: singleView.created_at,
          reaction_counts: singleView.reaction_counts || { relatable: 0, funny: 0, support: 0, interesting: 0 },
          comment_count: singleView.comment_count || 0,
          poll_data: singleView.poll_options || null,
        };
      } else {
        // 2. Try raw confessions table with admin client fallback
        const { createAdminClient } = await import('@/lib/supabase/admin');
        let activeClient: any = supabase;
        try {
          activeClient = createAdminClient();
        } catch {}

        const { data: singleRaw } = await activeClient
          .from('confessions')
          .select('*')
          .or(`public_code.ilike.${cleanCode},id.eq.${code.trim()}`)
          .maybeSingle();

        if (singleRaw) {
          targetConfession = {
            id: singleRaw.id,
            public_code: singleRaw.public_code || singleRaw.id.slice(0, 6).toUpperCase(),
            content: singleRaw.content,
            category_name: singleRaw.category_name || 'Confession',
            category_slug: singleRaw.category_slug || 'confession',
            category_icon: singleRaw.category_icon || '🔒',
            image_path: singleRaw.image_path || null,
            gender: singleRaw.snapshot_gender || singleRaw.gender || 'Male',
            recipient_gender: singleRaw.recipient_gender || null,
            target_batch: singleRaw.target_batch || null,
            target_department: singleRaw.target_department || null,
            created_at: singleRaw.created_at,
            reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
            comment_count: 0,
            poll_data: singleRaw.poll_options || null,
          };
        }
      }

      // Fetch comments if targetConfession found
      let commentsList: any[] = [];
      if (targetConfession) {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('confession_id', targetConfession.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (commentsData) {
          commentsList = commentsData.map((c: any) => ({
            id: c.id,
            confession_id: c.confession_id,
            content: c.content,
            anonymous_label: c.anonymous_label || 'Anonymous Student',
            gender: c.gender || 'Prefer not to say',
            created_at: c.created_at,
          }));
        }
      }

      if (targetConfession) {
        return NextResponse.json({
          success: true,
          confession: targetConfession,
          comments: commentsList,
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Confession not found' },
          { status: 404 }
        );
      }
    }

    let dbConfessions: PublicConfession[] = [];
    let hasMore = false;
    let nextCursor: string | null = null;

    // 1. Query safe public_confessions view from Supabase PostgreSQL with cursor pagination
    let query = supabase
      .from('public_confessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: viewData, error: viewError } = await query;

    if (!viewError && viewData) {
      hasMore = viewData.length > limit;
      const pageRows = hasMore ? viewData.slice(0, limit) : viewData;

      dbConfessions = pageRows.map((row: any) => ({
        id: row.id,
        public_code: row.public_code || row.id.slice(0, 6).toUpperCase(),
        content: row.content,
        category_name: row.category_name || 'Confession',
        category_slug: row.category_slug || 'confession',
        category_icon: row.category_icon || '🔒',
        image_path: row.image_path || null,
        gender: row.gender || 'Male',
        recipient_gender: row.recipient_gender || null,
        target_batch: row.target_batch || null,
        target_department: row.target_department || null,
        created_at: row.created_at,
        reaction_counts: row.reaction_counts || { relatable: 0, funny: 0, support: 0, interesting: 0 },
        comment_count: row.comment_count || 0,
        poll_data: row.poll_options || null,
      }));
    } else {
      // 2. Direct query fallback on confessions table
      let rawQuery = supabase
        .from('confessions')
        .select('*')
        .eq('moderation_status', 'approved')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (cursor) {
        rawQuery = rawQuery.lt('created_at', cursor);
      }

      const { data: rawData, error: rawError } = await rawQuery;

      if (rawError) {
        console.error('GET /api/confessions DB error:', rawError);
        return NextResponse.json(
          { success: false, error: 'Database query error: ' + rawError.message },
          { status: 500 }
        );
      }

      if (rawData) {
        hasMore = rawData.length > limit;
        const pageRows = hasMore ? rawData.slice(0, limit) : rawData;

        dbConfessions = pageRows.map((row: any) => ({
          id: row.id,
          public_code: row.public_code || row.id.slice(0, 6).toUpperCase(),
          content: row.content,
          category_name: row.category_name || 'Confession',
          category_slug: row.category_slug || 'confession',
          category_icon: row.category_icon || '🔒',
          image_path: row.image_path || null,
          gender: row.snapshot_gender || row.gender || 'Male',
          recipient_gender: row.recipient_gender || null,
          target_batch: row.target_batch || null,
          target_department: row.target_department || null,
          created_at: row.created_at,
          reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
          comment_count: 0,
          poll_data: row.poll_options || null,
        }));
      }
    }

    nextCursor = dbConfessions.length > 0 ? dbConfessions[dbConfessions.length - 1].created_at : null;

    return NextResponse.json({ success: true, confessions: dbConfessions, nextCursor, hasMore });
  } catch (err: any) {
    console.error('GET /api/confessions catch:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      category_slug = 'confession',
      category_name = 'Confession',
      category_icon = '🔒',
      gender = 'Male',
      recipient_gender,
      target_batch,
      target_department,
      poll_data,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Content cannot be empty' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to publish a confession.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Block banned/suspended accounts at the API layer (middleware only guards
    // page routes, not /api/*).
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && (profile.account_status === 'banned' || profile.account_status === 'suspended')) {
      return NextResponse.json(
        { success: false, error: 'Your account is not allowed to post.' },
        { status: 403 }
      );
    }

    // Lightweight per-user throttle on publishing.
    const { checkRateLimit } = await import('@/lib/rate-limit');
    const rate = checkRateLimit(`confess:${userId}`, 10, 60 * 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: 'You are posting too fast. Please try again later.' },
        { status: 429 }
      );
    }

    // Use admin client for DB mutations — the server-side API route is trusted,
    // and the anon-key server client loses session context in Next.js API routes,
    // causing "permission denied" errors.
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const activeClient = createAdminClient();

    const publicCode = generatePublicCode();

    // 1. Resolve or Seed Category
    let { data: category } = await activeClient
      .from('categories')
      .select('id')
      .eq('slug', category_slug)
      .maybeSingle();

    if (!category) {
      const categoriesToSeed = [
        { id: 'c1000000-0000-0000-0000-000000000001', name: 'Confession', slug: 'confession', icon: '🔒', active: true },
        { id: 'c1000000-0000-0000-0000-000000000002', name: 'Crush', slug: 'crush', icon: '❤️', active: true },
        { id: 'c1000000-0000-0000-0000-000000000003', name: 'Funny', slug: 'funny', icon: '😂', active: true },
        { id: 'c1000000-0000-0000-0000-000000000004', name: 'Hostel', slug: 'hostel', icon: '🏠', active: true },
        { id: 'c1000000-0000-0000-0000-000000000005', name: 'Appreciation', slug: 'appreciation', icon: '✨', active: true },
        { id: 'c1000000-0000-0000-0000-000000000006', name: 'Question', slug: 'question', icon: '❓', active: true },
        { id: 'c1000000-0000-0000-0000-000000000007', name: 'Campus Life', slug: 'campus-life', icon: '🧭', active: true },
      ];
      await activeClient.from('categories').upsert(categoriesToSeed, { onConflict: 'slug' });
      const { data: recheck } = await activeClient.from('categories').select('id').eq('slug', category_slug).maybeSingle();
      category = recheck;
    }

    const categoryId = category?.id || 'c1000000-0000-0000-0000-000000000001';

    // 2. TRUE SUPABASE POSTGRESQL INSERT
    const { data: insertedRow, error: insertError } = await activeClient
      .from('confessions')
      .insert({
        author_id: userId,
        public_code: publicCode,
        content: content.trim(),
        category_id: categoryId,
        moderation_status: 'approved',
        snapshot_gender: gender || 'Male',
        snapshot_batch: '2026',
        snapshot_department: 'CSE',
        recipient_gender: recipient_gender || null,
        target_batch: target_batch || null,
        target_department: target_department || null,
        poll_options: poll_data || null,
      })
      .select('id, public_code, created_at')
      .single();

    if (insertError || !insertedRow) {
      console.error('Supabase DB Insert Error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Database insert failed: ' + (insertError?.message || 'Unknown DB error') },
        { status: 500 }
      );
    }

    const createdConfession: PublicConfession = {
      id: insertedRow.id,
      public_code: insertedRow.public_code,
      content: content.trim(),
      category_name: category_name,
      category_slug: category_slug,
      category_icon: category_icon,
      gender: gender || 'Male',
      recipient_gender: recipient_gender || null,
      target_batch: target_batch || null,
      target_department: target_department || null,
      created_at: insertedRow.created_at,
      reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
      comment_count: 0,
      poll_data: poll_data || null,
      is_mine: true,
    };

    // Trigger Realtime broadcast to all open feeds
    broadcastConfessionEvent('posted', publicCode);

    return NextResponse.json({ success: true, confession: createdConfession });
  } catch (err: any) {
    console.error('POST /api/confessions catch:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
