import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const targetObjects = [
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

async function auditDatabaseSchema() {
  console.log('====================================================');
  console.log('🔍 AUDITING SUPABASE REMOTE DATABASE SCHEMA');
  console.log('Project URL:', SUPABASE_URL);
  console.log('====================================================\n');

  const results: Record<string, string> = {};

  for (const obj of targetObjects) {
    const { data, error } = await supabase.from(obj).select('*').limit(1);
    if (error) {
      results[obj] = `MISSING / ERROR: ${error.code} - ${error.message}`;
    } else {
      results[obj] = `EXISTS (Count: ${data?.length || 0})`;
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

auditDatabaseSchema();
