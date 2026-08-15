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

/**
 * Derives the authenticated user's campus handle from their canonical profile
 * in Supabase (falling back to verified session email local-part).
 */
async function getAuthHandle(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error) return null;

    const admin = getAdminClient();
    const client = admin || supabase;

    // 1. Fetch user's canonical handle from profiles table
    const { data: profile } = await client
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.username) {
      return profile.username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    }

    // 2. Fallback to email prefix and auto-persist to profiles
    if (user.email) {
      const emailHandle = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (admin && emailHandle) {
        await admin.from('profiles').update({ username: emailHandle }).eq('id', user.id);
      }
      return emailHandle;
    }

    return null;
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

    if (!user) {
      return { success: false, message: 'You must be signed in to save your handle.' };
    }

    const client = getAdminClient() || supabase;
    const { error } = await client
      .from('profiles')
      .update({ username: cleanHandle, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.warn('syncUserHandle DB error:', error);
      return { success: false, message: 'Failed to save your handle. Please try again.' };
    }

    return { success: true, username: cleanHandle };
  } catch (err: any) {
    console.warn('syncUserHandle note:', err?.message);
    return { success: false, message: 'Failed to save your handle. Please try again.' };
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
  const authHandle = await getAuthHandle();
  if (!authHandle) {
    return { success: false, message: 'You must be signed in to send a friend request.' };
  }

  // Derive the sender from the authenticated session, never from client input,
  // so a user cannot impersonate another handle.
  const cleanSender = authHandle;
  const cleanTarget = targetUsername.trim().toLowerCase().replace(/^@/, '');

  if (!cleanTarget) {
    return { success: false, message: 'Please enter a valid student handle.' };
  }

  if (cleanSender === cleanTarget) {
    return { success: false, message: 'You cannot send a friend request to yourself.' };
  }

  const admin = getAdminClient();
  const client = admin || createClient();

  // 1. Check existing in Supabase DB first if table available
  if (client) {
    try {
      const { data: existingDb } = await client
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
  if (client) {
    try {
      await client.from('friend_requests').insert({
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
  const clean = (await getAuthHandle()) || username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return [];

  const admin = getAdminClient();
  const client = admin || createClient();
  let dbRequests: FriendRequest[] = [];

  if (client) {
    try {
      const { data } = await client
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
  const authHandle = await getAuthHandle();
  if (!authHandle) {
    return { success: false, message: 'You must be signed in to accept a friend request.', friend: undefined };
  }

  // The "me" side of the connection must always be the authenticated handle.
  const cleanMine = authHandle;
  let req: FriendRequest | undefined = GLOBAL_FRIEND_REQUESTS.find((r) => r.id === requestId);

  const admin = getAdminClient();
  const client = admin || createClient();

  if (client) {
    try {
      const { data } = await client.from('friend_requests').select('*').eq('id', requestId).single();
      if (data) req = data as FriendRequest;
    } catch {}
  }

  if (!req) {
    return { success: false, message: 'Friend request not found.' };
  }

  req.status = 'accepted';

  // Update in DB
  if (client) {
    try {
      await client.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
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
  const authHandle = await getAuthHandle();
  if (!authHandle) {
    return { success: false };
  }

  const req = GLOBAL_FRIEND_REQUESTS.find((r) => r.id === requestId);
  if (req) {
    req.status = 'rejected';
  }

  const admin = getAdminClient();
  const client = admin || createClient();
  if (client) {
    try {
      await client.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
    } catch {}
  }

  return { success: true };
}

export async function fetchFriendsListAction(username: string): Promise<FriendContact[]> {
  const clean = (await getAuthHandle()) || username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return [];

  const admin = getAdminClient();
  const combinedMap = new Map<string, FriendContact>();

  if (admin) {
    try {
      // 1. Fetch from friend_requests table where status = 'accepted'
      const { data: acceptedReqs } = await admin
        .from('friend_requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`receiver_username.eq.${clean},sender_username.eq.${clean}`)
        .order('created_at', { ascending: false });

      if (acceptedReqs && acceptedReqs.length > 0) {
        acceptedReqs.forEach((r: any) => {
          const isSender = r.sender_username.toLowerCase() === clean;
          const friendUsername = isSender ? r.receiver_username : r.sender_username;
          const friendName = isSender
            ? r.receiver_name || `@${r.receiver_username}`
            : r.sender_name || `@${r.sender_username}`;

          combinedMap.set(friendUsername.toLowerCase(), {
            username: friendUsername,
            full_name: friendName,
            department: 'LNJPIT Campus',
            batch: 'Batch 2024-28',
            avatar_gradient: 'from-orange-500 to-amber-500',
            status: 'accepted',
          });
        });
      }

      // 2. Also query friends table if available
      const { data: friendsData } = await admin.from('friends').select('*').eq('username', clean);
      if (friendsData && friendsData.length > 0) {
        friendsData.forEach((f: any) => {
          combinedMap.set(f.friend_username.toLowerCase(), {
            username: f.friend_username,
            full_name: f.full_name || `@${f.friend_username}`,
            department: f.department || 'LNJPIT Campus',
            batch: f.batch || 'Batch 2024-28',
            avatar_gradient: f.avatar_gradient || 'from-orange-500 to-amber-500',
            status: 'accepted',
          });
        });
      }
    } catch (err) {
      console.warn('fetchFriendsListAction DB note:', err);
    }
  }

  // 3. Fallback merge with memory map
  const memFriends = GLOBAL_FRIENDS_MAP[clean] || [];
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
  content: string,
  clientMessageId?: string
): Promise<{ success: boolean; message: DirectMessage | string }> {
  const authHandle = await getAuthHandle();
  if (!authHandle) {
    return { success: false, message: 'You must be signed in to send a message.' };
  }

  // The sender is always the authenticated handle — never client input.
  const cleanSender = authHandle;
  const cleanReceiver = receiverUsername.trim().toLowerCase().replace(/^@/, '');

  const sorted = [cleanSender, cleanReceiver].sort();
  const conversation_key = `${sorted[0]}_${sorted[1]}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const newMsg: DirectMessage = {
    id: clientMessageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    conversation_key,
    sender_username: cleanSender,
    receiver_username: cleanReceiver,
    content: content.trim(),
    created_at: now.toISOString(),
    expires_at: expiresAt,
  };

  GLOBAL_DIRECT_MESSAGES.push(newMsg);

  // 1. Persist to Supabase direct_messages table
  const admin = getAdminClient();
  const client = admin || createClient();
  if (client) {
    try {
      await client.from('direct_messages').upsert({
        id: newMsg.id,
        conversation_key: newMsg.conversation_key,
        sender_username: newMsg.sender_username,
        receiver_username: newMsg.receiver_username,
        content: newMsg.content,
        created_at: newMsg.created_at,
        expires_at: newMsg.expires_at,
      });
    } catch (dbErr) {
      console.warn('direct_messages DB insert note:', dbErr);
    }
  }

  return { success: true, message: newMsg };
}

export async function fetchDirectMessagesAction(
  conversationKey: string,
  username: string
): Promise<DirectMessage[]> {
  const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
  const authHandle = (await getAuthHandle()) || cleanUser;
  if (!conversationKey) return [];

  const key = conversationKey.toLowerCase();
  const involvesMe =
    key.includes(cleanUser) ||
    (authHandle && key.includes(authHandle));
  if (!involvesMe) return [];

  const nowIso = new Date().toISOString();
  let dbMessages: DirectMessage[] = [];

  // 1. Fetch from Supabase DB
  const admin = getAdminClient();
  const client = admin || createClient();
  if (client) {
    try {
      const { data: dbData } = await client
        .from('direct_messages')
        .select('*')
        .eq('conversation_key', key)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: true });

      if (dbData && dbData.length > 0) {
        dbMessages = dbData.map((d: any) => ({
          id: d.id,
          conversation_key: d.conversation_key,
          sender_username: d.sender_username,
          receiver_username: d.receiver_username,
          content: d.content,
          created_at: d.created_at,
          expires_at: d.expires_at,
        }));
      }
    } catch (err) {
      console.warn('fetchDirectMessagesAction DB note:', err);
    }
  }

  // 2. Merge with memory messages
  const nowTime = Date.now();
  const memMessages = GLOBAL_DIRECT_MESSAGES.filter((m) => {
    if (m.conversation_key !== key) return false;
    const expiresTime = new Date(m.expires_at).getTime();
    return expiresTime > nowTime;
  });

  const msgMap = new Map<string, DirectMessage>();
  dbMessages.forEach((m) => msgMap.set(m.id, m));
  memMessages.forEach((m) => msgMap.set(m.id, m));

  return Array.from(msgMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function sendSignalAction(confessionCode: string): Promise<{
  success: boolean;
  message: string;
}> {
  const authHandle = await getAuthHandle();
  if (!authHandle) {
    return { success: false, message: 'You must be signed in to send a signal.' };
  }

  const cleanCode = confessionCode.trim().replace(/^#/, '').toUpperCase();
  const admin = getAdminClient();

  if (!admin) {
    return { success: false, message: 'Signal service is unavailable. Please try again later.' };
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(confessionCode.trim());
    let confQuery = admin
      .from('confessions')
      .select('author_id, public_code')
      .eq('moderation_status', 'approved')
      .eq('is_deleted', false);

    if (isUuid) {
      confQuery = confQuery.or(`public_code.ilike.${cleanCode},id.eq.${cleanCode}`);
    } else {
      confQuery = confQuery.ilike('public_code', cleanCode);
    }

    const { data: conf } = await confQuery.maybeSingle();

    if (!conf?.author_id) {
      return { success: false, message: 'Confession not found.' };
    }

    const { data: authorProfile } = await admin
      .from('profiles')
      .select('username')
      .eq('id', conf.author_id)
      .maybeSingle();

    if (!authorProfile?.username) {
      return { success: false, message: 'Signal could not be delivered to this confession.' };
    }

    const targetHandle = authorProfile.username;
    if (targetHandle.toLowerCase() === authHandle.toLowerCase()) {
      return { success: false, message: 'You cannot send a signal to your own confession.' };
    }

    const frResult = await sendFriendRequestAction(authHandle, 'Anonymous Student', targetHandle);
    if (!frResult.success) {
      return { success: false, message: frResult.message || 'Signal could not be delivered.' };
    }

    return {
      success: true,
      message: `Anonymous signal sent for #${cleanCode}! Check your Inbox for updates.`,
    };
  } catch (err) {
    console.warn('sendSignalAction note:', err);
    return { success: false, message: 'Signal could not be delivered. Please try again.' };
  }
}
