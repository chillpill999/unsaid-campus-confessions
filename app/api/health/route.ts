import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

// Health reports connectivity only. It deliberately does NOT enumerate schema
// object names, which would let an unauthenticated caller probe the database.
export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let reachable = false;

  try {
    // A lightweight, always-visible table (categories is GRANTed to anon).
    const { error } = await supabase.from('categories').select('id').limit(1);
    reachable = !error;
  } catch (err: any) {
    reachable = false;
  }

  if (!reachable) {
    return NextResponse.json(
      { status: 'degraded', database_connection: 'FAIL' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: 'healthy',
    database_connection: 'PASS',
    project_url_configured: true,
  });
}
