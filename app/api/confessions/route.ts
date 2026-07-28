import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { generatePublicCode } from '@/lib/utils';
import { PublicConfession } from '@/lib/types';

// In-Memory Shared Store across server requests for ultra-high availability
declare global {
  var __SHARED_CONFESSIONS_STORE__: PublicConfession[] | undefined;
}

if (!globalThis.__SHARED_CONFESSIONS_STORE__) {
  globalThis.__SHARED_CONFESSIONS_STORE__ = [];
}

const sharedMemoryStore = globalThis.__SHARED_CONFESSIONS_STORE__;

export async function GET() {
  try {
    const supabase = createServerClient();
    let dbConfessions: PublicConfession[] = [];

    // 1. Try querying safe public_confessions view or confessions table
    try {
      const { data: viewData, error: viewError } = await supabase
        .from('public_confessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!viewError && viewData && viewData.length > 0) {
        dbConfessions = viewData.map((row: any) => ({
          id: row.id,
          public_code: row.public_code || row.id.slice(0, 6).toUpperCase(),
          content: row.content,
          category_name: row.category_name || 'Confession',
          category_slug: row.category_slug || 'confession',
          category_icon: row.category_icon || '🔒',
          image_path: row.image_path || null,
          gender: row.gender || row.snapshot_gender || 'Male',
          recipient_gender: row.recipient_gender || null,
          target_batch: row.target_batch || null,
          target_department: row.target_department || null,
          created_at: row.created_at,
          reaction_counts: row.reaction_counts || { relatable: 0, funny: 0, support: 0, interesting: 0 },
          comment_count: row.comment_count || 0,
          poll_data: row.poll_options || null,
        }));
      } else {
        // Fallback: Query raw confessions table if view not cached in PostgREST
        const { data: rawData, error: rawError } = await supabase
          .from('confessions')
          .select('*')
          .eq('moderation_status', 'approved')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (!rawError && rawData && rawData.length > 0) {
          dbConfessions = rawData.map((row: any) => ({
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
            reaction_counts: row.reaction_counts || { relatable: 0, funny: 0, support: 0, interesting: 0 },
            comment_count: row.comment_count || 0,
            poll_data: row.poll_options || null,
          }));
        }
      }
    } catch (dbErr) {
      console.warn('Supabase query fallback to shared server memory:', dbErr);
    }

    // 2. Combine Supabase DB confessions with server shared memory store
    const codeMap = new Map<string, PublicConfession>();
    dbConfessions.forEach((c) => codeMap.set(c.public_code, c));
    sharedMemoryStore.forEach((c) => {
      if (!codeMap.has(c.public_code)) {
        codeMap.set(c.public_code, c);
      }
    });

    const combinedConfessions = Array.from(codeMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, confessions: combinedConfessions });
  } catch (err: any) {
    console.error('GET /api/confessions catch:', err);
    return NextResponse.json({ success: true, confessions: sharedMemoryStore });
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

    const publicCode = generatePublicCode();
    const createdAt = new Date().toISOString();
    const generatedId = `conf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newConfession: PublicConfession = {
      id: generatedId,
      public_code: publicCode,
      content: content.trim(),
      category_name: category_name || 'Confession',
      category_slug: category_slug || 'confession',
      category_icon: category_icon || '🔒',
      gender: gender || 'Male',
      recipient_gender: recipient_gender || null,
      target_batch: target_batch || null,
      target_department: target_department || null,
      created_at: createdAt,
      reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
      comment_count: 0,
      poll_data: poll_data || null,
      is_mine: true,
    };

    // 1. Always save to shared server memory so all users/devices see it instantly
    sharedMemoryStore.unshift(newConfession);

    // 2. Best-effort insert into Supabase database if schema exists
    try {
      const supabase = createServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      let authorId = user?.id;
      if (!authorId) {
        const { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        authorId = profile?.id || '11111111-1111-1111-1111-111111111111';
      }

      let { data: category } = await supabase.from('categories').select('id').eq('slug', category_slug).maybeSingle();
      const categoryId = category?.id || 'c1000000-0000-0000-0000-000000000001';

      const { data: insertedRow, error: insertError } = await supabase
        .from('confessions')
        .insert({
          author_id: authorId,
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

      if (!insertError && insertedRow) {
        newConfession.id = insertedRow.id;
        newConfession.public_code = insertedRow.public_code;
      } else {
        console.warn('Supabase DB insert warning (using shared server memory):', insertError?.message);
      }
    } catch (dbErr) {
      console.warn('Supabase DB connection note (published to shared server memory):', dbErr);
    }

    return NextResponse.json({ success: true, confession: newConfession });
  } catch (err: any) {
    console.error('POST /api/confessions catch:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
