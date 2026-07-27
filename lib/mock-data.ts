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
  { id: 'cat-1', name: 'Confession', slug: 'confession', icon: 'Lock', active: true },
  { id: 'cat-2', name: 'Crush', slug: 'crush', icon: 'Heart', active: true },
  { id: 'cat-3', name: 'Funny', slug: 'funny', icon: 'Laugh', active: true },
  { id: 'cat-4', name: 'Hostel', slug: 'hostel', icon: 'Home', active: true },
  { id: 'cat-5', name: 'Appreciation', slug: 'appreciation', icon: 'Sparkles', active: true },
  { id: 'cat-6', name: 'Question', slug: 'question', icon: 'HelpCircle', active: true },
  { id: 'cat-7', name: 'Campus Life', slug: 'campus-life', icon: 'Compass', active: true },
];

export const MOCK_CONFESSIONS: PublicConfession[] = [
  {
    id: 'conf-1',
    public_code: 'CF9K4M',
    content: 'Whoever keeps leaving tiny motivational sticky notes in the 3rd-floor library books, please never stop 😭❤️ You literally saved my midterms week.',
    category_name: 'Appreciation',
    category_slug: 'appreciation',
    category_icon: 'Sparkles',
    gender: 'Female',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    reaction_counts: { relatable: 142, funny: 12, support: 98, interesting: 45 },
    comment_count: 8,
    is_featured: true,
    user_reaction: 'support',
  },
  {
    id: 'conf-2',
    public_code: 'CF7K2P',
    content: "I've been sitting across from someone with a green laptop sticker near the canteen every Tuesday at 1 PM for three weeks. Still haven't found the courage to say hi...",
    category_name: 'Crush',
    category_slug: 'crush',
    category_icon: 'Heart',
    gender: 'Male',
    recipient_gender: 'Female',
    target_batch: '2026',
    target_department: 'Computer Science',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    reaction_counts: { relatable: 189, funny: 34, support: 112, interesting: 67 },
    comment_count: 14,
    user_reaction: 'relatable',
  },
  {
    id: 'conf-3',
    public_code: 'CF3X8L',
    content: 'I chose the back bench in 8 AM lecture specifically to avoid attention and somehow ended up being appointed class representative responsible for attendance 🫠',
    category_name: 'Funny',
    category_slug: 'funny',
    category_icon: 'Laugh',
    gender: 'Male',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    reaction_counts: { relatable: 230, funny: 310, support: 45, interesting: 88 },
    comment_count: 19,
    poll_data: {
      question: 'Should I resign or embrace the chaos?',
      total_votes: 184,
      options: [
        { id: 'opt-1', text: 'Resign immediately 💀', votes: 62 },
        { id: 'opt-2', text: 'Embrace chaos & mark yourself present 👑', votes: 122 },
      ],
    },
  },
  {
    id: 'conf-4',
    public_code: 'CF8M1N',
    content: 'Hostel Block B fire alarm went off at 3:15 AM because someone tried to bake a mug cake in a plastic container. We were all standing in pajamas outside in 10°C weather...',
    category_name: 'Hostel',
    category_slug: 'hostel',
    category_icon: 'Home',
    gender: 'Non-binary',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    reaction_counts: { relatable: 95, funny: 240, support: 30, interesting: 50 },
    comment_count: 11,
  },
  {
    id: 'conf-5',
    public_code: 'CF5P9Q',
    content: 'Does anyone actually understand the homework assignment for CS 106B or are we all just pretending during office hours?',
    category_name: 'Question',
    category_slug: 'question',
    category_icon: 'HelpCircle',
    gender: 'Female',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hours ago
    reaction_counts: { relatable: 320, funny: 85, support: 140, interesting: 22 },
    comment_count: 23,
  },
];

export const MOCK_COMMENTS: Record<string, PublicComment[]> = {
  'conf-2': [
    {
      id: 'comm-1',
      confession_id: 'conf-2',
      content: 'Bro just ask if you can borrow a chair or ask about their stickers! Worst case you get a new friend.',
      anonymous_label: 'Anonymous A',
      gender: 'Male',
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      replies: [
        {
          id: 'comm-1-1',
          confession_id: 'conf-2',
          parent_comment_id: 'comm-1',
          content: 'Second this! Sticker icebreakers NEVER fail.',
          anonymous_label: 'Anonymous B',
          gender: 'Female',
          created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        },
      ],
    },
    {
      id: 'comm-2',
      confession_id: 'conf-2',
      content: 'Wait... is the sticker a cat with sunglasses? Because I sit there around 1 PM 👀',
      anonymous_label: 'Anonymous C',
      gender: 'Female',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ],
};

export const MOCK_CAMPUS_MOOD: MoodStat[] = [
  { mood: 'chaos', label: 'Chaos', emoji: '😂', percentage: 38, count: 184 },
  { mood: 'exhausted', label: 'Exhausted', emoji: '😴', percentage: 31, count: 150 },
  { mood: 'trauma', label: 'Assignment Trauma', emoji: '😭', percentage: 15, count: 72 },
  { mood: 'romantic', label: 'Romantic', emoji: '❤️', percentage: 9, count: 44 },
  { mood: 'motivated', label: 'Motivated', emoji: '🔥', percentage: 4, count: 19 },
  { mood: 'surviving', label: 'Surviving', emoji: '🫠', percentage: 3, count: 14 },
];

export const MOCK_DEMO_USER_PROFILE: UserProfile = {
  id: 'usr-demo-student-123',
  gender: 'Male',
  college_id: '11111111-1111-1111-1111-111111111111',
  college_name: 'Stanford University',
  batch: '2026',
  department: 'Computer Science',
  role: 'student',
  account_status: 'active',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
};

export const MOCK_DEMO_ADMIN_PROFILE: UserProfile = {
  id: 'usr-demo-admin-999',
  gender: 'Female',
  college_id: '11111111-1111-1111-1111-111111111111',
  college_name: 'Stanford University',
  batch: 'Faculty/Admin',
  department: 'Campus Safety',
  role: 'admin',
  account_status: 'active',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
};

// FICTIONAL REVEALED IDENTITY PAYLOAD FOR DEMO ADMIN TESTING
export const MOCK_REVEALED_IDENTITIES: Record<string, RevealedIdentityPayload> = {
  'CF7K2P': {
    internal_ref: 'REF-STU-884920',
    google_name: 'Alex Smith (Demo Student)',
    google_email: 'alex.smith.demo@stanford.edu',
    google_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    college: 'Stanford University',
    batch: '2026',
    department: 'Computer Science',
    gender: 'Male',
    account_created: '2026-01-15',
    account_status: 'active',
    activity_stats: {
      confessions_count: 4,
      comments_count: 18,
      reports_received: 0,
      previous_warnings: 0,
      restrictions_history: [],
    },
  },
};

export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rep-1',
    reporter_anonymous_label: 'Anonymous Student',
    confession_code: 'CF3X8L',
    reason: 'Spam',
    details: 'Repeated post submission within 5 minutes.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'rep-2',
    reporter_anonymous_label: 'Anonymous Student',
    comment_content: 'Contains personal phone number mention.',
    reason: 'Personal information',
    details: 'Phone number in comment thread.',
    status: 'under_review',
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

export const MOCK_AUDIT_LOGS: IdentityAccessLog[] = [
  {
    id: 'log-1',
    admin_id: 'usr-demo-admin-999',
    admin_name: 'Chief Admin (Campus Safety)',
    target_internal_ref: 'REF-STU-884920',
    confession_code: 'CF7K2P',
    reason: 'Harassment investigation',
    details: 'Verified safe content after student report review.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export const MOCK_INBOX_CONVERSATIONS: AnonymousConversation[] = [
  {
    id: 'conv-1',
    confession_id: 'conf-2',
    confession_code: 'CF7K2P',
    my_label: 'Anonymous (Author)',
    peer_label: 'Anonymous (Library Girl?)',
    last_message: 'Haha yes! That was me with the cat sticker! 🐱',
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    status: 'active',
  },
];

export const MOCK_CONVERSATION_MESSAGES: Record<string, AnonymousMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_label: 'Anonymous (Author)',
      content: 'Hey... saw your comment on #CF7K2P. Are you really the one sitting near the canteen with the green laptop?',
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      is_mine: true,
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_label: 'Anonymous (Library Girl?)',
      content: 'Haha yes! That was me with the cat sticker! 🐱 Come say hi next Tuesday!',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      is_mine: false,
    },
  ],
};
