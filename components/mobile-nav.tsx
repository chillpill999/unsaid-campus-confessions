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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-lg px-1 pt-1" style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[3rem] rounded-xl transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-400 active:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
            </Link>
          );
        })}

        {/* Central Floating Confess Button */}
        <div className="-mt-5">
          <button
            onClick={onOpenComposer}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-90 transition-all border-[3px] border-slate-950"
            aria-label="Create Anonymous Confession"
            style={{ width: '52px', height: '52px' }}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[3rem] rounded-xl transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-400 active:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

