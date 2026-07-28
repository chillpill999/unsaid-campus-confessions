'use client';

import React from 'react';
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
  PlusCircle,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onOpenComposer?: () => void;
  isAdmin?: boolean;
}

export function Navbar({ onOpenComposer, isAdmin = false }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/feed', icon: Lock },
    { label: 'Trending', href: '/trending', icon: Flame },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Saved', href: '/saved', icon: Bookmark },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/feed" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
              ConfessionLnjpit
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20 hidden sm:inline">iOS</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items - Material iOS Pill Bar */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-full border border-slate-800/80 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {onOpenComposer && (
            <button
              onClick={onOpenComposer}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              Confess
            </button>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-amber-400/90 border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Admin
            </Link>
          )}

          <Link
            href="/profile"
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-500/40 transition-all shadow-inner"
            title="Profile & Settings"
          >
            <User className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
