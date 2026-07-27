// TypeScript Types for Unsaid Platform

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
export type UserRole = 'student' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'banned';
export type ReactionType = 'relatable' | 'funny' | 'support' | 'interesting';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ReportStatus = 'pending' | 'under_review' | 'actioned' | 'dismissed';
export type CampusMood = 'chaos' | 'exhausted' | 'trauma' | 'romantic' | 'motivated' | 'surviving';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  active: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  total_votes: number;
  user_voted_option_id?: string;
}

// SAFE PUBLIC CONFESSION SHAPE - STRICTLY NO AUTHOR_ID OR AUTH METADATA
export interface PublicConfession {
  id: string;
  public_code: string;
  content: string;
  category_name: string;
  category_slug: string;
  category_icon: string;
  image_path?: string | null;
  recipient_gender?: Gender | null;
  target_batch?: string | null;
  target_department?: string | null;
  gender: Gender;
  poll_data?: PollData | null;
  created_at: string;
  reaction_counts: Record<ReactionType, number>;
  comment_count: number;
  user_reaction?: ReactionType | null;
  is_bookmarked?: boolean;
  is_featured?: boolean;
  is_mine?: boolean;
  can_edit?: boolean;
}

// SAFE PUBLIC COMMENT SHAPE - THREAD-SCOPED ANONYMOUS LABEL
export interface PublicComment {
  id: string;
  confession_id: string;
  parent_comment_id?: string | null;
  content: string;
  anonymous_label: string; // e.g. "Anonymous A", "Anonymous B"
  gender: Gender;
  created_at: string;
  replies?: PublicComment[];
  is_mine?: boolean;
  can_edit?: boolean;
}

export interface UserProfile {
  id: string; // internal UUID
  gender: Gender;
  college_id: string;
  college_name: string;
  batch: string;
  department?: string;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
}

// ADMIN IDENTITY REVEAL PAYLOAD - EXPOSES REAL IDENTITY ONLY TO AUTHORIZED ADMIN
export interface RevealedIdentityPayload {
  internal_ref: string;
  google_name: string;
  google_email: string;
  google_avatar_url?: string;
  college: string;
  batch: string;
  department: string;
  gender: Gender;
  account_created: string;
  account_status: AccountStatus;
  activity_stats: {
    confessions_count: number;
    comments_count: number;
    reports_received: number;
    previous_warnings: number;
    restrictions_history: string[];
  };
}

export interface IdentityAccessLog {
  id: string;
  admin_id: string;
  admin_name: string;
  target_internal_ref: string;
  confession_code?: string;
  comment_id?: string;
  reason: string;
  details?: string;
  created_at: string;
}

export interface ReportItem {
  id: string;
  reporter_anonymous_label: string;
  confession_code?: string;
  comment_content?: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  created_at: string;
}

export interface AnonymousConversation {
  id: string;
  confession_id: string;
  confession_code: string;
  my_label: string; // e.g., "Anonymous (Crush Author)"
  peer_label: string; // e.g., "Anonymous B"
  last_message: string;
  updated_at: string;
  status: 'active' | 'blocked';
}

export interface AnonymousMessage {
  id: string;
  conversation_id: string;
  sender_label: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

export interface MoodStat {
  mood: CampusMood;
  label: string;
  emoji: string;
  percentage: number;
  count: number;
}
