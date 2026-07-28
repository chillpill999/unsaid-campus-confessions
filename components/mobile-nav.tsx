'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Flame, Plus, Search, Bell, User } from 'lucide-react';

interface MobileNavProps {
  onOpenComposer: () => void;
}

export function MobileNav({ onOpenComposer }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/feed', icon: Lock },
    { label: 'Trending', href: '/trending', icon: Flame },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Alerts', href: '/notifications', icon: Bell },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-950/90 border border-slate-800/90 backdrop-blur-2xl px-2 py-1.5 rounded-full shadow-2xl" style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full transition-all ${
                isActive ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-400 active:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-mono leading-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Central Floating Confess Button */}
        <div className="-mt-6">
          <button
            onClick={onOpenComposer}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 active:scale-90 transition-all border-[3px] border-slate-950 font-black"
            aria-label="Create Anonymous Confession"
            style={{ width: '52px', height: '52px' }}
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-full transition-all ${
                isActive ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-400 active:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-mono leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
