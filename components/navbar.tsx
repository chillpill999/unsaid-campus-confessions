'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Lock, 
  Flame, 
  Search, 
  Bookmark, 
  Bell, 
  MessageSquare, 
  User, 
  ShieldAlert, 
  PlusCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  onOpenComposer?: () => void;
  isAdmin?: boolean;
}

export function Navbar({ onOpenComposer, isAdmin: isAdminProp = false }: NavbarProps) {
  const pathname = usePathname();
  const [isAdminUser, setIsAdminUser] = useState(isAdminProp);

  useEffect(() => {
    async function checkRole() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userEmail = (user.email || '').toLowerCase();
          const isSuperAdminEmail = userEmail === 'aryanrockstar2007@gmail.com';

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (isSuperAdminEmail || profile?.role === 'admin') {
            setIsAdminUser(true);
          }
        }
      } catch {}
    }
    checkRole();
  }, []);

  const showAdminLink = isAdminProp || isAdminUser;

  const navItems = [
    { label: 'Feed', href: '/feed', icon: Lock },
    { label: 'Trending', href: '/trending', icon: Flame },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Saved', href: '/saved', icon: Bookmark },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-[#F4F3EF]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo - Stitch Google Vibrant Orange Accent */}
        <Link href="/feed" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] flex items-center justify-center text-white font-black shadow-md shadow-[#FF6B00]/25 group-hover:scale-105 transition-transform">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heading font-black text-xl tracking-tight text-slate-950 group-hover:text-[#FF6B00] transition-colors">
              ConfessionLnjpit
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items - Stitch Google Light Pill Bar */}
        <nav className="hidden md:flex items-center gap-1 bg-white/90 p-1.5 rounded-full border border-slate-200/80 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {onOpenComposer && (
            <button
              onClick={onOpenComposer}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              Confess
            </button>
          )}

          {showAdminLink && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-md'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 shadow-sm'
              }`}
              title="Admin Portal & Safety Governance"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Admin Portal</span>
            </Link>
          )}

          <Link
            href="/profile"
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:border-[#FF6B00]/40 transition-all shadow-sm"
            title="Profile & Settings"
          >
            <User className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
