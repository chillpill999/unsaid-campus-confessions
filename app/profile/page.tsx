'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { User, Settings, AtSign, Clock, ShieldCheck, Heart } from 'lucide-react';
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
    const clean = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) return;
    saveUsername(clean);
    setUsername(clean);
    setIsEditingUsername(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        
        {/* Profile Card Header */}
        <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FF6B00] flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-[#FF6B00]/25">
                {(profile.full_name || 'Student').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-950 font-heading flex items-center gap-2">
                  {profile.full_name}
                  <span className="text-xs bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded-full font-mono">
                    {profile.role}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  @{username} • {profile.department || 'Engineering'} ({profile.batch || 'LNJPIT'})
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-2xl bg-[#F4F3EF] hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 font-mono shadow-sm"
            >
              <Settings className="w-4 h-4 text-[#FF6B00]" />
              Account Settings
            </Link>
          </div>

          {/* Handle Change Box */}
          {isEditingUsername ? (
            <form onSubmit={handleSaveUsername} className="p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800">Claim / Change Student Handle</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign className="w-4 h-4 text-[#FF6B00] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#FF6B00] font-mono"
                    placeholder="student_handle"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6B00] text-white font-bold text-xs shadow-md"
                >
                  Save Handle
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="px-3 py-2 rounded-xl bg-white text-slate-600 text-xs font-bold border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {/* User Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 font-mono text-center">
            <div className="p-3 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              <span className="block text-xl font-black text-slate-950">{stats.confessionsCount}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Confessions</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              <span className="block text-xl font-black text-[#FF6B00]">{stats.reactionsReceived}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reactions</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              <span className="block text-xl font-black text-slate-950">{stats.activeChatsCount}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Signals</span>
            </div>
          </div>
        </div>

        {/* Tab Controls & Confessions List */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('my-confessions')}
              className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 font-mono ${
                activeTab === 'my-confessions'
                  ? 'border-[#FF6B00] text-[#FF6B00]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              My Confessions ({myConfessions.length})
            </button>
          </div>

          <div className="space-y-4">
            {myConfessions.length > 0 ? (
              myConfessions.map((confession) => (
                <ConfessionCard key={confession.id} confession={confession} />
              ))
            ) : (
              <div className="rounded-[28px] bg-white border border-slate-200/80 p-8 text-center space-y-2 shadow-sm">
                <p className="text-xs font-bold text-slate-700">You haven't posted any confessions yet.</p>
                <p className="text-[11px] text-slate-500 font-mono">Your confessions remain 100% anonymous to other students.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
