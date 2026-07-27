'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Sparkles, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Category, Gender, PublicConfession } from '@/lib/types';
import { generatePublicCode } from '@/lib/utils';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > 1000) return;

    setIsSubmitting(true);

    const selectedCategory = MOCK_CATEGORIES.find((c) => c.id === categoryId) || MOCK_CATEGORIES[0];

    const newConfession: PublicConfession = {
      id: `conf-${Date.now()}`,
      public_code: generatePublicCode(),
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

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessNotice(true);
      localStorage.removeItem('unsaid_confession_draft');
      setTimeout(() => {
        setSuccessNotice(false);
        onPostSuccess(newConfession);
        onClose();
        setContent('');
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Confession Text Area */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your story, crush, question, or hostel chaos..."
              className="w-full h-36 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all resize-none"
              maxLength={1000}
              required
            />
            <div className="absolute bottom-3 right-3 text-[11px] font-mono text-slate-500">
              {content.length}/1000
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_CATEGORIES.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Filters (Optional) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Batch (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 2026"
                value={targetBatch}
                onChange={(e) => setTargetBatch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Department (Optional)</label>
              <input
                type="text"
                placeholder="e.g. CS / Mechanical"
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Optional Poll Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setHasPoll(!hasPoll)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {hasPoll ? 'Remove Anonymous Poll' : '+ Add Anonymous Poll'}
            </button>

            {hasPoll && (
              <div className="mt-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Poll Question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 pt-1"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Privacy Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Keep it safe & anonymous</span>
              Avoid names, phone numbers, addresses, student IDs, private screenshots, or targeted harassment.
            </div>
          </div>

          {/* Success Animation Banner */}
          {successNotice && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2 animate-bounce">
              <Sparkles className="w-5 h-5" />
              Your confession is out there 👀
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Confession 👀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
