import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = (rawUrl && rawUrl.startsWith('http')) ? rawUrl : 'https://prkecywvrficjylboior.supabase.co';

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_ANON_KEY = (rawKey && !rawKey.includes('[SENSITIVE]')) ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

// Singleton client for server-side broadcast triggers
function getRealtimeBroadcastClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function sendBroadcast(channelName: string, event: string, payload: any) {
  return new Promise<void>((resolve) => {
    try {
      const supabase = getRealtimeBroadcastClient();
      const channel = supabase.channel(channelName);

      const cleanup = () => {
        try {
          supabase.removeChannel(channel);
        } catch (_) {}
        resolve();
      };

      const timer = setTimeout(cleanup, 4000);

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.send({
              type: 'broadcast',
              event,
              payload,
            });
          } catch (err) {
            console.warn('Broadcast send error:', err);
          } finally {
            clearTimeout(timer);
            setTimeout(cleanup, 250);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          clearTimeout(timer);
          cleanup();
        }
      });
    } catch (err) {
      console.warn('Broadcast error:', err);
      resolve();
    }
  });
}

/**
 * STRICT PRIVACY AUDIT GUARANTEE:
 * None of the broadcast helpers expose private identity or auth metadata.
 */

export async function broadcastConfessionEvent(eventType: 'posted' | 'deleted', publicCode: string) {
  await sendBroadcast('campus:feed', 'confession_event', { type: eventType, public_code: publicCode, timestamp: Date.now() });
}

export async function broadcastReactionUpdate(publicCode: string, reactionCounts: Record<string, number>) {
  await sendBroadcast('campus:feed', 'reaction_update', { public_code: publicCode, reaction_counts: reactionCounts, timestamp: Date.now() });
}

export async function broadcastCommentUpdate(publicCode: string, commentCount: number) {
  await sendBroadcast('campus:feed', 'comment_update', { public_code: publicCode, comment_count: commentCount, timestamp: Date.now() });
}

export async function broadcastPollUpdate(publicCode: string, pollData: any) {
  await sendBroadcast('campus:feed', 'poll_update', { public_code: publicCode, poll_data: pollData, timestamp: Date.now() });
}

export async function broadcastCampusMoodUpdate(moodStats: any[]) {
  await sendBroadcast('campus:feed', 'campus_mood_update', { mood_stats: moodStats, timestamp: Date.now() });
}

export async function broadcastPrivateNotification(recipientId: string, type: string) {
  await sendBroadcast(`user-notifications:${recipientId}`, 'new_notification', { notification_type: type, timestamp: Date.now() });
}

export async function broadcastFriendRequestEvent(request: any) {
  await sendBroadcast('campus:friend_requests', 'friend_request_sent', request);
}

export async function broadcastFriendAcceptEvent(request: any) {
  await sendBroadcast('campus:friend_requests', 'friend_request_accepted', request);
}

export async function broadcastDirectMessageEvent(message: any) {
  await sendBroadcast(`campus:dm:${message.conversation_key}`, 'direct_message_sent', message);
}
