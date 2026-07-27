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
  LogOut
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        if (typeof window !== 'undefined') {
          const localRole = localStorage.getItem('unsaid_session') || localStorage.getItem('unsaid_demo_role');
          if (localRole === 'admin' || document.cookie.includes('unsaid_session=admin')) {
            setIsAuthorizedAdmin(true);
            return;
          }
        }

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsAuthorizedAdmin(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAuthorizedAdmin(profile?.role === 'admin');
      } catch (err) {
        if (typeof window !== 'undefined') {
          const localRole = localStorage.getItem('unsaid_session') || localStorage.getItem('unsaid_demo_role');
          if (localRole === 'admin' || document.cookie.includes('unsaid_session=admin')) {
            setIsAuthorizedAdmin(true);
            return;
          }
        }
        setIsAuthorizedAdmin(false);
      }
    }

    checkAdminAuth();
  }, []);

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <header className="border-b border-amber-500/30 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-white">ConfessionLnjpit Admin Portal</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Audited & Restricted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex-1 w-full flex flex-col md:grid md:grid-cols-12 gap-4 sm:gap-6">
        {/* Mobile: Horizontal scrollable nav / Desktop: Vertical sidebar */}
        <aside className="md:col-span-3 md:space-y-2 md:sticky md:top-20 md:h-fit">
          <div className="md:hidden overflow-x-auto -mx-3 px-3 pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-amber-400" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden md:block space-y-2">
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
          </div>
        </aside>

        <section className="md:col-span-9 space-y-4 sm:space-y-6 flex-1">
          {children}
        </section>
      </div>
    </div>
  );
}
