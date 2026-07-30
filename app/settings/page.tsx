'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { Settings, Shield, User, LogOut, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { getSavedUsername, saveUsername, isUsernameLocked } from '@/lib/friends-chat';

export default function SettingsPage() {
  const [userGender, setUserGender] = useState('Male');
  const [genderLocked, setGenderLocked] = useState(false);
  const [username, setUsername] = useState('student_lnj');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameLocked, setUsernameLocked] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const g = localStorage.getItem('unsaid_user_gender');
      if (g) setUserGender(g);
      const gl = localStorage.getItem('unsaid_gender_locked');
      if (gl === 'true') setGenderLocked(true);
    } catch {}

    const savedHandle = getSavedUsername();
    setUsername(savedHandle);
    setUsernameInput(savedHandle);
    setUsernameLocked(isUsernameLocked());
  }, []);

  const handleGenderChange = (newGender: string) => {
    if (genderLocked) return;
    setUserGender(newGender);
    try {
      localStorage.setItem('unsaid_user_gender', newGender);
      setNotice('Default gender updated for future confessions.');
      setTimeout(() => setNotice(''), 3000);
    } catch {}
  };

  const handleSaveHandle = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameLocked) return;
    const clean = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) return;
    saveUsername(clean);
    setUsername(clean);
    setUsernameLocked(true);
    setNotice('Student handle permanently locked.');
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
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-950 font-heading flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF6B00]" /> Student Handle
              {usernameLocked && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Permanently Locked
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {usernameLocked
                ? 'Your handle is permanently set and cannot be changed.'
                : 'Your handle is used ONLY for 24-hour volatile student direct messages. Once saved, it cannot be changed.'}
            </p>
            {usernameLocked ? (
              <div className="flex items-center gap-3 bg-[#F4F3EF] px-4 py-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-black font-mono text-[#FF6B00]">@{username}</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
            ) : (
              <form onSubmit={handleSaveHandle} className="space-y-2">
                <p className="text-[11px] text-amber-600 font-semibold">⚠️ Choose carefully — your handle is permanent and cannot be changed later.</p>
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
                    Lock Handle
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 2: Default Gender */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-950 font-heading flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FF6B00]" /> Default Gender Label
              {genderLocked && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {genderLocked
                ? 'Your gender was set during registration and cannot be changed.'
                : <>Confessions display as <span className="font-mono text-[#FF6B00] font-bold">Anonymous • Gender</span>.</>}
            </p>
            {genderLocked ? (
              <div className="flex items-center gap-3 bg-[#F4F3EF] px-4 py-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-950">{userGender}</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Set during registration
                </span>
              </div>
            ) : (
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
            )}
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
