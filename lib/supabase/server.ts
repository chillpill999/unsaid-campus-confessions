import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

export function createClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
          }
        },
      },
    }
  );
}

/**
 * Route Handler-specific Supabase client.
 * Uses request.cookies for reading and response.cookies for writing,
 * which ensures auth session cookies are properly persisted in the browser.
 */
export function createRouteHandlerClient(req: NextRequest, res: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
}
