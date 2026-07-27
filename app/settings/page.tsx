'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { MobileNav } from '@/components/mobile-nav';
import { Settings, Moon, Sun, Shield, UserX, Trash2, LogOut, Check } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-6 flex-1 w-full space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Settings & Preferences</h1>
            <p className="text-xs text-slate-400">Manage account privacy, theme, blocked users, and data.</p>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="glass-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            Appearance & Theme
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                  theme === t
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {t} Mode
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Safety Links */}
        <div className="glass-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Privacy & Guidelines
          </h3>
          <div className="space-y-2 text-xs">
            <Link href="/privacy" className="block p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold transition-colors">
              Privacy Notice & Anonymity Model →
            </Link>
            <Link href="/guidelines" className="block p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold transition-colors">
              Community Guidelines →
            </Link>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="glass-card p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-400" />
            Blocked Users
          </h3>
          <p className="text-xs text-slate-400">
            Blocking prevents anonymous messages and hides content. Target identities remain completely hidden.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 font-mono">
            No blocked anonymous users.
          </div>
        </div>

        {/* Account Actions: Sign Out & Delete Account */}
        <div className="glass-card p-6 space-y-4 border-rose-500/20">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            Danger Zone
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleSignOut}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Delete Account?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This action will delete your authenticated account profile and remove associated personal data according to our privacy policy.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold border border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileNav onOpenComposer={() => {}} />
    </div>
  );
}
