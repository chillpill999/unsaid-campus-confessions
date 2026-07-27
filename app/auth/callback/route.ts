import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/feed';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if user has an existing application profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // If user profile does not exist yet, redirect to onboarding
        if (!profile) {
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
        }
      }
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  }

  // Return the user to login if something went wrong
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-failed`);
}
