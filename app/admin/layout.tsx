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
  Lock,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
          <ShieldAlert className="w-5 h-5 text-[#FF6B00] animate-spin" />
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  if (isAuthorizedAdmin === false) {
    return (
      <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex items-center justify-center p-4 selection:bg-[#FF6B00] selection:text-white">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-[28px] p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-slate-950 font-heading tracking-tight">Super Admin Passcode Access</h1>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Enter your Admin Passcode or Super Admin email (<span className="text-[#FF6B00] font-mono font-bold">aryanrockstar2007@gmail.com</span>) to unlock moderation.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-3.5 pt-2">
            <div className="relative">
              <Lock className="w-4 h-4 text-[#FF6B00] absolute left-3.5 top-3" />
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter Passcode (e.g. aryan2007)"
                className="w-full bg-[#F4F3EF] border border-slate-200 focus:border-[#FF6B00] rounded-2xl pl-9 pr-3 py-2.5 text-xs text-slate-950 placeholder-slate-500 font-mono focus:outline-none transition-colors shadow-inner"
                required
              />
            </div>

            {passcodeError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs font-semibold">
                {passcodeError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs shadow-lg shadow-[#FF6B00]/20 transition-all hover:scale-[1.01]"
            >
              Unlock Super Admin Mode 🔓
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/feed"
              className="text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Campus Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col selection:bg-[#FF6B00] selection:text-white font-sans">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black shadow-md shadow-[#FF6B00]/25 shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="truncate">
              <span className="font-heading font-black text-sm sm:text-lg text-slate-950 tracking-tight block sm:inline truncate">
                Admin Portal
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full border border-[#FF6B00]/20">
                Super Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 text-xs font-bold border border-rose-500/20 transition-all"
              title="Lock Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Admin</span>
            </button>

            <Link
              href="/feed"
              className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all shadow-sm"
              title="Campus Feed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Campus Feed</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer / Horizontal scroll bar */}
      <div className={`md:hidden bg-white border-b border-slate-200 px-4 py-3 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <nav className="flex flex-col space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-[#F4F3EF]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-6">
        <aside className="hidden md:block md:col-span-3 space-y-2">
          <nav className="space-y-1 bg-white p-2 rounded-[24px] border border-slate-200/80 shadow-md">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-[#F4F3EF]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
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
