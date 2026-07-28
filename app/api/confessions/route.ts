import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { generatePublicCode } from '@/lib/utils';
import { PublicConfession } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createServerClient();

    // 1. Query safe public_confessions view
    const { data: viewData, error: viewError } = await supabase
      .from('public_confessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!viewError && viewData) {
      const confessions: PublicConfession[] = viewData.map((row: any) => ({
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

      return NextResponse.json({ success: true, confessions });
    }

    // 2. Fallback query directly from confessions table if view not cached in PostgREST
    const { data: rawData, error: rawError } = await supabase
      .from('confessions')
      .select('*')
      .eq('moderation_status', 'approved')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (!rawError && rawData) {
      const confessions: PublicConfession[] = rawData.map((row: any) => ({
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

      return NextResponse.json({ success: true, confessions });
    }

    // 3. Schema drift or table missing (PGRST205)
    return NextResponse.json({
      success: true,
      confessions: [],
      warning: 'Database table public.confessions does not exist yet. Please run migration SQL in Supabase SQL Editor.',
    });
  } catch (err: any) {
    console.error('GET /api/confessions catch:', err);
    return NextResponse.json({ success: false, error: err.message, confessions: [] }, { status: 500 });
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
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Resolve author ID
    let authorId = user?.id;

    if (!authorId) {
      const { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
      authorId = profile?.id;
    }

    if (!authorId) {
      authorId = '11111111-1111-1111-1111-111111111111';
    }

    // 2. Resolve category ID
    let { data: category } = await supabase.from('categories').select('id').eq('slug', category_slug).maybeSingle();

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
      await supabase.from('categories').upsert(categoriesToSeed, { onConflict: 'slug' });
      const { data: recheck } = await supabase.from('categories').select('id').eq('slug', category_slug).maybeSingle();
      category = recheck;
    }

    const categoryId = category?.id || 'c1000000-0000-0000-0000-000000000001';
    const publicCode = generatePublicCode();

    // 3. INSERT INTO SUPABASE CONFESSIONS TABLE
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

    if (insertError) {
      console.error('POST /api/confessions insert error:', insertError);
      
      if (insertError.code === 'PGRST205' || insertError.message?.includes('schema cache') || insertError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database table "public.confessions" does not exist in Supabase yet. Please execute supabase/migrations/20260727000000_init_schema.sql in your Supabase SQL Editor.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
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

    return NextResponse.json({ success: true, confession: createdConfession });
  } catch (err: any) {
    console.error('POST /api/confessions catch:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
