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

  // Step 1: Exchange the code using a temporary response to capture auth cookies
  let tempResponse = NextResponse.next();
  const tempClient = createRouteHandlerClient(request, tempResponse);
  const { data: exchangeData, error } = await tempClient.auth.exchangeCodeForSession(code);

  if (error || !exchangeData?.session) {
    return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
  }

  // Step 2: Determine redirect target based on database profile existence
  let targetPath = next;
  const { data: { user } } = await tempClient.auth.getUser();

  if (user) {
    const { data: profile } = await tempClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      targetPath = '/onboarding';
    }
  }

  // Step 3: Create the final redirect response and set both Supabase session and persistent 30-day cookie
  const redirectUrl = new URL(targetPath, requestUrl.origin);
  const finalResponse = NextResponse.redirect(redirectUrl);
  const finalClient = createRouteHandlerClient(request, finalResponse);
  await finalClient.auth.setSession(exchangeData.session);

  // Set persistent 30-day session cookies for instant/cross-device verification
  finalResponse.cookies.set('unsaid_session', 'student', { path: '/', maxAge: 2592000, sameSite: 'lax' });
  finalResponse.cookies.set('unsaid_demo_role', 'student', { path: '/', maxAge: 2592000, sameSite: 'lax' });
  if (user) {
    finalResponse.cookies.set('unsaid_uid', user.id, { path: '/', maxAge: 2592000, sameSite: 'lax' });
  }

  return finalResponse;
}