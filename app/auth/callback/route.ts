import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';

const ALLOWED_REDIRECT_PATHS = [
  '/feed', '/trending', '/search', '/saved', '/notifications',
  '/inbox', '/profile', '/settings', '/onboarding',
];

function isSafeRedirectPath(path: string): boolean {
  try {
    const url = new URL(path, 'http://localhost');
    if (url.hostname !== 'localhost' && url.hostname !== '') {
      return false;
    }
    return ALLOWED_REDIRECT_PATHS.some((p) => path === p || path.startsWith(p + '/'));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next') ?? '';
  const next = isSafeRedirectPath(nextParam) ? nextParam : '/feed';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
  }

  // Create the redirect response FIRST so Supabase auth cookies
  // are written to the actual HTTP response during exchangeCodeForSession
  const redirectUrl = new URL(next, requestUrl.origin);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createRouteHandlerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        // Redirect to onboarding - create new response and re-apply session
        redirectUrl.pathname = '/onboarding';
        response = NextResponse.redirect(redirectUrl);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const finalClient = createRouteHandlerClient(request, response);
          await finalClient.auth.setSession(session);
        }
      }
    }
  } else {
    response = NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
  }

  return response;
}