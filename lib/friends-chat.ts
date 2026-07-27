import { FriendContact, FriendRequest, DirectMessage } from './types';

const STORAGE_KEYS = {
  USERNAME: 'unsaid_user_username',
  FRIEND_REQUESTS: 'unsaid_friend_requests_v1',
  FRIENDS: 'unsaid_friends_list_v1',
  DIRECT_MESSAGES: 'unsaid_direct_messages_v1',
};

// 24 HOURS IN MILLISECONDS
export const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

// Campus directory of searchable students with usernames
export const MOCK_CAMPUS_DIRECTORY: FriendContact[] = [
  {
    username: 'priya_ece',
    full_name: 'Priya Sharma',
    department: 'ECE',
    batch: "'26",
    avatar_gradient: 'from-pink-500 to-rose-600',
  },
  {
    username: 'rahul_cse',
    full_name: 'Rahul Kumar',
    department: 'CSE',
    batch: "'26",
    avatar_gradient: 'from-indigo-600 to-blue-600',
  },
  {
    username: 'aarti_tech',
    full_name: 'Aarti Singh',
    department: 'IT',
    batch: "'25",
    avatar_gradient: 'from-purple-600 to-pink-600',
  },
  {
    username: 'vikram_mech',
    full_name: 'Vikram Patel',
    department: 'ME',
    batch: "'27",
    avatar_gradient: 'from-amber-500 to-orange-600',
  },
  {
    username: 'sneha_civil',
    full_name: 'Sneha Verma',
    department: 'CE',
    batch: "'26",
    avatar_gradient: 'from-emerald-500 to-teal-600',
  },
];

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
  return localStorage.getItem(STORAGE_KEYS.USERNAME) || 'student_lnj';
}

export function saveUsername(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USERNAME, clean);
  }
  return clean;
}

// ---------------- INITIALIZE DEMO STATE ----------------
export function initializeDemoChatData(myUsername: string) {
  if (typeof window === 'undefined') return;

  // 1. Initial Username if not set
  if (!localStorage.getItem(STORAGE_KEYS.USERNAME)) {
    localStorage.setItem(STORAGE_KEYS.USERNAME, myUsername);
  }

  // 2. Initial Friends list if empty
  if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
    const defaultFriends: FriendContact[] = [
      {
        username: 'rahul_cse',
        full_name: 'Rahul Kumar',
        department: 'CSE',
        batch: "'26",
        avatar_gradient: 'from-indigo-600 to-blue-600',
        status: 'accepted',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(defaultFriends));
  }

  // 3. Initial Incoming Friend Request if empty
  if (!localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)) {
    const defaultRequests: FriendRequest[] = [
      {
        id: 'req-demo-1',
        sender_username: 'priya_ece',
        sender_name: 'Priya Sharma',
        receiver_username: myUsername,
        status: 'pending',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(defaultRequests));
  }

  // 4. Initial 24h Volatile Messages if empty
  if (!localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES)) {
    const convKey = getConversationKey(myUsername, 'rahul_cse');
    const now = Date.now();
    const initialMessages: DirectMessage[] = [
      {
        id: 'dm-1',
        conversation_key: convKey,
        sender_username: 'rahul_cse',
        receiver_username: myUsername,
        content: 'Hey! Saw your post on the LNJPIT feed earlier 👀',
        created_at: new Date(now - 1000 * 60 * 120).toISOString(),
        expires_at: new Date(now - 1000 * 60 * 120 + MESSAGE_TTL_MS).toISOString(),
      },
      {
        id: 'dm-2',
        conversation_key: convKey,
        sender_username: myUsername,
        receiver_username: 'rahul_cse',
        content: 'Haha thanks! Remember this chat auto-deletes after 24 hours ⏱️',
        created_at: new Date(now - 1000 * 60 * 60).toISOString(),
        expires_at: new Date(now - 1000 * 60 * 60 + MESSAGE_TTL_MS).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(initialMessages));
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
    return { success: false, message: 'Please enter a valid username.' };
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
    return { success: false, message: 'Friend request already pending!' };
  }

  // Check if already friends
  const friends = getFriendsList();
  if (friends.some((f) => f.username.toLowerCase() === cleanTarget)) {
    return { success: false, message: 'You are already friends with this student!' };
  }

  const targetDir = MOCK_CAMPUS_DIRECTORY.find((d) => d.username.toLowerCase() === cleanTarget);

  const newRequest: FriendRequest = {
    id: `req-${Date.now()}`,
    sender_username: senderUsername,
    sender_name: senderName,
    receiver_username: cleanTarget,
    receiver_name: targetDir ? targetDir.full_name : `@${cleanTarget}`,
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
  const foundInDir = MOCK_CAMPUS_DIRECTORY.find((d) => d.username.toLowerCase() === req.sender_username.toLowerCase());

  const newFriend: FriendContact = {
    username: req.sender_username,
    full_name: req.sender_name || (foundInDir ? foundInDir.full_name : `@${req.sender_username}`),
    department: foundInDir?.department || 'LNJPIT',
    batch: foundInDir?.batch || "'26",
    avatar_gradient: foundInDir?.avatar_gradient || 'from-indigo-600 to-purple-600',
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

// PURGE MESSAGES OLDER THAN 24 HOURS
export function purgeExpiredMessages(): DirectMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const str = localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES);
    if (!str) return [];

    const allMessages: DirectMessage[] = JSON.parse(str);
    const now = Date.now();

    // Keep only messages whose expires_at is in the future
    const validMessages = allMessages.filter((msg) => {
      const expiresAtMs = new Date(msg.expires_at).getTime();
      return expiresAtMs > now;
    });

    if (validMessages.length !== allMessages.length) {
      localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(validMessages));
    }

    return validMessages;
  } catch (err) {
    console.error('Error purging expired messages:', err);
    return [];
  }
}

export function getDirectMessagesForConv(convKey: string, myUsername: string): DirectMessage[] {
  const validMessages = purgeExpiredMessages();
  return validMessages
    .filter((m) => m.conversation_key === convKey)
    .map((m) => ({
      ...m,
      is_mine: m.sender_username.toLowerCase() === myUsername.toLowerCase(),
    }))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function sendDirectMessage(senderUsername: string, receiverUsername: string, content: string): DirectMessage {
  const validMessages = purgeExpiredMessages();
  const convKey = getConversationKey(senderUsername, receiverUsername);
  const nowMs = Date.now();

  const newMsg: DirectMessage = {
    id: `dm-${nowMs}`,
    conversation_key: convKey,
    sender_username: senderUsername,
    receiver_username: receiverUsername,
    content: content.trim(),
    created_at: new Date(nowMs).toISOString(),
    expires_at: new Date(nowMs + MESSAGE_TTL_MS).toISOString(),
    is_mine: true,
  };

  const updated = [...validMessages, newMsg];
  localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(updated));
  return newMsg;
}
