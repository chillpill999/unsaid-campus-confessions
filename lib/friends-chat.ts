import { FriendContact, FriendRequest, DirectMessage } from './types';

const STORAGE_KEYS = {
  USERNAME: 'unsaid_prod_user_username',
  FRIEND_REQUESTS: 'unsaid_prod_friend_requests_v2',
  FRIENDS: 'unsaid_prod_friends_list_v2',
  DIRECT_MESSAGES: 'unsaid_prod_direct_messages_v2',
};

// 24 HOURS IN MILLISECONDS
export const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

// Helper to format 24h countdown
export function getRemainingTimeFormatted(expiresAtIso: string): string {
  const expiresAt = new Date(expiresAtIso).getTime();
  const now = Date.now();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) return 'Expired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${mins}m left`;
  }
  return `${mins}m left`;
}

// Ensure unique conversation key regardless of user order
export function getConversationKey(userA: string, userB: string): string {
  const sorted = [userA.toLowerCase(), userB.toLowerCase()].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

// ---------------- USERNAME LOGIC ----------------
export function getSavedUsername(): string {
  if (typeof window === 'undefined') return 'student_lnj';
  const saved = localStorage.getItem(STORAGE_KEYS.USERNAME);
  if (!saved) {
    const randomHandle = `student_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(STORAGE_KEYS.USERNAME, randomHandle);
    return randomHandle;
  }
  return saved;
}

export function saveUsername(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (typeof window !== 'undefined' && clean) {
    localStorage.setItem(STORAGE_KEYS.USERNAME, clean);
  }
  return clean;
}

export function isUsernameLocked(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(STORAGE_KEYS.USERNAME));
}

// ---------------- INITIALIZE CLEAN PRODUCTION STATE ----------------
export function initializeChatData(myUsername: string) {
  if (typeof window === 'undefined') return;

  // Clean up legacy v1 demo keys if present
  try {
    localStorage.removeItem('unsaid_friend_requests_v1');
    localStorage.removeItem('unsaid_friends_list_v1');
    localStorage.removeItem('unsaid_direct_messages_v1');
  } catch {}

  // 1. Initial Username if not set
  if (!localStorage.getItem(STORAGE_KEYS.USERNAME)) {
    localStorage.setItem(STORAGE_KEYS.USERNAME, myUsername);
  }

  // 2. Initial Friends list if empty
  if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify([]));
  }

  // 3. Initial Friend Requests if empty
  if (!localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify([]));
  }

  // 4. Initial Direct Messages if empty
  if (!localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify([]));
  }
}

// ---------------- FRIEND REQUESTS LOGIC ----------------
export function getFriendRequests(): FriendRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const str = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}

export function sendFriendRequest(senderUsername: string, senderName: string, targetUsername: string): { success: boolean; message: string } {
  const cleanTarget = targetUsername.trim().toLowerCase().replace(/^@/, '');
  if (!cleanTarget) {
    return { success: false, message: 'Please enter a valid student handle.' };
  }

  if (senderUsername.toLowerCase() === cleanTarget) {
    return { success: false, message: 'You cannot send a friend request to yourself.' };
  }

  const requests = getFriendRequests();
  const existing = requests.find(
    (r) =>
      r.sender_username.toLowerCase() === senderUsername.toLowerCase() &&
      r.receiver_username.toLowerCase() === cleanTarget &&
      r.status === 'pending'
  );

  if (existing) {
    return { success: false, message: 'Friend request already sent and pending!' };
  }

  // Check if already friends
  const friends = getFriendsList();
  if (friends.some((f) => f.username.toLowerCase() === cleanTarget)) {
    return { success: false, message: 'You are already connected with this student!' };
  }

  const newRequest: FriendRequest = {
    id: `req-${Date.now()}`,
    sender_username: senderUsername,
    sender_name: senderName || `@${senderUsername}`,
    receiver_username: cleanTarget,
    receiver_name: `@${cleanTarget}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const updated = [newRequest, ...requests];
  localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(updated));
  return { success: true, message: `Friend request sent to @${cleanTarget}!` };
}

export function acceptFriendRequest(requestId: string): FriendContact | null {
  const requests = getFriendRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  // Update request status
  const updatedReqs = requests.map((r) => (r.id === requestId ? { ...r, status: 'accepted' as const } : r));
  localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(updatedReqs));

  // Add to friends list
  const friends = getFriendsList();
  const gradients = [
    'from-indigo-600 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-purple-600 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ];
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  const newFriend: FriendContact = {
    username: req.sender_username,
    full_name: req.sender_name || `@${req.sender_username}`,
    department: 'LNJPIT Student',
    batch: 'Verified',
    avatar_gradient: randomGradient,
    status: 'accepted',
  };

  if (!friends.some((f) => f.username.toLowerCase() === newFriend.username.toLowerCase())) {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify([newFriend, ...friends]));
  }

  return newFriend;
}

export function rejectFriendRequest(requestId: string) {
  const requests = getFriendRequests();
  const updatedReqs = requests.map((r) => (r.id === requestId ? { ...r, status: 'rejected' as const } : r));
  localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(updatedReqs));
}

// ---------------- FRIENDS LIST LOGIC ----------------
export function getFriendsList(): FriendContact[] {
  if (typeof window === 'undefined') return [];
  try {
    const str = localStorage.getItem(STORAGE_KEYS.FRIENDS);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}

// ---------------- 24-HOUR VOLATILE DIRECT MESSAGES LOGIC ----------------

// PURGE MESSAGES OLDER THAN 24 HOURS OR INVALID EXPIRATION DATES
export function getAllStoredMessages(): DirectMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const str = localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES);
    if (!str) return [];
    const msgs: DirectMessage[] = JSON.parse(str);
    const now = Date.now();

    // Sanitize and purge expired or legacy bugged 100-year expiration messages
    const valid = msgs.filter((m) => {
      const expTime = new Date(m.expires_at).getTime();
      const createdTime = new Date(m.created_at).getTime();
      // Must be in the future AND must not exceed 25 hours from creation
      return expTime > now && expTime <= createdTime + 25 * 60 * 60 * 1000;
    });

    if (valid.length !== msgs.length) {
      localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(valid));
    }
    return valid;
  } catch (err) {
    console.error('Error fetching stored messages:', err);
    return [];
  }
}

export function purgeExpiredMessages(): DirectMessage[] {
  return getAllStoredMessages();
}

export function getDirectMessagesForConv(convKey: string, myUsername: string): DirectMessage[] {
  const messages = getAllStoredMessages();
  return messages
    .filter((m) => m.conversation_key === convKey)
    .map((m) => ({
      ...m,
      is_mine: m.sender_username.toLowerCase() === myUsername.toLowerCase(),
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function saveDirectMessageToLocal(msg: DirectMessage) {
  if (typeof window === 'undefined') return;
  const existing = getAllStoredMessages();
  if (!existing.some((m) => m.id === msg.id)) {
    const updated = [...existing, msg];
    localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(updated));
  }
}

export function sendDirectMessage(senderUsername: string, receiverUsername: string, content: string): DirectMessage {
  const existing = getAllStoredMessages();
  const convKey = getConversationKey(senderUsername, receiverUsername);
  const nowMs = Date.now();

  const newMsg: DirectMessage = {
    id: `dm-${nowMs}`,
    conversation_key: convKey,
    sender_username: senderUsername,
    receiver_username: receiverUsername,
    content: content.trim(),
    created_at: new Date(nowMs).toISOString(),
    expires_at: new Date(nowMs + 24 * 60 * 60 * 1000).toISOString(),
    is_mine: true,
  };

  saveDirectMessageToLocal(newMsg);
  return newMsg;
}
