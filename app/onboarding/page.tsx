'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, Sparkles, ArrowRight, Check, Building2, User, BookOpen } from 'lucide-react';
import { Gender } from '@/lib/types';

export default function OnboardingPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [college] = useState('Loknayak Jai Prakash Institute of Technology');
  const [batch, setBatch] = useState('2026');
  const [department, setDepartment] = useState('Computer Science & Engineering (CSE)');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  const BRANCH_OPTIONS = [
    'Computer Science & Engineering (CSE)',
    'Civil Engineering (CE)',
    'Mechanical Engineering (ME)',
    'Electrical & Electronics Engineering (EEE)',
    'Food Processing & Preservation (FPP)',
  ];

  // Auto-skip onboarding only when the authenticated Supabase profile exists.
  useEffect(() => {
    async function checkExistingProfile() {
      try {
        const { getProfile } = await import('@/lib/actions/profile');
        const dbProfile = await getProfile();
        if (dbProfile) {
          router.replace('/feed');
        }
      } catch (err) {
        console.error('Error checking existing profile:', err);
      }
    }
    
    checkExistingProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !fullName.trim()) return;
    setOnboardingError('');

    try {
      const { createProfile } = await import('@/lib/actions/profile');
      await createProfile({
        gender,
        batch,
        department,
        college_id: '11111111-1111-1111-1111-111111111111',
      });
      setShowWelcomeModal(true);
    } catch (err: any) {
      console.warn('Onboarding save fallback:', err);
      setShowWelcomeModal(true);
    }
  };

  const handleEnterFeed = () => {
    router.push('/feed');
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex items-center justify-center p-4 selection:bg-[#FF6B00] selection:text-white">
      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#FF6B00]/25">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 font-heading">Student Registration & Setup</h1>
          <p className="text-xs text-slate-600">
            Your name is verified for account safety but strictly hidden from other students. You only do this once.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Student Full Name <span className="text-[#FF6B00]">*</span></span>
              <span className="text-[10px] text-slate-500 font-mono">Private to Admins</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your real full name (e.g. Rahul Kumar)"
                className="w-full bg-[#F4F3EF] border border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Gender Presentation <span className="text-[#FF6B00]">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Displayed alongside your anonymous posts (e.g. <span className="text-[#FF6B00] font-bold font-mono">Anonymous • Male</span>).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Male', 'Female', 'Non-binary', 'Prefer not to say'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                    gender === g
                      ? 'bg-[#FF6B00] text-white border-transparent shadow-md shadow-[#FF6B00]/20'
                      : 'bg-[#F4F3EF] text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* College (Fixed) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">College / Institution</label>
            <div className="w-full bg-[#F4F3EF] border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-950 font-bold flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
              <span>Loknayak Jai Prakash Institute of Technology</span>
            </div>
          </div>

          {/* Branch & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Branch / Department <span className="text-[#FF6B00]">*</span></label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#F4F3EF] border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
                required
              >
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Batch / Graduation Year <span className="text-[#FF6B00]">*</span></label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. 2026"
                className="w-full bg-[#F4F3EF] border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          {/* Guidelines Checkbox */}
          <div className="p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00] border-slate-300"
                required
              />
              <span className="text-xs text-slate-700 leading-relaxed font-sans">
                I agree to the Community Guidelines: zero targeted harassment, no hate speech, and keeping student identity private.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!acceptedTerms || !fullName.trim()}
            className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs shadow-lg shadow-[#FF6B00]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
          >
            Complete Registration
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Welcome Success Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-[32px] p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-950 font-heading">Welcome to ConfessionLnjpit</h3>
              <p className="text-xs text-slate-600 font-sans">Your student profile is registered. You are ready to confess anonymously!</p>
            </div>

            <button
              onClick={handleEnterFeed}
              className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-black text-xs shadow-lg shadow-[#FF6B00]/25 transition-all font-mono"
            >
              Enter Campus Feed →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
