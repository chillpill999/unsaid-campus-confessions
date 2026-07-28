import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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
  '/confession',
  '/admin',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(loginUrl);
  }

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

    if (!user || error) {
      return NextResponse.redirect(loginUrl);
    }

    // Check account status for all protected routes.
    // Use maybeSingle so new users (no profile yet) aren't blocked.
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_status, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && (profile.account_status === 'banned' || profile.account_status === 'suspended')) {
      const statusUrl = new URL('/login', request.url);
      statusUrl.searchParams.set('error', 'account-' + profile.account_status);
      return NextResponse.redirect(statusUrl);
    }

    // For admin routes, verify admin role
    if (isAdminPath(pathname)) {
      if (!profile || profile.role !== 'admin') {
        const feedUrl = new URL('/feed', request.url);
        return NextResponse.redirect(feedUrl);
      }
    }

    return response;
  } catch (err) {
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
    '/confession',
    '/confession/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
