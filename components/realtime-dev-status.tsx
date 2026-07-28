'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { useRealtimeFeed, RealtimeStatus } from '@/lib/realtime/hooks';

export function RealtimeDevStatus() {
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const { status } = useRealtimeFeed({
    onConfessionPosted: (code) => addLog(`Confession Published: ${code}`),
    onConfessionDeleted: (code) => addLog(`Confession Moderated: ${code}`),
    onReactionUpdated: (code) => addLog(`Reaction Count Updated: ${code}`),
    onCommentUpdated: (code) => addLog(`Comment Count Updated: ${code}`),
    onPollUpdated: (code) => addLog(`Poll Results Updated: ${code}`),
  });

  function addLog(msg: string) {
    setEventLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 4),
    ]);
  }

  // Only render in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans text-xs">
      {isExpanded ? (
        <div className="bg-slate-900/95 border border-indigo-500/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl text-slate-200 w-72 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-100">Supabase Realtime</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Connection Status:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                status === 'CONNECTED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {status}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Live Event Activity
            </span>
            <div className="bg-slate-950/80 rounded-xl p-2 font-mono text-[10px] space-y-1 max-h-28 overflow-y-auto text-slate-300 border border-slate-800">
              {eventLog.length === 0 ? (
                <div className="text-slate-500 italic">Listening for live events...</div>
              ) : (
                eventLog.map((log, idx) => <div key={idx}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md text-slate-300 hover:text-white px-3 py-1.5 rounded-full shadow-lg transition-all"
        >
          {status === 'CONNECTED' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="font-semibold text-[11px]">Realtime Active</span>
        </button>
      )}
    </div>
  );
}
