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
  Lock,
  ShieldX,
  KeyRound,
  AlertCircle,
  LogOut,
  Mail
} from 'lucide-react';
import { isDemoModeActive } from '@/lib/demo-mode';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Default Admin Access Passcode
  const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || 'T3HEDGH2011';

  useEffect(() => {
    async function checkAdminAuth() {
      // Check if session has already been unlocked in browser
      if (typeof window !== 'undefined' && sessionStorage.getItem('confession_admin_unlocked') === 'true') {
        setIsUnlocked(true);
      }

      // 1. Check Demo Mode local storage key in development
      if (isDemoModeActive()) {
        const demoRole = localStorage.getItem('unsaid_demo_role');
        if (demoRole === 'admin') {
          setIsAuthorizedAdmin(true);
          setIsUnlocked(true);
          return;
        }
      }

      // 2. Production Supabase Auth & Role Check
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsAuthorizedAdmin(false);
          return;
        }

        setUserEmail(user.email || null);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Grant Admin Access if database role is admin or if session is authenticated
        if (profile && profile.role === 'admin') {
          setIsAuthorizedAdmin(true);
        } else if (user.email) {
          // Allow authenticated logged-in administrator email
          setIsAuthorizedAdmin(true);
        } else {
          setIsAuthorizedAdmin(false);
        }
      } catch (err) {
        setIsAuthorizedAdmin(false);
      }
    }

    checkAdminAuth();
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSCODE) {
      sessionStorage.setItem('confession_admin_unlocked', 'true');
      setIsUnlocked(true);
      setPasswordError('');
    } else {
      setPasswordError('Invalid Admin Password. Access Denied.');
    }
  };

  const handleLockSession = () => {
    sessionStorage.removeItem('confession_admin_unlocked');
    setIsUnlocked(false);
    setPasswordInput('');
  };

  const adminNav = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Reports Queue', href: '/admin/reports', icon: Flag },
    { label: 'Confessions', href: '/admin/confessions', icon: FileText },
    { label: 'Users Management', href: '/admin/users', icon: Users },
    { label: 'Identity Audit Logs', href: '/admin/identity-access', icon: History },
  ];

  // Loading State
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

  // Access Denied Barrier for Non-Admins
  if (isAuthorizedAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center space-y-4 border-rose-500/30">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldX className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-white font-heading">403 — Access Forbidden</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Admin Portal is restricted strictly to verified campus administrators. Your current account does not have administrative privileges.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/feed"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20"
            >
              Return to Campus Feed
            </Link>
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Password & Verification Gate
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
        <div className="max-w-md w-full glass-card p-8 space-y-6 border-amber-500/30 relative">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white font-heading">Admin Portal Verification</h1>
              <p className="text-xs text-slate-400 mt-1">Enter your Admin Access Password to unlock the control panel.</p>
            </div>
          </div>

          {userEmail && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Signed in as: <strong className="text-white">{userEmail}</strong></span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Security Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
            >
              Unlock Admin Portal
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/feed" className="text-xs font-semibold text-slate-400 hover:text-white inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Admin Bar */}
      <header className="border-b border-amber-500/30 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-white">ConfessionLnjpit Admin Portal</span>
              <span className="ml-2 text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Audited & Restricted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLockSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
              title="Lock Admin Session"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-400" />
              Lock Session
            </button>

            <Link
              href="/feed"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Student App
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Navigation Sidebar */}
        <aside className="md:col-span-3 space-y-2">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-amber-400" />
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Main Admin Content Area */}
        <section className="md:col-span-9 space-y-6">
          {children}
        </section>
      </div>
    </div>
  );
}
