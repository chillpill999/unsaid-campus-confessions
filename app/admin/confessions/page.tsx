'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Eye, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { IdentityRevealDialog } from '@/components/identity-reveal-dialog';
import { formatTimeAgo } from '@/lib/utils';
import { adminFetchConfessions, adminDeleteConfession } from '@/lib/actions/admin';
import { PublicConfession } from '@/lib/types';

export default function AdminConfessionsPage() {
  const [selectedRevealCode, setSelectedRevealCode] = useState<string | null>(null);
  const [confessions, setConfessions] = useState<PublicConfession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveConfessions = async () => {
    setIsLoading(true);
    try {
      const data = await adminFetchConfessions();
      setConfessions(data as PublicConfession[]);
    } catch (err) {
      console.error('Failed to load confessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfession = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete confession #${code}?`)) return;

    try {
      await adminDeleteConfession(id);
      setConfessions((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert('Error deleting confession: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLiveConfessions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-950 font-heading tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF6B00]" />
            Confessions Moderation
          </h1>
          <p className="text-xs text-slate-600">Real-time live confessions stream with audited identity reveals.</p>
        </div>

        <button
          onClick={fetchLiveConfessions}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#FF6B00] ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 rounded-[24px] border border-slate-200 text-center text-xs text-slate-500 font-medium shadow-sm">
          Loading live confessions stream...
        </div>
      ) : confessions.length === 0 ? (
        <div className="bg-white p-8 rounded-[28px] border border-slate-200 text-center space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-900 font-bold">No live confessions posted yet</p>
          <p className="text-[11px] text-slate-500">Student confessions will appear here live when submitted.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {confessions.map((confession) => (
            <div key={confession.id} className="bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[#FF6B00] font-bold text-sm">#{confession.public_code}</span>
                  <span className="text-slate-500 font-mono">• {confession.gender}</span>
                  <span className="text-slate-500 font-mono">• {formatTimeAgo(confession.created_at)}</span>
                </div>
                <span className="bg-[#FF6B00]/10 text-[#FF6B00] px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#FF6B00]/20 font-mono">
                  {confession.category_name || 'General'}
                </span>
              </div>

              <p className="text-xs text-slate-900 leading-relaxed font-sans">{confession.content}</p>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-mono text-[11px]">Author: Anonymous</span>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDeleteConfession(confession.id, confession.public_code)}
                    className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 font-bold text-xs border border-rose-500/20 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>

                  <button
                    onClick={() => setSelectedRevealCode(confession.public_code)}
                    className="flex-1 sm:flex-none justify-center px-4 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#FF6B00]/20"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Reveal Identity
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Identity Reveal Dialog */}
      <IdentityRevealDialog
        isOpen={Boolean(selectedRevealCode)}
        onClose={() => setSelectedRevealCode(null)}
        targetConfessionCode={selectedRevealCode || ''}
      />
    </div>
  );
}
