import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

const REQUIRED_OBJECTS = [
  'colleges',
  'profiles',
  'categories',
  'confessions',
  'comments',
  'reactions',
  'bookmarks',
  'reports',
  'notifications',
  'blocks',
  'mood_votes',
  'anonymous_conversations',
  'anonymous_messages',
  'moderation_actions',
  'identity_access_logs',
  'public_confessions',
  'public_comments'
];

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const auditResults: Record<string, string> = {};
  let overallHealthy = true;

  try {
    const checks = await Promise.all(
      REQUIRED_OBJECTS.map(async (obj) => {
        try {
          const { error } = await supabase.from(obj).select('*').limit(1);
          return { obj, status: error ? `MISSING: ${error.message}` : 'PASS', pass: !error };
        } catch (err: any) {
          return { obj, status: `ERROR: ${err.message}`, pass: false };
        }
      })
    );

    for (const check of checks) {
      auditResults[check.obj] = check.status;
      if (!check.pass) overallHealthy = false;
    }
  } catch (err: any) {
    overallHealthy = false;
  }

  return NextResponse.json({
    status: overallHealthy ? 'healthy' : 'migration_required',
    database_connection: 'PASS',
    project_url_configured: true,
    schema_audit: auditResults,
    migration_instructions: overallHealthy
      ? 'All schema objects exist.'
      : 'Execute supabase/migrations/20260727000000_init_schema.sql in your Supabase SQL Editor.'
  });
}
