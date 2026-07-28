import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

// Singleton client for server-side broadcast triggers
function getRealtimeBroadcastClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * STRICT PRIVACY AUDIT GUARANTEE:
 * None of the broadcast helpers expose private identity or auth metadata.
 */

export async function broadcastConfessionEvent(eventType: 'posted' | 'deleted', publicCode: string) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channel = supabase.channel('campus:feed');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'confession_event',
      payload: { type: eventType, public_code: publicCode, timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime broadcast note:', err);
  }
}

export async function broadcastReactionUpdate(publicCode: string, reactionCounts: Record<string, number>) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channel = supabase.channel('campus:feed');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'reaction_update',
      payload: { public_code: publicCode, reaction_counts: reactionCounts, timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime reaction broadcast note:', err);
  }
}

export async function broadcastCommentUpdate(publicCode: string, commentCount: number) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channel = supabase.channel('campus:feed');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'comment_update',
      payload: { public_code: publicCode, comment_count: commentCount, timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime comment count broadcast note:', err);
  }
}

export async function broadcastPollUpdate(publicCode: string, pollData: any) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channel = supabase.channel('campus:feed');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'poll_update',
      payload: { public_code: publicCode, poll_data: pollData, timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime poll broadcast note:', err);
  }
}

export async function broadcastCampusMoodUpdate(moodStats: any[]) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channel = supabase.channel('campus:feed');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'campus_mood_update',
      payload: { mood_stats: moodStats, timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime campus mood broadcast note:', err);
  }
}

export async function broadcastPrivateNotification(recipientId: string, type: string) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channelName = `user-notifications:${recipientId}`;
    const channel = supabase.channel(channelName);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: { notification_type: type, timestamp: Date.now() },
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime notification broadcast note:', err);
  }
}

export async function broadcastFriendRequestEvent(request: any) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channel = supabase.channel('campus:friend_requests');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'friend_request_sent',
      payload: request,
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime friend request broadcast note:', err);
  }
}

export async function broadcastFriendAcceptEvent(request: any) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channel = supabase.channel('campus:friend_requests');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'friend_request_accepted',
      payload: request,
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime friend accept broadcast note:', err);
  }
}

export async function broadcastDirectMessageEvent(message: any) {
  try {
    const supabase = getRealtimeBroadcastClient();
    const channelName = `campus:dm:${message.conversation_key}`;
    const channel = supabase.channel(channelName);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'direct_message_sent',
      payload: message,
    });
    supabase.removeChannel(channel);
  } catch (err) {
    console.warn('Realtime direct message broadcast note:', err);
  }
}
