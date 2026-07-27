'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Eye, X, Check, Lock, ShieldCheck, Activity } from 'lucide-react';
import { RevealedIdentityPayload } from '@/lib/types';

interface IdentityRevealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetConfessionCode: string;
}

const REVEAL_REASONS = [
  'Harassment investigation',
  'Threat / safety issue',
  'Bullying',
  'Impersonation',
  'Privacy violation',
  'Repeated abuse',
  'Administrative investigation',
  'Other',
];

export function IdentityRevealDialog({
  isOpen,
  onClose,
  targetConfessionCode,
}: IdentityRevealDialogProps) {
  const [selectedReason, setSelectedReason] = useState(REVEAL_REASONS[0]);
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealedIdentity, setRevealedIdentity] = useState<RevealedIdentityPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other' ? otherReason.trim() : selectedReason;

    if (!finalReason) {
      setErrorMsg('Please specify a valid reason for identity access.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/identity-reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confession_code: targetConfessionCode,
          reason: finalReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reveal identity.');
      }

      setRevealedIdentity(data.identity);
    } catch (err: any) {
      setErrorMsg(err.message || 'An authorization error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRevealedIdentity(null);
    setSelectedReason(REVEAL_REASONS[0]);
    setOtherReason('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full sm:max-w-lg bg-slate-900 sm:border border-t border-slate-800 sm:rounded-3xl rounded-t-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Admin Identity Reveal</h3>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        {!revealedIdentity && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Strict Audit Enforcement</span>
              Identity should only be accessed for legitimate moderation, safety, or abuse investigations. Every reveal attempt is permanently recorded in audit logs.
            </div>
          </div>
        )}

        {/* Form OR Revealed Result */}
        {!revealedIdentity ? (
          <form onSubmit={handleReveal} className="space-y-4">
            <div className="text-xs text-slate-300">
              Target Confession Code: <span className="font-mono text-indigo-400 font-bold">#{targetConfessionCode}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reason for Access <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {REVEAL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {selectedReason === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Explanation Required <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Provide detailed justification..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                {isSubmitting ? 'Verifying & Auditing...' : 'Confirm & Reveal Identity'}
              </button>
            </div>
          </form>
        ) : (
          /* REVEALED IDENTITY PAYLOAD - NO SUPABASE AUTH UUID EXPOSED */
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                {revealedIdentity.google_avatar_url ? (
                  <img
                    src={revealedIdentity.google_avatar_url}
                    alt="Google Profile"
                    className="w-12 h-12 rounded-full border border-indigo-500/40 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base">
                    {revealedIdentity.google_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {revealedIdentity.google_name}
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </h4>
                  <p className="text-xs text-indigo-300 font-mono">{revealedIdentity.google_email}</p>
                  <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded mt-1">
                    Ref: {revealedIdentity.internal_ref}
                  </span>
                </div>
              </div>

              {/* Profile Attributes */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">College:</span>
                  <span className="font-semibold text-slate-200">{revealedIdentity.college}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Batch / Dept:</span>
                  <span className="font-semibold text-slate-200">
                    {revealedIdentity.department || 'N/A'} ('{revealedIdentity.batch.slice(-2)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Gender:</span>
                  <span className="font-semibold text-indigo-400">{revealedIdentity.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Account Status:</span>
                  <span className="font-semibold text-emerald-400 uppercase">{revealedIdentity.account_status}</span>
                </div>
              </div>
            </div>

            {/* Platform Activity Stats */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <h5 className="font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Platform Activity Summary
              </h5>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="block text-slate-500 text-[10px]">Confessions</span>
                  <span className="text-sm font-bold text-white">{revealedIdentity.activity_stats.confessions_count}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="block text-slate-500 text-[10px]">Comments</span>
                  <span className="text-sm font-bold text-white">{revealedIdentity.activity_stats.comments_count}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="block text-slate-500 text-[10px]">Reports Recv</span>
                  <span className="text-sm font-bold text-rose-400">{revealedIdentity.activity_stats.reports_received}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
              >
                Close Audit Dialog
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
