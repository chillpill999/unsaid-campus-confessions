'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Lock, 
  Heart, 
  Laugh, 
  Home, 
  HelpCircle, 
  Compass, 
  Send,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { MOCK_CATEGORIES } from '@/lib/mock-data';
import { PublicConfession } from '@/lib/types';

interface ConfessionComposerProps {
  onClose: () => void;
  onPostSuccess: (newConfession: PublicConfession) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Lock,
  Heart,
  Laugh,
  Home,
  Sparkles,
  HelpCircle,
  Compass,
};

const CATEGORY_SWATCHES: Record<string, string> = {
  crush: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
  funny: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  hostel: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  appreciation: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
  question: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
  'campus-life': 'border-orange-500/50 bg-orange-500/10 text-orange-300',
  confession: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300',
};

const LOCAL_STORAGE_DRAFT_KEY = 'unsaid_confession_draft';

export function ConfessionComposer({ onClose, onPostSuccess }: ConfessionComposerProps) {
  const [content, setContent] = useState('');
  const [categorySlug, setCategorySlug] = useState('confession');
  const [recipientGender, setRecipientGender] = useState<string>('');
  const [targetBatch, setTargetBatch] = useState<string>('');
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [userGender, setUserGender] = useState<string>('Male');
  
  // Interactive Poll Builder
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);

  useEffect(() => {
    try {
      const g = localStorage.getItem('unsaid_user_gender');
      if (g) setUserGender(g);
    } catch {}

    // Restore draft from LocalStorage if available
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.content) {
          setContent(parsed.content);
          if (parsed.categorySlug) setCategorySlug(parsed.categorySlug);
          if (parsed.recipientGender) setRecipientGender(parsed.recipientGender);
          if (parsed.targetBatch) setTargetBatch(parsed.targetBatch);
          if (parsed.targetDepartment) setTargetDepartment(parsed.targetDepartment);
          setDraftRestoredNotice(true);
          setTimeout(() => setDraftRestoredNotice(false), 3000);
        }
      }
    } catch (err) {
      console.warn('Could not restore draft:', err);
    }
  }, []);

  // Autosave draft to LocalStorage on content change
  useEffect(() => {
    if (!content.trim()) {
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      return;
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_DRAFT_KEY,
          JSON.stringify({
            content,
            categorySlug,
            recipientGender,
            targetBatch,
            targetDepartment,
            updatedAt: Date.now(),
          })
        );
      } catch (err) {
        console.warn('Autosave draft failed:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, categorySlug, recipientGender, targetBatch, targetDepartment]);

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const selectedCategoryObj = MOCK_CATEGORIES.find((c) => c.slug === categorySlug) || MOCK_CATEGORIES[0];

    let pollPayload = null;
    if (showPollBuilder && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
      pollPayload = {
        question: pollQuestion.trim(),
        total_votes: 0,
        options: pollOptions.filter(o => o.trim()).map((optText, index) => ({
          id: `opt-${index + 1}`,
          text: optText.trim(),
          votes: 0,
        })),
      };
    }

    try {
      const response = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          category_slug: categorySlug,
          category_name: selectedCategoryObj.name,
          category_icon: selectedCategoryObj.icon,
          gender: userGender,
          recipient_gender: recipientGender || null,
          target_batch: targetBatch || null,
          target_department: targetDepartment || null,
          poll_data: pollPayload,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to publish confession.');
      }

      // Clear local storage draft
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);

      setSuccessNotice(true);
      const publishedConfession: PublicConfession = json.confession;

      setTimeout(() => {
        setSuccessNotice(false);
        onPostSuccess(publishedConfession);
        onClose();
        setContent('');
      }, 1000);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMsg(err.message || 'Database insert failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full sm:max-w-xl bg-slate-900 border border-slate-800 sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2 font-heading">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Say what you couldn't say.
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Posting as <span className="text-cyan-300 font-bold font-mono">Anonymous • {userGender}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {draftRestoredNotice && (
          <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-6 py-2 text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5 animate-slide-down">
            <Lock className="w-3.5 h-3.5" />
            Restored draft from local storage
          </div>
        )}

        {successNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-slide-down">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            Confession published! Synced across all users.
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-slide-down">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Text Area */}
          <div className="space-y-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your confession here... (Stored permanently in database)"
              rows={4}
              maxLength={1000}
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-4 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 placeholder-slate-600 resize-none font-sans"
              required
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Publicly Anonymous</span>
              <span className={content.length > 900 ? 'text-amber-400 font-bold' : ''}>
                {content.length} / 1000
              </span>
            </div>
          </div>

          {/* Category Swatches */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MOCK_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.icon] || Lock;
                const isSelected = categorySlug === cat.slug;
                const swatchStyle = CATEGORY_SWATCHES[cat.slug] || CATEGORY_SWATCHES.confession;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategorySlug(cat.slug)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                      isSelected
                        ? `${swatchStyle} shadow-lg scale-[1.02]`
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Target Metadata */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Specify Target (Optional)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Recipient Gender</label>
                <select
                  value={recipientGender}
                  onChange={(e) => setRecipientGender(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Target Batch</label>
                <input
                  type="text"
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Target Branch</label>
                <input
                  type="text"
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  placeholder="e.g. CSE"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Optional Poll Widget Toggle */}
          <div className="space-y-2">
            {!showPollBuilder ? (
              <button
                type="button"
                onClick={() => setShowPollBuilder(true)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-all"
              >
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Add Interactive Poll to Confession
              </button>
            ) : (
              <div className="p-4 rounded-3xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                    <BarChart2 className="w-4 h-4 text-cyan-400" /> Poll Builder
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPollBuilder(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                  >
                    Remove Poll
                  </button>
                </div>

                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll Question (e.g. Is this relatable?)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />

                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
                      className="text-xs text-cyan-400 font-bold hover:underline pt-1 block"
                    >
                      + Add Option
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-pink-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Publishing to Database...' : 'Post Anonymous Confession'}
          </button>
        </form>
      </div>
    </div>
  );
}
