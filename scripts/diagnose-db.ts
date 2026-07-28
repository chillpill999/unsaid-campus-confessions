import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

async function diagnose() {
  console.log('Connecting to Supabase:', SUPABASE_URL);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Test public_confessions view
  const { data: viewData, error: viewError } = await supabase.from('public_confessions').select('*').limit(5);
  console.log('public_confessions view result:', { error: viewError, count: viewData?.length });

  // 2. Test categories table
  const { data: catData, error: catError } = await supabase.from('categories').select('*').limit(5);
  console.log('categories table result:', { error: catError, count: catData?.length });

  // 3. Test raw confessions table SELECT
  const { data: rawData, error: rawError } = await supabase.from('confessions').select('*').limit(5);
  console.log('confessions table raw select result:', { error: rawError, count: rawData?.length });

  // 4. Test insert into confessions table with anon user / test user
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: `test_diag_${Date.now()}@lnjpit.ac.in`,
    password: 'TestPassword123!',
  });
  console.log('Auth signUp result:', { user_id: authData?.user?.id, authErr });

  if (authData?.user) {
    const { data: insData, error: insErr } = await supabase.from('confessions').insert({
      author_id: authData.user.id,
      public_code: `TEST${Math.floor(1000 + Math.random() * 9000)}`,
      content: 'Diagnostic test confession',
      category_id: catData?.[0]?.id || 'c1000000-0000-0000-0000-000000000001',
      moderation_status: 'approved',
      snapshot_gender: 'Male',
      snapshot_batch: '2026',
      snapshot_department: 'CSE',
    }).select();
    console.log('Insert test result:', { insData, insErr });
  }
}

diagnose();
