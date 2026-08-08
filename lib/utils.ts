import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a random 6-character public confession code (e.g. #CF7K2P).
 * Cryptographically random, non-sequential, contains no timestamps or user IDs.
 */
/**
 * Strips sensitive voter identity metadata from poll data before it is sent to
 * the client. Poll votes are stored as an array of raw user UUIDs in
 * poll_options->'voters'; exposing that array would leak who voted.
 */
export function sanitizePollData(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const { voters, ...safe } = raw;
  if (safe.options && Array.isArray(safe.options)) {
    safe.options = safe.options.map((opt: any) => ({
      id: opt.id,
      text: opt.text,
      votes: opt.votes,
    }));
  }
  return safe;
}

export function generatePublicCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'CF';
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
