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
  const [errorMsg, setErrorMsg] = useState('');

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
    setErrorMsg('');

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

    // 1. Submit via secure Server Action
    try {
      const res = await createConfession({
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

      if (res && !res.success) {
        setErrorMsg(res.error || 'Could not publish confession. Please verify your login status.');
        setIsSubmitting(false);
        return;
      }
    } catch (serverErr: any) {
      console.error('Server action insert failed:', serverErr);
      setErrorMsg(serverErr.message || 'We could not publish your confession. Please make sure you are logged in.');
      setIsSubmitting(false);
      return;
    }

    // 2. Persist to Local Storage to ensure NEVER lost on reload
    try {
      const existingStr = localStorage.getItem('unsaid_persistent_confessions') || '[]';
      const existing: PublicConfession[] = JSON.parse(existingStr);
      const updated = [newConfession, ...existing];
      localStorage.setItem('unsaid_persistent_confessions', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save to local storage:', err);
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
            className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {draftRestoredNotice && (
          <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-2 text-indigo-300 text-[11px] font-semibold flex items-center gap-1.5 animate-slide-down">
            <Lock className="w-3.5 h-3.5" />
            Restored draft from autosave
          </div>
        )}

        {successNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-slide-down">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Confession submitted successfully! Synced across all users.
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-slide-down">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            {errorMsg}
          </div>
        )}

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

          {/* Target Filter Options */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-3">
            <label className="block text-xs font-extrabold text-indigo-400">Specify Target (Optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">RECIPIENT GENDER</label>
                <select
                  value={recipientGender}
                  onChange={(e) => setRecipientGender(e.target.value as Gender)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">TARGET BATCH</label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 focus:outline-none placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">TARGET BRANCH</label>
                <input
                  type="text"
                  placeholder="e.g. CSE"
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Interactive Poll */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPoll}
                onChange={(e) => setHasPoll(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-extrabold text-purple-400">Attach Interactive Poll</span>
            </label>

            {hasPoll && (
              <div className="space-y-3 animate-fade-in">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600"
                  required
                />
                
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                        required
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-2 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:scale-[1.01] active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <span>{isSubmitting ? 'Publishing confession...' : 'Publish Confession'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
