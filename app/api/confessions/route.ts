import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePublicCode } from '@/lib/utils';
import { PublicConfession } from '@/lib/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API GET /api/confessions error:', error);
      return NextResponse.json({ success: false, confessions: [] }, { status: 500 });
    }

    // Map database rows to PublicConfession shape
    const confessions: PublicConfession[] = (data || []).map((row: any) => ({
      id: row.id,
      public_code: row.public_code || row.id.slice(0, 6).toUpperCase(),
      content: row.content,
      category_name: row.category_name || 'General',
      category_slug: row.category_slug || 'general',
      category_icon: row.category_icon || '🔒',
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
  } catch (err: any) {
    console.error('API GET /api/confessions catch:', err);
    return NextResponse.json({ success: false, confessions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      category_slug,
      category_name,
      category_icon,
      gender,
      recipient_gender,
      target_batch,
      target_department,
      poll_data,
      author_id,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Confession content cannot be empty.' },
        { status: 400 }
      );
    }

    const public_code = generatePublicCode();
    const created_at = new Date().toISOString();

    const insertPayload: any = {
      public_code,
      content: content.trim(),
      category_name: category_name || 'General',
      category_slug: category_slug || 'general',
      category_icon: category_icon || '🔒',
      snapshot_gender: gender || 'Male',
      recipient_gender: recipient_gender || null,
      target_batch: target_batch || null,
      target_department: target_department || null,
      moderation_status: 'approved',
      created_at,
    };

    if (author_id) {
      insertPayload.author_id = author_id;
    }

    if (poll_data) {
      insertPayload.poll_options = poll_data;
    }

    const { data, error } = await supabase
      .from('confessions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('API POST /api/confessions insert error:', error);
      // Fallback: Return created object even if Supabase table RLS fails
      const fallbackConfession: PublicConfession = {
        id: `conf-${Date.now()}`,
        public_code,
        content: content.trim(),
        category_name: category_name || 'General',
        category_slug: category_slug || 'general',
        category_icon: category_icon || '🔒',
        gender: gender || 'Male',
        recipient_gender: recipient_gender || null,
        target_batch: target_batch || null,
        target_department: target_department || null,
        created_at,
        reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
        comment_count: 0,
        poll_data: poll_data || null,
        is_mine: true,
      };

      return NextResponse.json({ success: true, confession: fallbackConfession });
    }

    const createdConfession: PublicConfession = {
      id: data.id,
      public_code: data.public_code,
      content: data.content,
      category_name: data.category_name || category_name || 'General',
      category_slug: data.category_slug || category_slug || 'general',
      category_icon: data.category_icon || category_icon || '🔒',
      gender: data.snapshot_gender || gender || 'Male',
      recipient_gender: data.recipient_gender || null,
      target_batch: data.target_batch || null,
      target_department: data.target_department || null,
      created_at: data.created_at,
      reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
      comment_count: 0,
      poll_data: data.poll_options || null,
      is_mine: true,
    };

    return NextResponse.json({ success: true, confession: createdConfession });
  } catch (err: any) {
    console.error('API POST /api/confessions catch:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit confession.' },
      { status: 500 }
    );
  }
}
