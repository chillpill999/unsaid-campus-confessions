'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error === 'auth-failed') {
      setErrorMsg("We couldn't sign you in with Google. Please try again.");
    } else if (error === 'account-banned' || error === 'account-suspended') {
      setErrorMsg('This account cannot access Unsaid right now.');
    }

    async function redirectAuthenticatedUser() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!authError && user) {
          router.replace('/feed');
        }
      } catch {
        // Stay on login when Supabase is unavailable or not configured.
      }
    }

    redirectAuthenticatedUser();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const origin = window.location.origin;
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/feed';
      const callbackUrl = new URL('/auth/callback', origin);
      callbackUrl.searchParams.set('next', safeRedirect);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Google OAuth sign-in failed:', err);
      setErrorMsg("We couldn't sign you in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mx-auto">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-heading">Welcome to Unsaid</h1>
            <p className="text-sm text-slate-400 mt-1">Verified students. Anonymous conversations.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? 'Opening Google...' : 'Continue with Google'}</span>
        </button>

        <p className="text-xs text-slate-400 leading-relaxed text-center">
          Your Google account verifies your account while your public activity remains anonymous to other students.
        </p>

        <div className="pt-3 border-t border-slate-800 text-center space-y-2">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Administrators also sign in with Google and are authorized by trusted account role.
          </p>
          <div className="text-[11px] text-slate-500">
            <Link href="/guidelines" className="text-indigo-400 underline">Community Guidelines</Link>
            <span className="px-2">.</span>
            <Link href="/privacy" className="text-indigo-400 underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
