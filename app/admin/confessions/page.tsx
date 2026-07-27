'use client';

import React, { useState } from 'react';
import { FileText, Eye, Trash2, ShieldAlert } from 'lucide-react';
import { MOCK_CONFESSIONS } from '@/lib/mock-data';
import { IdentityRevealDialog } from '@/components/identity-reveal-dialog';
import { formatTimeAgo } from '@/lib/utils';

export default function AdminConfessionsPage() {
  const [selectedRevealCode, setSelectedRevealCode] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white font-heading flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Confessions Moderation
        </h1>
        <p className="text-xs text-slate-400">View public confessions and perform audited identity reveals.</p>
      </div>

      <div className="space-y-4">
        {MOCK_CONFESSIONS.map((confession) => (
          <div key={confession.id} className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-400 font-bold">#{confession.public_code}</span>
                <span className="text-slate-500">• {confession.gender}</span>
                <span className="text-slate-500">• {formatTimeAgo(confession.created_at)}</span>
              </div>
              <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-indigo-500/20">
                {confession.category_name}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-normal">{confession.content}</p>

            <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
              <span className="text-slate-500">Author: Anonymous</span>

              {/* Admin Action: Reveal Author Identity */}
              <button
                onClick={() => setSelectedRevealCode(confession.public_code)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Reveal Author Identity
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Identity Reveal Dialog */}
      <IdentityRevealDialog
        isOpen={Boolean(selectedRevealCode)}
        onClose={() => setSelectedRevealCode(null)}
        targetConfessionCode={selectedRevealCode || ''}
      />
    </div>
  );
}
