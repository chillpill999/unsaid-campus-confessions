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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full sm:max-w-lg bg-white border border-slate-200/80 sm:rounded-[28px] rounded-t-[28px] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="text-base font-black text-slate-950 font-heading">Admin Identity Reveal</h3>
          </div>
          <button onClick={handleClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        {!revealedIdentity && (
          <div className="p-3.5 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Strict Audit Enforcement</span>
              Identity should only be accessed for legitimate moderation, safety, or abuse investigations. Every reveal attempt is permanently recorded in audit logs.
            </div>
          </div>
        )}

        {/* Form OR Revealed Result */}
        {!revealedIdentity ? (
          <form onSubmit={handleReveal} className="space-y-4">
            <div className="text-xs text-slate-700 font-mono">
              Target Confession Code: <span className="text-[#FF6B00] font-bold">#{targetConfessionCode}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Reason for Access <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-[#F4F3EF] border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-950 focus:outline-none focus:border-[#FF6B00]"
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
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Explanation Required <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Provide detailed justification..."
                  className="w-full h-20 bg-[#F4F3EF] border border-slate-200 rounded-xl p-3 text-xs text-slate-950 focus:outline-none focus:border-[#FF6B00]"
                  required
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs shadow-md shadow-[#FF6B00]/20 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                {isSubmitting ? 'Verifying & Auditing...' : 'Confirm & Reveal Identity'}
              </button>
            </div>
          </form>
        ) : (
          /* REVEALED IDENTITY PAYLOAD */
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-3">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                {revealedIdentity.google_avatar_url ? (
                  <img
                    src={revealedIdentity.google_avatar_url}
                    alt="Google Profile"
                    className="w-12 h-12 rounded-2xl border border-slate-200 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center font-black text-base shadow-md">
                    {revealedIdentity.google_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5 font-heading">
                    {revealedIdentity.google_name}
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </h4>
                  <p className="text-xs text-[#FF6B00] font-mono font-bold">{revealedIdentity.google_email}</p>
                  <span className="inline-block text-[10px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 mt-1">
                    Ref: {revealedIdentity.internal_ref}
                  </span>
                </div>
              </div>

              {/* Profile Attributes */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-sans">
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono uppercase">College:</span>
                  <span className="font-bold text-slate-900">{revealedIdentity.college}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono uppercase">Batch / Dept:</span>
                  <span className="font-bold text-slate-900">
                    {revealedIdentity.department || 'N/A'} ('{revealedIdentity.batch.slice(-2)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono uppercase">Gender:</span>
                  <span className="font-bold text-[#FF6B00]">{revealedIdentity.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono uppercase">Account Status:</span>
                  <span className="font-bold text-emerald-600 uppercase">{revealedIdentity.account_status}</span>
                </div>
              </div>
            </div>

            {/* Platform Activity Stats */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 font-heading">
                <Activity className="w-3.5 h-3.5 text-[#FF6B00]" />
                Platform Activity Summary
              </h5>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-[#F4F3EF] p-2 rounded-xl border border-slate-200">
                  <span className="block text-slate-500 text-[10px]">Confessions</span>
                  <span className="text-sm font-black text-slate-950">{revealedIdentity.activity_stats.confessions_count}</span>
                </div>
                <div className="bg-[#F4F3EF] p-2 rounded-xl border border-slate-200">
                  <span className="block text-slate-500 text-[10px]">Comments</span>
                  <span className="text-sm font-black text-slate-950">{revealedIdentity.activity_stats.comments_count}</span>
                </div>
                <div className="bg-[#F4F3EF] p-2 rounded-xl border border-slate-200">
                  <span className="block text-slate-500 text-[10px]">Reports Recv</span>
                  <span className="text-sm font-black text-rose-600">{revealedIdentity.activity_stats.reports_received}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-md"
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
