'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { User, Settings, AtSign, Clock } from 'lucide-react';
import { getSavedUsername, saveUsername } from '@/lib/friends-chat';
import { PublicConfession, UserProfile } from '@/lib/types';

const EMPTY_PROFILE: UserProfile = {
  id: '',
  full_name: 'Student User',
  gender: 'Prefer not to say',
  college_id: '',
  college_name: 'Loknayak Jai Prakash Institute of Technology',
  batch: '',
  department: '',
  role: 'student',
  account_status: 'active',
  created_at: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [stats, setStats] = useState({
    confessionsCount: 0,
    reactionsReceived: 0,
    activeChatsCount: 0,
  });
  const [myConfessions, setMyConfessions] = useState<PublicConfession[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-confessions' | 'saved'>('my-confessions');
  const [username, setUsername] = useState<string>('student_lnj');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  useEffect(() => {
    const saved = getSavedUsername();
    setUsername(saved);
    setUsernameInput(saved);

    async function loadUserProfile() {
      try {
        const { getMyProfileSummary } = await import('@/lib/actions/profile');
        const summary = await getMyProfileSummary();
        if (summary.profile) {
          setProfile(summary.profile);
        }
        setStats(summary.stats);
        setMyConfessions(summary.confessions);
      } catch (err) {
        console.error('Failed to load profile summary:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadUserProfile();
  }, []);

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    const clean = saveUsername(usernameInput);
    setUsername(clean);
    setIsEditingUsername(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-8 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        {/* Private Profile Header */}
        <div className="glass-card p-6 sm:p-8 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/25">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  My Private Account
                  <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Private to You
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5 text-indigo-400" />
                    {username}
                  </span>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 underline font-semibold"
                  >
                    Edit Handle
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {profile.college_name} • {profile.department} ('{profile.batch.slice(-2)})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/inbox"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                24h Direct Messages
              </Link>
              <Link
                href="/settings"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>

          {/* Personal Private Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="block text-[11px] text-slate-500 uppercase font-semibold">Confessions</span>
              <span className="text-xl font-extrabold text-white font-mono">
                {isLoadingProfile ? '...' : stats.confessionsCount}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="block text-[11px] text-slate-500 uppercase font-semibold">Reactions Recv</span>
              <span className="text-xl font-extrabold text-indigo-400 font-mono">
                {isLoadingProfile ? '...' : stats.reactionsReceived}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="block text-[11px] text-slate-500 uppercase font-semibold">24h Volatile Chats</span>
              <span className="text-xl font-extrabold text-pink-400 font-mono">
                {isLoadingProfile ? '...' : stats.activeChatsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('my-confessions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my-confessions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Anonymous Confessions
          </button>
        </div>

        {/* Confessions List */}
        <div className="space-y-4">
          {isLoadingProfile ? (
            <div className="glass-card p-8 text-center text-xs text-slate-400">
              Loading your real activity...
            </div>
          ) : myConfessions.length > 0 ? (
            myConfessions.map((confession) => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))
          ) : (
            <div className="glass-card p-8 text-center text-xs text-slate-400">
              You have not posted any confessions yet.
            </div>
          )}
        </div>
      </main>

      {/* Edit Username Modal */}
      {isEditingUsername && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AtSign className="w-5 h-5 text-indigo-400" />
                Edit Username Handle
              </h3>
              <button onClick={() => setIsEditingUsername(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUsername} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username Handle</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs font-mono font-bold">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="alex_lnj"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Students can search this handle to send you friend requests for 24h direct chat.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Save Handle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
