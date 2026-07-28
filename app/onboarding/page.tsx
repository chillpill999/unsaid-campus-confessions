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
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');

  const BRANCH_OPTIONS = [
    'Computer Science & Engineering (CSE)',
    'Civil Engineering (CE)',
    'Mechanical Engineering (ME)',
    'Electrical & Electronics Engineering (EEE)',
    'Electronics & Communication Engineering (ECE)',
    'Information Technology (IT)',
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
      setOnboardingError(err.message || 'Failed to save profile. Please try again.');
    }
  };

  const handleEnterFeed = () => {
    router.push('/feed');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-heading">Student Profile Setup</h1>
          <p className="text-xs text-slate-400">
            Your name is verified for account safety but hidden from other students. You only do this once.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Student Full Name <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-slate-500 font-mono">Private to Admins</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your real full name (e.g. Rahul Kumar)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Gender Presentation <span className="text-indigo-400">*</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Displayed alongside your anonymous posts (e.g. <span className="text-indigo-300 font-semibold">Anonymous • Male</span>).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Male', 'Female', 'Non-binary', 'Prefer not to say'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`p-3 rounded-xl text-xs font-semibold border transition-all ${
                    gender === g
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* College (Fixed) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">College / Institution</label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-indigo-300 font-bold flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Loknayak Jai Prakash Institute of Technology</span>
            </div>
          </div>

          {/* Branch & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch / Department <span className="text-rose-400">*</span></label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              >
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Batch / Graduation Year <span className="text-rose-400">*</span></label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {onboardingError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {onboardingError}
            </div>
          )}

          {/* Terms Agreement */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                required
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I accept the <strong className="text-white">Community Guidelines</strong> and understand that{' '}
                <strong className="text-indigo-300">my posts are anonymous to other students, not to platform administrators.</strong>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!acceptedTerms || !fullName.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 disabled:opacity-50 transition-all hover:scale-[1.01]"
          >
            Complete Onboarding & Proceed
          </button>
        </form>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full sm:max-w-lg bg-slate-900 sm:border border-t border-slate-800 sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center max-h-[92vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                Welcome to the side of LNJPIT nobody says out loud. 👀
              </h2>
              <p className="text-xs text-slate-400">Three core principles to keep our community safe and fun:</p>
            </div>

            <div className="space-y-3 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <div className="text-xs font-bold text-indigo-400">1. Stay anonymous.</div>
                <div className="text-xs text-slate-400">Your identity isn't shown to other students.</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <div className="text-xs font-bold text-purple-400">2. Keep it respectful.</div>
                <div className="text-xs text-slate-400">Confessions are for expression, not harassment or bullying.</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <div className="text-xs font-bold text-pink-400">3. Have fun.</div>
                <div className="text-xs text-slate-400">Crushes, hostel chaos, random thoughts—this is your campus wall.</div>
              </div>
            </div>

            <button
              onClick={handleEnterFeed}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>Enter the LNJPIT Feed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
