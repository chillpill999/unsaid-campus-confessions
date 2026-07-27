import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-project')
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : 'https://prkecywvrficjylboior.supabase.co';

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjAwMDAsImV4cCI6MjA2NzMzNjAwMH0.placeholder';

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected student routes
  const protectedRoutes = [
    '/feed',
    '/trending',
    '/search',
    '/saved',
    '/notifications',
    '/inbox',
    '/profile',
    '/settings',
    '/onboarding',
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin');

  // Check Demo Mode flag in cookie or header for local dev fallback
  const demoRoleCookie = request.cookies.get('unsaid_demo_role')?.value;
  const isDemoAllowed = process.env.NODE_ENV !== 'production' && Boolean(demoRoleCookie);

  if ((isProtectedRoute || isAdminRoute) && !user && !isDemoAllowed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/feed/:path*',
    '/trending/:path*',
    '/search/:path*',
    '/saved/:path*',
    '/notifications/:path*',
    '/inbox/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/admin/:path*',
  ],
};
