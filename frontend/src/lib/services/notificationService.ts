/**
 * Notification Service & Sync Engine
 * Global notification hub for smart appliance reminders, leak alerts, and unread badges.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import {
  syncRoutineNotificationsWithClient,
  fetchUnreadNotificationsCountWithClient,
  fetchNotificationsWithClient,
  markNotificationAsReadWithClient,
  markAllNotificationsAsReadWithClient,
  type NotificationRow,
} from './notificationCore';

export * from './notificationCore';

// Shared in-memory unread listeners for immediate cross-tab badge updates
let globalUnreadCount: number = 0;
const unreadListeners = new Set<(count: number) => void>();

function setGlobalUnreadCount(count: number) {
  globalUnreadCount = count;
  unreadListeners.forEach((listener) => {
    try {
      listener(count);
    } catch (err) {
      console.warn('Notification listener error:', err);
    }
  });
}

/**
 * Sync routine appliance reminders and return number of new notifications generated.
 */
export async function syncRoutineNotifications(householdId?: string): Promise<number> {
  const count = await syncRoutineNotificationsWithClient(supabase, householdId);
  if (householdId) {
    const unread = await fetchUnreadNotificationsCountWithClient(supabase, householdId);
    setGlobalUnreadCount(unread);
  }
  return count;
}

/**
 * Fetch unread notifications count for a household and update global badge.
 */
export async function fetchUnreadNotificationsCount(householdId: string): Promise<number> {
  const count = await fetchUnreadNotificationsCountWithClient(supabase, householdId);
  setGlobalUnreadCount(count);
  return count;
}

/**
 * Fetch all notifications for a household.
 */
export async function fetchNotifications(householdId: string): Promise<NotificationRow[]> {
  return fetchNotificationsWithClient(supabase, householdId);
}

/**
 * Mark a single notification as read and decrement unread badge.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await markNotificationAsReadWithClient(supabase, notificationId);
  if (globalUnreadCount > 0) {
    setGlobalUnreadCount(globalUnreadCount - 1);
  }
}

/**
 * Mark all notifications as read and reset unread badge to 0.
 */
export async function markAllNotificationsAsRead(householdId: string): Promise<void> {
  await markAllNotificationsAsReadWithClient(supabase, householdId);
  setGlobalUnreadCount(0);
}

/**
 * React hook to observe unread notifications badge across all tabs.
 * Automatically synchronizes with Supabase on mount and allows triggering manual refreshes.
 */
export function useUnreadNotifications(householdId?: string | null): {
  unreadCount: number;
  hasUnread: boolean;
  refresh: () => Promise<number>;
  syncAndRefresh: () => Promise<void>;
} {
  const [unreadCount, setUnreadCount] = useState<number>(globalUnreadCount);

  useEffect(() => {
    const listener = (count: number) => {
      setUnreadCount(count);
    };
    unreadListeners.add(listener);

    return () => {
      unreadListeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async (): Promise<number> => {
    if (!householdId) return 0;
    try {
      const count = await fetchUnreadNotificationsCount(householdId);
      return count;
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
      return 0;
    }
  }, [householdId]);

  const syncAndRefresh = useCallback(async (): Promise<void> => {
    if (!householdId) return;
    try {
      await syncRoutineNotifications(householdId);
      await refresh();
    } catch (err) {
      console.error('Failed to sync and refresh notifications:', err);
    }
  }, [householdId, refresh]);

  useEffect(() => {
    if (householdId) {
      void syncAndRefresh();
    }
  }, [householdId, syncAndRefresh]);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    refresh,
    syncAndRefresh,
  };
}
