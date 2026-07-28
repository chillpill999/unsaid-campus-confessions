import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { generatePublicCode } from '@/lib/utils';
import { PublicConfession } from '@/lib/types';
import { broadcastConfessionEvent } from '@/lib/realtime/broadcast';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor');

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

    // Acquire active client for DB insert
    let activeClient: any = supabase;
    let userId = user?.id;

    if (authError || !userId) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        activeClient = createAdminClient();
        // Generate anonymous guest user ID if session cookie absent
        userId = '00000000-0000-0000-0000-000000000000';
      } catch (adminErr) {
        return NextResponse.json(
          { success: false, error: 'You must be logged in to publish a confession.' },
          { status: 401 }
        );
      }
    }

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
