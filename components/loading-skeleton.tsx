'use client';

import React from 'react';

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-6 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <div className="w-24 h-3 bg-slate-800 rounded" />
              <div className="w-12 h-3 bg-slate-800 rounded" />
            </div>
            <div className="w-16 h-5 bg-slate-800 rounded-lg" />
          </div>
          <div className="w-20 h-5 bg-slate-800 rounded-full" />
          <div className="space-y-2">
            <div className="w-full h-4 bg-slate-800 rounded" />
            <div className="w-5/6 h-4 bg-slate-800 rounded" />
            <div className="w-2/3 h-4 bg-slate-800 rounded" />
          </div>
          <div className="pt-3 border-t border-slate-900 flex justify-between">
            <div className="flex gap-2">
              <div className="w-14 h-6 bg-slate-800 rounded-full" />
              <div className="w-14 h-6 bg-slate-800 rounded-full" />
            </div>
            <div className="w-16 h-6 bg-slate-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
