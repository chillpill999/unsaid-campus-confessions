'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FriendContact, FriendRequest, DirectMessage } from '@/lib/types';

// Helper to safely get Supabase admin client
function getAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

// Storage helper for production persistence
export async function syncUserHandle(username: string) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const cleanHandle = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    if (!cleanHandle) return { success: false, message: 'Invalid username format.' };

    if (user) {
      const client = getAdminClient() || supabase;
      await client
        .from('profiles')
        .update({ username: cleanHandle, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return { success: true, username: cleanHandle };
  } catch (err: any) {
    console.warn('syncUserHandle note:', err?.message);
    const cleanHandle = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    return { success: true, username: cleanHandle };
  }
}

// Global server-side memory store as reliable fallback when Supabase table migration is pending
const GLOBAL_FRIEND_REQUESTS: FriendRequest[] = [];
const GLOBAL_FRIENDS_MAP: Record<string, FriendContact[]> = {};
const GLOBAL_DIRECT_MESSAGES: DirectMessage[] = [];

export async function sendFriendRequestAction(
  senderUsername: string,
  senderName: string,
  targetUsername: string
): Promise<{ success: boolean; message: string; request?: FriendRequest }> {
  const cleanSender = senderUsername.trim().toLowerCase().replace(/^@/, '');
  const cleanTarget = targetUsername.trim().toLowerCase().replace(/^@/, '');

  if (!cleanTarget) {
    return { success: false, message: 'Please enter a valid student handle.' };
  }

  if (cleanSender === cleanTarget) {
    return { success: false, message: 'You cannot send a friend request to yourself.' };
  }

  const admin = getAdminClient();

  // 1. Check existing in Supabase DB first if table available
  if (admin) {
    try {
      const { data: existingDb } = await admin
        .from('friend_requests')
        .select('*')
        .eq('sender_username', cleanSender)
        .eq('receiver_username', cleanTarget)
        .eq('status', 'pending');

      if (existingDb && existingDb.length > 0) {
        return { success: false, message: 'Friend request already sent and pending!' };
      }
    } catch {}
  }

  // 2. Check in-memory fallback
  const existingReq = GLOBAL_FRIEND_REQUESTS.find(
    (r) =>
      r.sender_username.toLowerCase() === cleanSender &&
      r.receiver_username.toLowerCase() === cleanTarget &&
      r.status === 'pending'
  );

  if (existingReq) {
    return { success: false, message: 'Friend request already sent and pending!' };
  }

  // Check if already friends
  const senderFriends = GLOBAL_FRIENDS_MAP[cleanSender] || [];
  if (senderFriends.some((f) => f.username.toLowerCase() === cleanTarget)) {
    return { success: false, message: 'You are already connected with this student!' };
  }

  const newRequest: FriendRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sender_username: cleanSender,
    sender_name: senderName || `@${cleanSender}`,
    receiver_username: cleanTarget,
    receiver_name: `@${cleanTarget}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  // Save to memory
  GLOBAL_FRIEND_REQUESTS.unshift(newRequest);

  // Save to Supabase DB if table available
  if (admin) {
    try {
      await admin.from('friend_requests').insert({
        id: newRequest.id,
        sender_username: newRequest.sender_username,
        sender_name: newRequest.sender_name,
        receiver_username: newRequest.receiver_username,
        receiver_name: newRequest.receiver_name,
        status: newRequest.status,
        created_at: newRequest.created_at,
      });
    } catch (err) {
      console.warn('Supabase DB insert friend_requests note:', err);
    }
  }

  // Broadcast over Supabase Realtime channel
  try {
    const { broadcastFriendRequestEvent } = await import('@/lib/realtime/broadcast');
    await broadcastFriendRequestEvent(newRequest);
  } catch (err) {
    console.warn('Realtime request broadcast error:', err);
  }

  return {
    success: true,
    message: `Friend request sent successfully to @${cleanTarget}!`,
    request: newRequest,
  };
}

export async function fetchFriendRequestsAction(username: string): Promise<FriendRequest[]> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return [];

  const admin = getAdminClient();
  let dbRequests: FriendRequest[] = [];

  if (admin) {
    try {
      const { data } = await admin
        .from('friend_requests')
        .select('*')
        .or(`receiver_username.eq.${clean},sender_username.eq.${clean}`)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        dbRequests = data as FriendRequest[];
      }
    } catch {}
  }

  // Combine DB requests with in-memory requests
  const combinedMap = new Map<string, FriendRequest>();
  dbRequests.forEach((r) => combinedMap.set(r.id, r));
  GLOBAL_FRIEND_REQUESTS.forEach((r) => {
    if (r.receiver_username.toLowerCase() === clean || r.sender_username.toLowerCase() === clean) {
      if (!combinedMap.has(r.id)) combinedMap.set(r.id, r);
    }
  });

  return Array.from(combinedMap.values());
}

export async function acceptFriendRequestAction(
  requestId: string,
  myUsername: string
): Promise<{ success: boolean; friend?: FriendContact; message: string }> {
  const cleanMine = myUsername.trim().toLowerCase().replace(/^@/, '');
  let req: FriendRequest | undefined = GLOBAL_FRIEND_REQUESTS.find((r) => r.id === requestId);

  const admin = getAdminClient();

  if (admin) {
    try {
      const { data } = await admin.from('friend_requests').select('*').eq('id', requestId).single();
      if (data) req = data as FriendRequest;
    } catch {}
  }

  if (!req) {
    return { success: false, message: 'Friend request not found.' };
  }

  req.status = 'accepted';

  // Update in DB
  if (admin) {
    try {
      await admin.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    } catch {}
  }

  const peerHandle = req.sender_username.toLowerCase() === cleanMine ? req.receiver_username : req.sender_username;
  const peerName = req.sender_username.toLowerCase() === cleanMine ? req.receiver_name : req.sender_name;

  const newFriend: FriendContact = {
    username: peerHandle,
    full_name: peerName || `@${peerHandle}`,
    department: 'LNJPIT Campus',
    batch: 'Batch 2024-28',
    avatar_gradient: 'from-orange-500 to-amber-500',
    status: 'accepted',
  };

  const reciprocalFriend: FriendContact = {
    username: cleanMine,
    full_name: `@${cleanMine}`,
    department: 'LNJPIT Campus',
    batch: 'Batch 2024-28',
    avatar_gradient: 'from-[#FF6B00] to-rose-500',
    status: 'accepted',
  };

  // Add to memory
  if (!GLOBAL_FRIENDS_MAP[cleanMine]) GLOBAL_FRIENDS_MAP[cleanMine] = [];
  if (!GLOBAL_FRIENDS_MAP[cleanMine].some((f) => f.username.toLowerCase() === peerHandle)) {
    GLOBAL_FRIENDS_MAP[cleanMine].unshift(newFriend);
  }

  if (!GLOBAL_FRIENDS_MAP[peerHandle]) GLOBAL_FRIENDS_MAP[peerHandle] = [];
  if (!GLOBAL_FRIENDS_MAP[peerHandle].some((f) => f.username.toLowerCase() === cleanMine)) {
    GLOBAL_FRIENDS_MAP[peerHandle].unshift(reciprocalFriend);
  }

  // Add to DB
  if (admin) {
    try {
      await admin.from('friends').upsert([
        {
          id: `${cleanMine}_${peerHandle}`,
          username: cleanMine,
          friend_username: peerHandle,
          full_name: newFriend.full_name,
          department: newFriend.department,
          batch: newFriend.batch,
          avatar_gradient: newFriend.avatar_gradient,
          status: 'accepted',
        },
        {
          id: `${peerHandle}_${cleanMine}`,
          username: peerHandle,
          friend_username: cleanMine,
          full_name: reciprocalFriend.full_name,
          department: reciprocalFriend.department,
          batch: reciprocalFriend.batch,
          avatar_gradient: reciprocalFriend.avatar_gradient,
          status: 'accepted',
        },
      ]);
    } catch {}
  }

  // Broadcast acceptance over Supabase Realtime channel
  try {
    const { broadcastFriendAcceptEvent } = await import('@/lib/realtime/broadcast');
    await broadcastFriendAcceptEvent(req);
  } catch (err) {
    console.warn('Realtime accept broadcast error:', err);
  }

  return { success: true, friend: newFriend, message: `Connected with @${peerHandle}!` };
}

export async function rejectFriendRequestAction(requestId: string): Promise<{ success: boolean }> {
  const req = GLOBAL_FRIEND_REQUESTS.find((r) => r.id === requestId);
  if (req) {
    req.status = 'rejected';
  }

  const admin = getAdminClient();
  if (admin) {
    try {
      await admin.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
    } catch {}
  }

  return { success: true };
}

export async function fetchFriendsListAction(username: string): Promise<FriendContact[]> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return [];

  const admin = getAdminClient();
  let dbFriends: FriendContact[] = [];

  if (admin) {
    try {
      const { data } = await admin.from('friends').select('*').eq('username', clean);
      if (data && data.length > 0) {
        dbFriends = data.map((f: any) => ({
          username: f.friend_username,
          full_name: f.full_name || `@${f.friend_username}`,
          department: f.department || 'LNJPIT Campus',
          batch: f.batch || 'Batch 2024-28',
          avatar_gradient: f.avatar_gradient || 'from-orange-500 to-amber-500',
          status: 'accepted',
        }));
      }
    } catch {}
  }

  const memFriends = GLOBAL_FRIENDS_MAP[clean] || [];
  const combinedMap = new Map<string, FriendContact>();
  dbFriends.forEach((f) => combinedMap.set(f.username.toLowerCase(), f));
  memFriends.forEach((f) => {
    if (!combinedMap.has(f.username.toLowerCase())) {
      combinedMap.set(f.username.toLowerCase(), f);
    }
  });

  return Array.from(combinedMap.values());
}

export async function sendDirectMessageAction(
  senderUsername: string,
  receiverUsername: string,
  content: string
): Promise<{ success: boolean; message: DirectMessage }> {
  const cleanSender = senderUsername.trim().toLowerCase().replace(/^@/, '');
  const cleanReceiver = receiverUsername.trim().toLowerCase().replace(/^@/, '');

  const sorted = [cleanSender, cleanReceiver].sort();
  const conversation_key = `${sorted[0]}_${sorted[1]}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const newMsg: DirectMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    conversation_key,
    sender_username: cleanSender,
    receiver_username: cleanReceiver,
    content: content.trim(),
    created_at: now.toISOString(),
    expires_at: expiresAt,
  };

  GLOBAL_DIRECT_MESSAGES.push(newMsg);

  // Broadcast DM live over Supabase Realtime channel
  try {
    const { broadcastDirectMessageEvent } = await import('@/lib/realtime/broadcast');
    await broadcastDirectMessageEvent(newMsg);
  } catch (err) {
    console.warn('Realtime DM broadcast error:', err);
  }

  return { success: true, message: newMsg };
}

export async function fetchDirectMessagesAction(
  conversationKey: string,
  username: string
): Promise<DirectMessage[]> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  const nowTime = Date.now();

  return GLOBAL_DIRECT_MESSAGES.filter((m) => {
    if (m.conversation_key !== conversationKey) return false;
    const expiresTime = new Date(m.expires_at).getTime();
    return expiresTime > nowTime;
  });
}
