import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('Testing Supabase project connection:', SUPABASE_URL);

  const res1 = await supabase.from('confessions').select('*').limit(1);
  console.log('confessions table result:', { data: res1.data, error: res1.error });

  const res2 = await supabase.from('public_confessions').select('*').limit(1);
  console.log('public_confessions view result:', { data: res2.data, error: res2.error });

  const res3 = await supabase.from('profiles').select('*').limit(1);
  console.log('profiles table result:', { data: res3.data, error: res3.error });

  const res4 = await supabase.from('categories').select('*').limit(1);
  console.log('categories table result:', { data: res4.data, error: res4.error });
}

checkTables();
