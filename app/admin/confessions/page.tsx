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
          <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Confessions Moderation
          </h1>
          <p className="text-xs text-slate-400">Real-time live confessions stream with audited identity reveals.</p>
        </div>

        <button
          onClick={fetchLiveConfessions}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="glass-card p-8 text-center text-xs text-slate-400">
          Loading live confessions...
        </div>
      ) : confessions.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-2 border-slate-800">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-semibold">No live confessions posted yet</p>
          <p className="text-[11px] text-slate-500">Student confessions will appear here live when submitted.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {confessions.map((confession) => (
            <div key={confession.id} className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-400 font-bold">#{confession.public_code}</span>
                  <span className="text-slate-500">• {confession.gender}</span>
                  <span className="text-slate-500">• {formatTimeAgo(confession.created_at)}</span>
                </div>
                <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-indigo-500/20">
                  {confession.category_name || 'General'}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-normal">{confession.content}</p>

              <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-slate-500">Author: Anonymous</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteConfession(confession.id, confession.public_code)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>

                  <button
                    onClick={() => setSelectedRevealCode(confession.public_code)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Reveal Author Identity
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
