'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prkecywvrficjylboior.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya2VjeXd2cmZpY2p5bGJvaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzYzNTMsImV4cCI6MjEwMDcxMjM1M30.Rl-77UJekLrfDJgUzKBVrro8AyYFW6vWOXNHQ4hoVDg';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type RealtimeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

/**
 * 1. Hook for Realtime Campus Feed
 * Subscribes to live invalidation/broadcast events for confessions, reactions, comments, and polls.
 */
export function useRealtimeFeed(callbacks: {
  onConfessionPosted?: (publicCode: string) => void;
  onConfessionDeleted?: (publicCode: string) => void;
  onReactionUpdated?: (publicCode: string, reactionCounts: Record<string, number>) => void;
  onCommentUpdated?: (publicCode: string, commentCount: number) => void;
  onPollUpdated?: (publicCode: string, pollData: any) => void;
}) {
  const [status, setStatus] = useState<RealtimeStatus>('CONNECTING');

  useEffect(() => {
    const channel: RealtimeChannel = supabaseClient.channel('campus:feed');

    channel
      .on('broadcast', { event: 'confession_event' }, (payload) => {
        const { type, public_code } = payload.payload || {};
        if (type === 'posted' && callbacks.onConfessionPosted && public_code) {
          callbacks.onConfessionPosted(public_code);
        } else if (type === 'deleted' && callbacks.onConfessionDeleted && public_code) {
          callbacks.onConfessionDeleted(public_code);
        }
      })
      .on('broadcast', { event: 'reaction_update' }, (payload) => {
        const { public_code, reaction_counts } = payload.payload || {};
        if (callbacks.onReactionUpdated && public_code && reaction_counts) {
          callbacks.onReactionUpdated(public_code, reaction_counts);
        }
      })
      .on('broadcast', { event: 'comment_update' }, (payload) => {
        const { public_code, comment_count } = payload.payload || {};
        if (callbacks.onCommentUpdated && public_code && comment_count !== undefined) {
          callbacks.onCommentUpdated(public_code, comment_count);
        }
      })
      .on('broadcast', { event: 'poll_update' }, (payload) => {
        const { public_code, poll_data } = payload.payload || {};
        if (callbacks.onPollUpdated && public_code && poll_data) {
          callbacks.onPollUpdated(public_code, poll_data);
        }
      })
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('CONNECTED');
        } else if (subscribeStatus === 'TIMED_OUT' || subscribeStatus === 'CLOSED') {
          setStatus('DISCONNECTED');
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [callbacks]);

  return { status };
}

/**
 * 2. Hook for Anonymous Realtime Chat, Typing Indicators, and Read Receipts
 */
export function useRealtimeChat(
  conversationId: string | null,
  callbacks: {
    onMessageReceived?: (message: any) => void;
    onTypingStateChange?: (isTyping: boolean) => void;
    onReadStateChange?: (readAt: string) => void;
  }
) {
  const [status, setStatus] = useState<RealtimeStatus>('DISCONNECTED');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const channelName = `conversation:${conversationId}`;
    const channel = supabaseClient.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        if (callbacks.onMessageReceived && payload.payload?.message) {
          callbacks.onMessageReceived(payload.payload.message);
        }
      })
      .on('broadcast', { event: 'typing_state' }, (payload) => {
        if (callbacks.onTypingStateChange && typeof payload.payload?.typing === 'boolean') {
          callbacks.onTypingStateChange(payload.payload.typing);
        }
      })
      .on('broadcast', { event: 'read_receipt' }, (payload) => {
        if (callbacks.onReadStateChange && payload.payload?.read_at) {
          callbacks.onReadStateChange(payload.payload.read_at);
        }
      })
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') setStatus('CONNECTED');
      });

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      supabaseClient.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, callbacks]);

  // Ephemeral Typing Broadcaster (Sends ONLY boolean typing: true/false. ZERO DRAFT TEXT!)
  const sendTypingState = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !conversationId) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing_state',
        payload: { typing: isTyping, timestamp: Date.now() },
      });

      if (isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'typing_state',
              payload: { typing: false, timestamp: Date.now() },
            });
          }
        }, 1800);
      }
    },
    [conversationId]
  );

  const sendMessageBroadcast = useCallback(
    (message: any) => {
      if (!channelRef.current || !conversationId) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { message, timestamp: Date.now() },
      });
      // Stop typing on message send
      sendTypingState(false);
    },
    [conversationId, sendTypingState]
  );

  const sendReadReceiptBroadcast = useCallback(
    (readAt: string) => {
      if (!channelRef.current || !conversationId) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'read_receipt',
        payload: { read_at: readAt, timestamp: Date.now() },
      });
    },
    [conversationId]
  );

  return {
    status,
    sendTypingState,
    sendMessageBroadcast,
    sendReadReceiptBroadcast,
  };
}

/**
 * 3. Hook for Private Realtime User Notifications
 */
export function useRealtimeNotifications(
  userId: string | null,
  onNewNotification?: (notificationType: string) => void
) {
  useEffect(() => {
    if (!userId) return;

    const channelName = `user-notifications:${userId}`;
    const channel = supabaseClient.channel(channelName);

    channel
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        if (onNewNotification && payload.payload?.notification_type) {
          onNewNotification(payload.payload.notification_type);
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [userId, onNewNotification]);
}
