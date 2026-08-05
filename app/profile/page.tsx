'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { ConfessionCard } from '@/components/confession-card';
import { Settings, AtSign, Loader2 } from 'lucide-react';
import { PublicConfession, UserProfile } from '@/lib/types';
import { getMyProfile, getMyStatsAndConfessions, saveUsernameAction } from '@/lib/actions/profile';
import { saveUsername } from '@/lib/friends-chat';

const EMPTY_PROFILE: UserProfile = {
  id: '',
  full_name: '...',
  gender: 'Prefer not to say',
  college_id: '',
  college_name: 'LNJPIT',
  batch: '',
  department: '',
  role: 'student',
  account_status: 'active',
  created_at: '',
};

// Skeleton loading pulse component
function SkeletonPulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [stats, setStats] = useState({ confessionsCount: 0, reactionsReceived: 0, activeChatsCount: 0 });
  const [myConfessions, setMyConfessions] = useState<PublicConfession[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-confessions' | 'saved'>('my-confessions');
  const [username, setUsername] = useState<string>('...');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameLocked, setUsernameLocked] = useState(true);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    // Phase 1: Load profile header FAST (single query) — includes DB username
    getMyProfile().then((p) => {
      if (p) {
        setProfile(p);
        // Username from database — synced across all devices
        const dbUsername = p.username || (p.email ? p.email.split('@')[0] : 'student');
        setUsername(dbUsername);
        setUsernameInput(dbUsername);
        // If a username is already set in DB, it's locked
        setUsernameLocked(!!p.username);
      }
      setProfileLoaded(true);
    }).catch(() => setProfileLoaded(true));

    // Phase 2: Load stats + confessions in parallel (heavier)
    getMyStatsAndConfessions().then((data) => {
      setStats(data.stats);
      setMyConfessions(data.confessions);
      setStatsLoaded(true);
    }).catch(() => setStatsLoaded(true));
  }, []);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameLocked || usernameSaving) return;
    const clean = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean.length < 3) {
      setUsernameError('Handle must be at least 3 characters.');
      return;
    }
    setUsernameSaving(true);
    setUsernameError('');
    try {
      const result = await saveUsernameAction(clean);
      if (result.success && result.username) {
        saveUsername(result.username);
        setUsername(result.username);
        setUsernameLocked(true);
        setIsEditingUsername(false);
      } else {
        setUsernameError(result.message);
      }
    } catch {
      setUsernameError('Failed to save. Please try again.');
    } finally {
      setUsernameSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-slate-900 flex flex-col pb-24 md:pb-8 selection:bg-[#FF6B00] selection:text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        
        {/* Profile Card Header */}
        <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!profileLoaded ? (
                <SkeletonPulse className="w-16 h-16 !rounded-2xl" />
              ) : profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Student'}
                  className="w-16 h-16 rounded-2xl border-2 border-[#FF6B00]/30 object-cover shadow-lg shadow-[#FF6B00]/15"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#FF6B00] flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-[#FF6B00]/25">
                  {(profile.full_name || 'S').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                {!profileLoaded ? (
                  <>
                    <SkeletonPulse className="w-40 h-5 mb-2" />
                    <SkeletonPulse className="w-56 h-3" />
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-black text-slate-950 font-heading flex items-center gap-2">
                      {profile.full_name}
                      <span className="text-xs bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded-full font-mono">
                        {profile.role}
                      </span>
                    </h1>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      @{username} • {profile.department || 'Engineering'} ({profile.batch || 'LNJPIT'})
                    </p>
                    {profile.email && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {profile.email}
                      </p>
                    )}
                  </>
                )}
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

          {/* Handle Display */}
          {isEditingUsername && !usernameLocked ? (
            <form onSubmit={handleSaveUsername} className="p-4 rounded-2xl bg-[#F4F3EF] border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800">Claim Student Handle</label>
              <p className="text-[11px] text-amber-600 font-semibold">⚠️ Choose carefully — your handle is permanent, synced across all devices, and cannot be changed later.</p>
              {usernameError && (
                <p className="text-[11px] text-red-500 font-semibold">{usernameError}</p>
              )}
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
                  disabled={usernameSaving}
                  className="px-4 py-2 rounded-xl bg-[#FF6B00] text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {usernameSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {usernameSaving ? 'Saving...' : 'Lock Handle'}
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
              {!statsLoaded ? (
                <SkeletonPulse className="w-8 h-6 mx-auto mb-1" />
              ) : (
                <span className="block text-xl font-black text-slate-950">{stats.confessionsCount}</span>
              )}
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Confessions</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              {!statsLoaded ? (
                <SkeletonPulse className="w-8 h-6 mx-auto mb-1" />
              ) : (
                <span className="block text-xl font-black text-[#FF6B00]">{stats.reactionsReceived}</span>
              )}
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reactions</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F3EF] border border-slate-200">
              {!statsLoaded ? (
                <SkeletonPulse className="w-8 h-6 mx-auto mb-1" />
              ) : (
                <span className="block text-xl font-black text-slate-950">{stats.activeChatsCount}</span>
              )}
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
            {!statsLoaded ? (
              // Skeleton cards while loading
              <>
                <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 shadow-sm space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-10 h-10 !rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <SkeletonPulse className="w-32 h-4" />
                      <SkeletonPulse className="w-20 h-3" />
                    </div>
                  </div>
                  <SkeletonPulse className="w-full h-16" />
                  <SkeletonPulse className="w-48 h-4" />
                </div>
                <div className="rounded-[28px] bg-white border border-slate-200/80 p-6 shadow-sm space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <SkeletonPulse className="w-10 h-10 !rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <SkeletonPulse className="w-28 h-4" />
                      <SkeletonPulse className="w-16 h-3" />
                    </div>
                  </div>
                  <SkeletonPulse className="w-full h-12" />
                  <SkeletonPulse className="w-40 h-4" />
                </div>
              </>
            ) : myConfessions.length > 0 ? (
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
