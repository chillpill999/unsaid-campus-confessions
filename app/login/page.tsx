'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

// Generate or retrieve a stable anonymous user ID that persists across sessions
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return '';
  let uid = localStorage.getItem('unsaid_uid');
  if (!uid) {
    uid = 'uid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('unsaid_uid', uid);
  }
  return uid;
}

function setSession(role: 'student' | 'admin') {
  const uid = getOrCreateUserId();
  // Persistent 30-day cookie — survives tab closes and browser restarts
  document.cookie = `unsaid_session=${role}; path=/; max-age=2592000; SameSite=Lax`;
  document.cookie = `unsaid_uid=${uid}; path=/; max-age=2592000; SameSite=Lax`;
  localStorage.setItem('unsaid_session', role);
  localStorage.setItem('unsaid_demo_role', role);
  localStorage.setItem('unsaid_uid', uid);
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-redirect to /feed if already logged in (handles new tab case)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSession =
        localStorage.getItem('unsaid_session') ||
        localStorage.getItem('unsaid_demo_role') ||
        document.cookie.includes('unsaid_session=');
      if (hasSession) {
        router.replace('/feed');
        return;
      }
    }
  }, [router]);

  // Check if user has already completed onboarding previously
  function hasCompletedOnboarding(): boolean {
    if (typeof window === 'undefined') return false;
    const uid = localStorage.getItem('unsaid_uid');
    if (!uid) return false;
    const profile = localStorage.getItem(`unsaid_profile_${uid}`);
    return !!profile;
  }

  // Student Login — instant access, remembers identity
  const handleStudentLogin = () => {
    setSession('student');
    if (hasCompletedOnboarding()) {
      router.push('/feed');
    } else {
      router.push('/onboarding');
    }
  };

  // Admin Portal Login
  const handleAdminLogin = () => {
    setSession('admin');
    router.push('/admin');
  };

  // Google OAuth Login (for Supabase-backed real cross-device persistence)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Pre-set session so middleware lets the callback through
      setSession('student');

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/auth/callback` },
      });

      if (error) throw error;
    } catch (err: any) {
      console.warn('OAuth not configured, using local session:', err.message);
      // Graceful fallback: proceed with cookie-based session
      if (hasCompletedOnboarding()) {
        router.push('/feed');
      } else {
        router.push('/onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mx-auto">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-heading">Welcome to ConfessionLnjpit</h1>
            <p className="text-xs text-slate-400 mt-1">Verified students. Anonymous conversations.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Login Options */}
        <div className="space-y-3">
          {/* Instant Student Access — remembers your identity */}
          <button
            onClick={handleStudentLogin}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enter as Student</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Google OAuth — cross-device persistent login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 font-semibold text-xs shadow-md flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google (Cross-device)</span>
          </button>
        </div>

        {/* Admin Portal */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            onClick={handleAdminLogin}
            className="text-xs text-amber-400/90 hover:text-amber-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Campus Administrator Access</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 text-center leading-relaxed">
          By continuing, you agree to our{' '}
          <Link href="/guidelines" className="text-indigo-400 underline">Community Guidelines</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-indigo-400 underline">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}
