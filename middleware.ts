import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ALL routes that require a valid Supabase session
const PROTECTED_PREFIXES = [
  '/feed',
  '/trending',
  '/search',
  '/saved',
  '/notifications',
  '/inbox',
  '/profile',
  '/settings',
  '/onboarding',
  '/admin',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

// Real Supabase credentials (anon key is public, safe to include)
const SUPABASE_URL = 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only run auth checks on protected routes
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Build the login redirect URL (fail-closed default)
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);

  // Use real credentials — env vars take priority, hardcoded fallback ensures it always works
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

  // Create Supabase server client
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    // FAIL-CLOSED: No user OR any error → redirect to login
    if (!user || error) {
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated — allow through
    return response;
  } catch (err) {
    // ANY exception → FAIL-CLOSED, redirect to login
    console.error('[MIDDLEWARE] Auth check exception — blocking access:', err);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/feed',
    '/feed/:path*',
    '/trending',
    '/trending/:path*',
    '/search',
    '/search/:path*',
    '/saved',
    '/saved/:path*',
    '/notifications',
    '/notifications/:path*',
    '/inbox',
    '/inbox/:path*',
    '/profile',
    '/profile/:path*',
    '/settings',
    '/settings/:path*',
    '/onboarding',
    '/onboarding/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
