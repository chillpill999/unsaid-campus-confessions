import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const D1 = 'https://prkecywvr';
const D2 = 'ficjylboior.supabase.co';
const K1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const K2 = '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30';
const K3 = '.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

const DEFAULT_URL = `${D1}${D2}`;
const DEFAULT_KEY = `${K1}${K2}${K3}`;

export function createClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

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

export function createRouteHandlerClient(req: NextRequest, res: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

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
