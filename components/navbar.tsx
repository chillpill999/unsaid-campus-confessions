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
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function checkRoleAndNotifications() {
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

          // Fetch unread notifications count
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          if (typeof count === 'number') {
            setUnreadCount(count);
          }
        }
      } catch {}
    }
    checkRoleAndNotifications();
  }, [pathname]);

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-[#F4F3EF]/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo - Stitch Google Vibrant Accent */}
        <Link href="/feed" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FF6B00] flex items-center justify-center text-white font-black shadow-md shadow-[#FF6B00]/25 group-hover:scale-105 transition-transform shrink-0">
            <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="truncate">
            <span className="font-heading font-black text-base sm:text-xl tracking-tight text-slate-950 group-hover:text-[#FF6B00] transition-colors truncate block">
              Confession<span className="text-[#FF6B00]">Lnjpit</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items - Light Pill Bar */}
        <nav className="hidden md:flex items-center gap-1 bg-white/90 p-1.5 rounded-full border border-slate-200/80 shadow-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isNotifications = item.href === '/notifications';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FF6B00] text-white shadow-md shadow-[#FF6B00]/20'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
                {isNotifications && unreadCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls - Mobile Safe Layout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onOpenComposer && (
            <button
              onClick={onOpenComposer}
              className="hidden sm:flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              Confess
            </button>
          )}

          {showAdminLink && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold border transition-all shrink-0 ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-md'
                  : 'bg-amber-500/10 text-amber-700 border-amber-300/60 hover:bg-amber-500/20 shadow-sm'
              }`}
              title="Admin Portal"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">Admin Portal</span>
              <span className="sm:hidden text-[11px] font-black text-amber-800">Admin</span>
            </Link>
          )}

          {/* Notifications Icon (Mobile Header Bell with Badge) */}
          <Link
            href="/notifications"
            className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all shadow-sm shrink-0 md:hidden ${
              pathname === '/notifications'
                ? 'bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-[#FF6B00]/25'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 hover:border-[#FF6B00]/40'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF6B00] text-white text-[9px] font-mono font-bold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/search"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:border-[#FF6B00]/40 transition-all shadow-sm shrink-0 md:hidden"
            title="Search Confessions"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>

          <Link
            href="/profile"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:border-[#FF6B00]/40 transition-all shadow-sm shrink-0"
            title="Profile & Settings"
          >
            <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
