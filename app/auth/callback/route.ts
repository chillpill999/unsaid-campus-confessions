import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
        }
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth-failed', requestUrl.origin));
}
