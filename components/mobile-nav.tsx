'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Flame, Plus, MessageSquare, User } from 'lucide-react';

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
    <div className="md:hidden fixed bottom-3 left-0 right-0 z-40 flex justify-center px-3 pointer-events-none">
      <div 
        className="pointer-events-auto w-full max-w-md bg-white/95 border border-slate-200/90 backdrop-blur-2xl px-2 py-1.5 rounded-full shadow-2xl shadow-slate-900/15 flex items-center justify-between"
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-5 items-center w-full relative">
          
          {/* Left 2 Tabs */}
          {leftNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-full transition-all w-full ${
                  isActive
                    ? 'text-[#FF6B00] font-black bg-[#FF6B00]/10'
                    : 'text-slate-500 hover:text-slate-900 active:scale-95'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px] font-mono leading-tight font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Central Floating Action Button */}
          <div className="flex items-center justify-center relative">
            <button
              onClick={onOpenComposer}
              className="absolute -top-7 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FF8533] text-white flex items-center justify-center shadow-lg shadow-[#FF6B00]/40 active:scale-90 transition-transform border-[3px] border-white font-black shrink-0"
              aria-label="Create Anonymous Confession"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
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
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-full transition-all w-full ${
                  isActive
                    ? 'text-[#FF6B00] font-black bg-[#FF6B00]/10'
                    : 'text-slate-500 hover:text-slate-900 active:scale-95'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
                <span className="text-[10px] font-mono leading-tight font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}

        </div>
      </div>
    </div>
  );
}
