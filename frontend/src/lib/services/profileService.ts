/**
 * Profile & Household Service
 * Stage 6 Part 6 - Wires Profile tab to real Supabase tables:
 * public.profiles, public.households, and public.notifications.
 */

import { supabase } from '../supabase';
import { updateAuthSession } from '../authSession';
import {
  fetchProfileDataWithClient,
  updateProfileAndHouseholdWithClient,
  type UpdateProfileParams,
  type ProfileScreenData,
} from './profileCore';

export * from './profileCore';

/**
 * Fetch real profile, linked household, and unread notifications count for the active user.
 */
export async function fetchProfileData(userId: string): Promise<ProfileScreenData> {
  return fetchProfileDataWithClient(supabase, userId);
}

/**
 * Update user's name in `public.profiles` and address in `public.households`.
 * Syncs the in-memory auth session immediately.
 */
export async function updateProfileAndHousehold(
  userId: string,
  householdId: string,
  params: UpdateProfileParams
): Promise<void> {
  await updateProfileAndHouseholdWithClient(supabase, userId, householdId, params);

  // Update active auth session in memory
  updateAuthSession({
    ...(params.name !== undefined ? { name: params.name } : {}),
    ...(params.street !== undefined ? { street: params.street } : {}),
    ...(params.city !== undefined ? { city: params.city } : {}),
    ...(params.state !== undefined ? { state: params.state } : {}),
  });
}
