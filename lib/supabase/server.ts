import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_SUPABASE_URL = 'https://prkecywvrficjylboior.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

export function createClient() {
  const cookieStore = cookies();

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url = (envUrl && envUrl.startsWith('http')) ? envUrl : DEFAULT_SUPABASE_URL;
  const key = (envKey && !envKey.includes('[SENSITIVE]')) ? envKey : DEFAULT_SUPABASE_ANON_KEY;

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Server Components cannot write cookies. Session refresh is
            // handled by the middleware, which writes the updated cookies.
          }
        },
      },
    }
  );
}

export function createRouteHandlerClient(req: NextRequest, res: NextResponse) {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url = (envUrl && envUrl.startsWith('http')) ? envUrl : DEFAULT_SUPABASE_URL;
  const key = (envKey && !envKey.includes('[SENSITIVE]')) ? envKey : DEFAULT_SUPABASE_ANON_KEY;

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}
