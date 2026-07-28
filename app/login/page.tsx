'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/feed`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Google OAuth failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col justify-center items-center px-4 selection:bg-[#FF6B00] selection:text-white">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] p-8 shadow-xl space-y-6 text-center">
        
        {/* Brand Header */}
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#FF6B00]/25">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 font-heading">
            Join ConfessionLnjpit
          </h1>
          <p className="text-xs text-slate-600 font-sans">
            Verify student identity with Google OAuth. Your name and email are strictly hidden from other students.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left">
            {errorMsg}
          </div>
        )}

        {/* OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs shadow-lg shadow-[#FF6B00]/25 transition-all flex items-center justify-center gap-2 font-mono disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to Google...
            </>
          ) : (
            <>
              Continue with Google Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
          Protected by RLS Policies & Verified OAuth
        </div>

        <div className="text-xs text-slate-500 pt-1">
          By signing in, you agree to our{' '}
          <Link href="/guidelines" className="text-[#FF6B00] hover:underline font-bold font-mono">
            Community Guidelines
          </Link>.
        </div>
      </div>
    </div>
  );
}
