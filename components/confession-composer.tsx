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
  crush: 'bg-[#FF6B00] text-white border-transparent',
  funny: 'bg-[#FCDAD7] text-slate-950 border-transparent',
  hostel: 'bg-[#C6EAA5] text-slate-950 border-transparent',
  appreciation: 'bg-[#EAE8E3] text-slate-950 border-transparent',
  question: 'bg-[#121212] text-white border-transparent',
  'campus-life': 'bg-[#121212] text-white border-transparent',
  confession: 'bg-[#FF6B00] text-white border-transparent',
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
          })
        );
      } catch (err) {
        console.warn('Could not save draft:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, categorySlug, recipientGender, targetBatch, targetDepartment]);

  const handleClearDraft = () => {
    setContent('');
    setRecipientGender('');
    setTargetBatch('');
    setTargetDepartment('');
    setShowPollBuilder(false);
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`]);
    }
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const copy = [...pollOptions];
    copy[idx] = val;
    setPollOptions(copy);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const categoryObj = MOCK_CATEGORIES.find((c) => c.slug === categorySlug) || MOCK_CATEGORIES[0];
      
      const payload: any = {
        content: content.trim(),
        category_slug: categorySlug,
        category_name: categoryObj.name,
        category_icon: categoryObj.icon,
        gender: userGender,
        recipient_gender: recipientGender || null,
        target_batch: targetBatch || null,
        target_department: targetDepartment || null,
      };

      if (showPollBuilder && pollQuestion.trim()) {
        payload.poll_data = {
          question: pollQuestion.trim(),
          options: pollOptions.map((opt, i) => ({
            id: `opt-${i + 1}`,
            text: opt.trim() || `Option ${i + 1}`,
            votes: 0,
          })),
          total_votes: 0,
        };
      }

      const res = await fetch('/api/confessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit confession');
      }

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="w-full sm:max-w-xl bg-white border border-slate-200/80 sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950 flex items-center gap-2 font-heading">
              <Sparkles className="w-5 h-5 text-[#FF6B00]" />
              Say what you couldn't say.
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Posting as <span className="text-[#FF6B00] font-bold font-mono">Anonymous • {userGender}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F4F3EF] border border-slate-200 text-slate-600 hover:text-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {draftRestoredNotice && (
          <div className="bg-[#FF6B00]/10 border-b border-[#FF6B00]/20 px-6 py-2 text-[#FF6B00] text-[11px] font-semibold flex items-center gap-1.5 animate-slide-down">
            <Lock className="w-3.5 h-3.5" />
            Restored draft from local storage
          </div>
        )}

        {successNotice && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-slide-down">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Confession published! Synced across all users.
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-slide-down">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Text Area */}
          <div className="space-y-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your confession here..."
              rows={4}
              maxLength={1000}
              className="w-full bg-[#F4F3EF] border border-slate-200 rounded-3xl p-4 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] placeholder-slate-500 resize-none font-sans"
              required
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Publicly Anonymous</span>
              <span className={content.length > 900 ? 'text-[#FF6B00] font-bold' : ''}>
                {content.length}/1000
              </span>
            </div>
          </div>

          {/* Category Selector Pill Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">Select Category</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_CATEGORIES.map((cat) => {
                const isSelected = categorySlug === cat.slug;
                const IconComponent = CATEGORY_ICONS[cat.icon] || Sparkles;
                const activeSwatch = CATEGORY_SWATCHES[cat.slug] || 'bg-[#FF6B00] text-white';

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategorySlug(cat.slug)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all border ${
                      isSelected
                        ? activeSwatch
                        : 'bg-[#F4F3EF] text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience Filters */}
          <div className="p-4 rounded-3xl bg-[#F4F3EF] border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-900 block font-heading">
              Optional Targeting Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">Gender</label>
                <select
                  value={recipientGender}
                  onChange={(e) => setRecipientGender(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#FF6B00] font-sans"
                >
                  <option value="">Anyone</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">Batch Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2K23"
                  value={targetBatch}
                  onChange={(e) => setTargetBatch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#FF6B00] font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1">Department</label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#FF6B00] font-sans"
                >
                  <option value="">All Depts</option>
                  <option value="CSE">CSE</option>
                  <option value="FPP">FPP (Food Processing)</option>
                  <option value="CE">Civil</option>
                  <option value="ME">Mechanical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Poll Toggle */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowPollBuilder(!showPollBuilder)}
              className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] hover:underline"
            >
              <BarChart2 className="w-4 h-4" />
              {showPollBuilder ? 'Remove Interactive Poll' : '+ Add Campus Poll to Confession'}
            </button>

            {showPollBuilder && (
              <div className="p-4 rounded-3xl bg-[#F4F3EF] border border-slate-200 space-y-3 animate-fade-in">
                <input
                  type="text"
                  placeholder="Poll Question (e.g., Should mess menu be changed?)"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
                />

                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleUpdatePollOption(idx, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-950 font-mono"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Submit & Draft Clear Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {content.length > 0 && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
              >
                Clear Draft
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="ml-auto px-6 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#FF6B00]/25 transition-all"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Posting...' : 'Post Confession'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
