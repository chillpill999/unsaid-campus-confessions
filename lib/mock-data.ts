import {
  PublicConfession,
  PublicComment,
  Category,
  MoodStat,
  ReportItem,
  IdentityAccessLog,
  RevealedIdentityPayload,
  AnonymousConversation,
  AnonymousMessage,
  UserProfile,
} from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Confession', slug: 'confession', icon: '🔒', active: true },
  { id: 'cat-2', name: 'Crush', slug: 'crush', icon: '❤️', active: true },
  { id: 'cat-3', name: 'Funny', slug: 'funny', icon: '😂', active: true },
  { id: 'cat-4', name: 'Hostel', slug: 'hostel', icon: '🏠', active: true },
  { id: 'cat-5', name: 'Appreciation', slug: 'appreciation', icon: '✨', active: true },
  { id: 'cat-6', name: 'Question', slug: 'question', icon: '❓', active: true },
  { id: 'cat-7', name: 'Campus Life', slug: 'campus-life', icon: '🧭', active: true },
];

// CLEAN INITIAL STATE — ZERO SAMPLE CONFESSIONS OR UNWANTED DATA
export const MOCK_CONFESSIONS: PublicConfession[] = [];

export const MOCK_COMMENTS: Record<string, PublicComment[]> = {};

export const MOCK_CAMPUS_MOOD: MoodStat[] = [
  { mood: 'chaos', label: 'Chaos', emoji: '😂', percentage: 0, count: 0 },
  { mood: 'exhausted', label: 'Exhausted', emoji: '😴', percentage: 0, count: 0 },
  { mood: 'trauma', label: 'Assignment Trauma', emoji: '😭', percentage: 0, count: 0 },
  { mood: 'romantic', label: 'Romantic', emoji: '❤️', percentage: 0, count: 0 },
  { mood: 'motivated', label: 'Motivated', emoji: '🔥', percentage: 0, count: 0 },
  { mood: 'surviving', label: 'Surviving', emoji: '🫠', percentage: 0, count: 0 },
];

export const MOCK_DEMO_USER_PROFILE: UserProfile = {
  id: 'usr-demo-student-123',
  full_name: 'Student User',
  gender: 'Male',
  college_id: '11111111-1111-1111-1111-111111111111',
  college_name: 'Loknayak Jai Prakash Institute of Technology',
  batch: '2026',
  department: 'Computer Science & Engineering',
  role: 'student',
  account_status: 'active',
  created_at: new Date().toISOString(),
};

export const MOCK_DEMO_ADMIN_PROFILE: UserProfile = {
  id: 'usr-demo-admin-999',
  full_name: 'Campus Administrator',
  gender: 'Female',
  college_id: '11111111-1111-1111-1111-111111111111',
  college_name: 'Loknayak Jai Prakash Institute of Technology',
  batch: '2026',
  department: 'Administration',
  role: 'admin',
  account_status: 'active',
  created_at: new Date().toISOString(),
};

export const MOCK_REVEALED_IDENTITIES: Record<string, RevealedIdentityPayload> = {};

export const MOCK_AUDIT_LOGS: IdentityAccessLog[] = [];

export const MOCK_REPORTS: ReportItem[] = [];

export const MOCK_CONVERSATIONS: AnonymousConversation[] = [];

export const MOCK_MESSAGES: Record<string, AnonymousMessage[]> = {};

export const MOCK_INBOX_CONVERSATIONS: any[] = [];

export const MOCK_CONVERSATION_MESSAGES: Record<string, any[]> = {};
