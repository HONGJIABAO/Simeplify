/**
 * Notification Core Logic
 * Stage 6: Pure Supabase client functions for notifications and routine reminders.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

/**
 * Call the sync_routine_appliance_notifications RPC function
 */
export async function syncRoutineNotificationsWithClient(
  client: SupabaseClient,
  householdId?: string
): Promise<number> {
  const { data, error } = await client.rpc(
    'sync_routine_appliance_notifications',
    householdId ? { p_household_id: householdId } : {}
  );

  if (error) {
    console.error('Error syncing routine notifications:', error);
    throw error;
  }

  return (data as number) ?? 0;
}

/**
 * Fetch exact count of unread notifications for a household
 */
export async function fetchUnreadNotificationsCountWithClient(
  client: SupabaseClient,
  householdId: string
): Promise<number> {
  const { count, error } = await client
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread notifications count:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Fetch all notifications for a household, ordered newest first
 */
export async function fetchNotificationsWithClient(
  client: SupabaseClient,
  householdId: string
): Promise<NotificationRow[]> {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return (data as NotificationRow[]) ?? [];
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsReadWithClient(
  client: SupabaseClient,
  notificationId: string
): Promise<void> {
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications for a household as read
 */
export async function markAllNotificationsAsReadWithClient(
  client: SupabaseClient,
  householdId: string
): Promise<void> {
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('household_id', householdId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}
