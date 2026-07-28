'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Flag, 
  FileText, 
  Users, 
  History, 
  ArrowLeft,
  ShieldX,
  LogOut,
  KeyRound,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const VALID_PASSKEYS = ['aryan2007', '2007', 'aryanrockstar2007@gmail.com', 'admin2007'];

  useEffect(() => {
    async function checkAdminAuth() {
      // 1. Check local session passkey
      if (typeof window !== 'undefined') {
        const savedKey = localStorage.getItem('unsaid_admin_key');
        if (savedKey && VALID_PASSKEYS.includes(savedKey.toLowerCase().trim())) {
          setIsAuthorizedAdmin(true);
          return;
        }
      }

      // 2. Check Supabase auth session
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const userEmail = (user.email || '').toLowerCase();
          if (userEmail === 'aryanrockstar2007@gmail.com') {
            localStorage.setItem('unsaid_admin_key', 'aryan2007');
            setIsAuthorizedAdmin(true);
            return;
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile?.role === 'admin') {
            localStorage.setItem('unsaid_admin_key', 'aryan2007');
            setIsAuthorizedAdmin(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Admin check note:', err);
      }

      setIsAuthorizedAdmin(false);
    }

    checkAdminAuth();
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcodeInput.trim().toLowerCase();
    if (VALID_PASSKEYS.includes(clean)) {
      localStorage.setItem('unsaid_admin_key', clean);
      setIsAuthorizedAdmin(true);
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid Admin Passcode key. Please check your credentials.');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('unsaid_admin_key');
    setIsAuthorizedAdmin(false);
    router.push('/feed');
  };

  const adminNav = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Reports Queue', href: '/admin/reports', icon: Flag },
    { label: 'Confessions', href: '/admin/confessions', icon: FileText },
    { label: 'Users Management', href: '/admin/users', icon: Users },
    { label: 'Identity Audit Logs', href: '/admin/identity-access', icon: History },
  ];

  if (isAuthorizedAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <ShieldAlert className="w-5 h-5 text-amber-400 animate-spin" />
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  if (isAuthorizedAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-white font-heading">Super Admin Passcode Access</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your Admin Passcode or Super Admin email (<span className="text-amber-400 font-mono">aryanrockstar2007@gmail.com</span>) to unlock moderation.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-3.5 pt-2">
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter Passcode (e.g. aryan2007)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-colors"
                required
              />
            </div>

            {passcodeError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {passcodeError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              Unlock Super Admin Mode 🔓
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/feed"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Campus Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <header className="border-b border-amber-500/30 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-white">ConfessionLnjpit Admin Portal</span>
              <span className="ml-2 text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Super Admin Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs font-semibold border border-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Lock Admin Mode
            </button>

            <Link
              href="/feed"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Campus Feed
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="md:col-span-3 space-y-2">
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="md:col-span-9">{children}</main>
      </div>
    </div>
  );
}
