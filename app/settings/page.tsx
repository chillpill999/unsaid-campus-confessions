'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { Settings, Shield, User, LogOut, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getSavedUsername, saveUsername } from '@/lib/friends-chat';

export default function SettingsPage() {
  const [userGender, setUserGender] = useState('Male');
  const [username, setUsername] = useState('student_lnj');
  const [usernameInput, setUsernameInput] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const g = localStorage.getItem('unsaid_user_gender');
      if (g) setUserGender(g);
    } catch {}

    const savedHandle = getSavedUsername();
    setUsername(savedHandle);
    setUsernameInput(savedHandle);
  }, []);

  const handleGenderChange = (newGender: string) => {
    setUserGender(newGender);
    try {
      localStorage.setItem('unsaid_user_gender', newGender);
      setNotice('Default gender updated for future confessions.');
      setTimeout(() => setNotice(''), 3000);
    } catch {}
  };

  const handleSaveHandle = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) return;
    saveUsername(clean);
    setUsername(clean);
    setNotice('Student handle saved successfully.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-950">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-950 font-heading">Settings & Preferences</h1>
            <p className="text-xs text-slate-600">Manage your anonymous handle and posting defaults.</p>
          </div>
        </div>

        {notice && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notice}
          </div>
        )}

        <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 shadow-xl space-y-6">
          
          {/* Section 1: Handle */}
          <form onSubmit={handleSaveHandle} className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-950 font-heading flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF6B00]" /> Student Handle
            </h3>
            <p className="text-xs text-slate-500">Your handle is used ONLY for 24-hour volatile student direct messages.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="flex-1 bg-[#F4F3EF] border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] font-mono"
                required
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs shadow-md"
              >
                Save
              </button>
            </div>
          </form>

          {/* Section 2: Default Gender */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-950 font-heading flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FF6B00]" /> Default Gender Label
            </h3>
            <p className="text-xs text-slate-500">Confessions display as <span className="font-mono text-[#FF6B00] font-bold">Anonymous • Gender</span>.</p>
            <div className="grid grid-cols-3 gap-2">
              {['Male', 'Female', 'Prefer not to say'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGenderChange(g)}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    userGender === g
                      ? 'bg-[#FF6B00] text-white border-transparent shadow-md'
                      : 'bg-[#F4F3EF] text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Logout */}
          <div className="pt-2 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-950 block">Account Session</span>
              <span className="text-[11px] text-slate-500 font-mono">Google OAuth Session Active</span>
            </div>
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs flex items-center gap-1.5 hover:bg-rose-100 transition-all font-mono"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Link>
          </div>

        </div>
      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
