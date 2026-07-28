'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Flame, Plus, MessageSquare, Bell, User, Search } from 'lucide-react';

interface MobileNavProps {
  onOpenComposer: () => void;
}

export function MobileNav({ onOpenComposer }: MobileNavProps) {
  const pathname = usePathname();

  const leftNavItems = [
    { label: 'Feed', href: '/feed', icon: Lock },
    { label: 'Trending', href: '/trending', icon: Flame },
  ];

  const rightNavItems = [
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-3 left-2 right-2 z-40 bg-white/95 border border-slate-200/90 backdrop-blur-2xl px-1.5 py-1 rounded-full shadow-2xl" 
      style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="grid grid-cols-5 items-center w-full max-w-sm mx-auto relative text-center">
        
        {/* Left 2 Tabs */}
        {leftNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-all mx-auto w-full ${
                isActive ? 'text-[#FF6B00] font-bold bg-[#FF6B00]/10' : 'text-slate-500 active:text-slate-900'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] font-mono leading-tight truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* Central Floating Action Button */}
        <div className="flex items-center justify-center -mt-5">
          <button
            onClick={onOpenComposer}
            className="w-12 h-12 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-[#FF6B00]/40 active:scale-90 transition-all border-[3px] border-white font-black shrink-0"
            aria-label="Create Anonymous Confession"
          >
            <Plus className="w-5.5 h-5.5 stroke-[3]" />
          </button>
        </div>

        {/* Right 2 Tabs */}
        {rightNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-all mx-auto w-full ${
                isActive ? 'text-[#FF6B00] font-bold bg-[#FF6B00]/10' : 'text-slate-500 active:text-slate-900'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] font-mono leading-tight truncate">{item.label}</span>
            </Link>
          );
        })}

      </div>
    </div>
  );
}
