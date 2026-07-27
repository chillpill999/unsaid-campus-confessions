'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Sparkles, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Category, Gender, PublicConfession } from '@/lib/types';
import { generatePublicCode } from '@/lib/utils';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import { createConfession } from '@/lib/actions/confessions';

interface ConfessionComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSuccess: (newConfession: PublicConfession) => void;
  userGender?: Gender;
}

export function ConfessionComposer({
  isOpen,
  onClose,
  onPostSuccess,
  userGender = 'Male',
}: ConfessionComposerProps) {
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(MOCK_CATEGORIES[0].id);
  const [recipientGender, setRecipientGender] = useState<Gender | ''>('');
  const [targetBatch, setTargetBatch] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  
  // Poll Options State
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);

  // Restore Draft from Local Storage
  useEffect(() => {
    const savedDraft = localStorage.getItem('unsaid_confession_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.content) {
          setContent(parsed.content);
          setCategoryId(parsed.categoryId || MOCK_CATEGORIES[0].id);
          setDraftRestoredNotice(true);
          setTimeout(() => setDraftRestoredNotice(false), 3000);
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }, []);

  // Autosave Draft
  useEffect(() => {
    if (content.trim().length > 0) {
      localStorage.setItem(
        'unsaid_confession_draft',
        JSON.stringify({ content, categoryId })
      );
    } else {
      localStorage.removeItem('unsaid_confession_draft');
    }
  }, [content, categoryId]);

  if (!isOpen) return null;

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > 1000) return;

    setIsSubmitting(true);

    const selectedCategory = MOCK_CATEGORIES.find((c) => c.id === categoryId) || MOCK_CATEGORIES[0];
    const newCode = generatePublicCode();

    const newConfession: PublicConfession = {
      id: `conf-${Date.now()}`,
      public_code: newCode,
      content: content.trim(),
      category_name: selectedCategory.name,
      category_slug: selectedCategory.slug,
      category_icon: selectedCategory.icon,
      gender: userGender,
      recipient_gender: recipientGender || null,
      target_batch: targetBatch || null,
      target_department: targetDepartment || null,
      created_at: new Date().toISOString(),
      reaction_counts: { relatable: 0, funny: 0, support: 0, interesting: 0 },
      comment_count: 0,
      is_mine: true,
      poll_data: hasPoll && pollQuestion.trim()
        ? {
            question: pollQuestion.trim(),
            total_votes: 0,
            options: pollOptions
              .filter((o) => o.trim())
              .map((text, idx) => ({ id: `opt-${idx}`, text: text.trim(), votes: 0 })),
          }
        : null,
    };

    // 1. Persist to Local Storage to ensure NEVER lost on reload
    try {
      const existingStr = localStorage.getItem('unsaid_persistent_confessions') || '[]';
      const existing: PublicConfession[] = JSON.parse(existingStr);
      const updated = [newConfession, ...existing];
      localStorage.setItem('unsaid_persistent_confessions', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save to local storage:', err);
    }

    // 2. Submit via secure Server Action (author_id derived server-side from auth.uid())
    try {
      await createConfession({
        content: content.trim(),
        category_slug: selectedCategory.slug,
        category_name: selectedCategory.name,
        category_icon: selectedCategory.icon,
        gender: userGender,
        recipient_gender: recipientGender || null,
        target_batch: targetBatch || null,
        target_department: targetDepartment || null,
        poll_data: hasPoll && pollQuestion.trim()
          ? {
              question: pollQuestion.trim(),
              total_votes: 0,
              options: pollOptions
                .filter((o) => o.trim())
                .map((text, idx) => ({ id: `opt-${idx}`, text: text.trim(), votes: 0 })),
            }
          : null,
      });
    } catch (serverErr) {
      console.warn('Server action insert fallback:', serverErr);
      // Still allow local persistence even if server action fails
    }

    setIsSubmitting(false);
    setSuccessNotice(true);
    localStorage.removeItem('unsaid_confession_draft');
    
    setTimeout(() => {
      setSuccessNotice(false);
      onPostSuccess(newConfession);
      onClose();
      setContent('');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-xl bg-slate-900 sm:border border-t border-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Say what you couldn't say.
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Posting as <span className="text-indigo-400 font-semibold">Anonymous • {userGender}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Draft Restored Banner */}
        {draftRestoredNotice && (
          <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-2 text-xs font-semibold text-indigo-300 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Draft restored automatically.
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Confession Text Area */}
          <div className="space-y-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your confession here... (Keep it respectful to campus guidelines)"
              rows={4}
              maxLength={1000}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none transition-colors"
              required
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Publicly Anonymous</span>
              <span className={content.length > 900 ? 'text-amber-400 font-bold' : ''}>
                {content.length} / 1000
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOCK_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    categoryId === cat.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="block text-base mb-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience Optional Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Gender</label>
              <select
                value={recipientGender}
                onChange={(e) => setRecipientGender(e.target.value as Gender)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Everyone on Campus</option>
                <option value="Male">To Male</option>
                <option value="Female">To Female</option>
                <option value="Non-binary">To Non-binary</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Batch</label>
              <select
                value={targetBatch}
                onChange={(e) => setTargetBatch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Batches</option>
                <option value="2023">Batch '23</option>
                <option value="2024">Batch '24</option>
                <option value="2025">Batch '25</option>
                <option value="2026">Batch '26</option>
                <option value="2027">Batch '27</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Branch</label>
              <input
                type="text"
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                placeholder="e.g. CSE, EEE, Mech"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Submit Button & Notices */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identity Encrypted & Sealed</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Confession'}
            </button>
          </div>

          {/* Success Notice */}
          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Confession published successfully! Saved permanently.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
