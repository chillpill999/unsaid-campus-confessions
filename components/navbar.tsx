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
  PlusCircle 
} from 'lucide-react';

interface NavbarProps {
  onOpenComposer?: () => void;
  isAdmin?: boolean;
}

export function Navbar({ onOpenComposer, isAdmin = true }: NavbarProps) {
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/feed" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Unsaid
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-widest text-indigo-400/80 ml-2 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Campus
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
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
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              Confess
            </button>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
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
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Profile & Settings"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
