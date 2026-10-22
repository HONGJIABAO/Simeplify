/**
 * Profile & Household Core Logic
 * Stage 6 Part 6 - Pure business logic and Supabase client queries for Profile.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  household_id: string | null;
  onboarding_done: boolean;
  onboarding_step: number;
}

export interface HouseholdRecordData {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  residents_count: number;
  showers_per_person: number;
  minutes_per_shower: number;
}

export interface ProfileScreenData {
  profile: ProfileRecord | null;
  household: HouseholdRecordData | null;
  unreadNotificationsCount: number;
  addressDisplay: string;
}

export interface UpdateProfileParams {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  gender?: 'boy' | 'girl';
}

/**
 * Format Malaysian address display: "{street}, {city}, {state}"
 */
export function formatAddressDisplay(
  street?: string | null,
  city?: string | null,
  state?: string | null
): string {
  const parts = [street?.trim(), city?.trim(), state?.trim()].filter(Boolean);
  return parts.join(', ');
}

/**
 * Fetch real profile, linked household, and unread notifications count using client.
 */
export async function fetchProfileDataWithClient(
  client: SupabaseClient,
  userId: string
): Promise<ProfileScreenData> {
  // 1. Fetch user's profile row
  const { data: profileRow, error: profileError } = await client
    .from('profiles')
    .select('id, name, email, household_id, onboarding_done, onboarding_step')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw profileError;
  }

  let householdData: HouseholdRecordData | null = null;
  let unreadNotificationsCount = 0;

  if (profileRow?.household_id) {
    // 2. Fetch linked household row
    const { data: householdRow, error: householdError } = await client
      .from('households')
      .select('id, address_state, address_city, address_street, residents_count, showers_per_person, minutes_per_shower')
      .eq('id', profileRow.household_id)
      .maybeSingle();

    if (householdError) {
      console.error('Error fetching household:', householdError);
      throw householdError;
    }

    if (householdRow) {
      householdData = {
        id: householdRow.id,
        name: `${householdRow.address_city} Household`,
        street: householdRow.address_street || '',
        city: householdRow.address_city || '',
        state: householdRow.address_state || '',
        residents_count: householdRow.residents_count,
        showers_per_person: householdRow.showers_per_person,
        minutes_per_shower: householdRow.minutes_per_shower,
      };
    }

    // 3. Fetch count of unread notifications for this household
    const { count, error: notifsError } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('household_id', profileRow.household_id)
      .eq('is_read', false);

    if (notifsError) {
      console.error('Error fetching unread notifications count:', notifsError);
    } else {
      unreadNotificationsCount = count ?? 0;
    }
  }

  const addressDisplay = formatAddressDisplay(
    householdData?.street,
    householdData?.city,
    householdData?.state
  );

  return {
    profile: profileRow
      ? {
          id: profileRow.id,
          name: profileRow.name || '',
          email: profileRow.email || '',
          household_id: profileRow.household_id,
          onboarding_done: profileRow.onboarding_done,
          onboarding_step: profileRow.onboarding_step,
        }
      : null,
    household: householdData,
    unreadNotificationsCount,
    addressDisplay,
  };
}

/**
 * Update user's name in `public.profiles` and address in `public.households` using client.
 */
export async function updateProfileAndHouseholdWithClient(
  client: SupabaseClient,
  userId: string,
  householdId: string,
  params: UpdateProfileParams
): Promise<void> {
  // 1. Update Profile if name is provided
  if (params.name !== undefined) {
    const { error: profileError } = await client
      .from('profiles')
      .update({ name: params.name })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile name:', profileError);
      throw profileError;
    }
  }

  // 2. Update Household if any address field is provided
  if (
    params.street !== undefined ||
    params.city !== undefined ||
    params.state !== undefined
  ) {
    const householdUpdates: {
      address_street?: string;
      address_city?: string;
      address_state?: string;
    } = {};

    if (params.street !== undefined) householdUpdates.address_street = params.street;
    if (params.city !== undefined) householdUpdates.address_city = params.city;
    if (params.state !== undefined) householdUpdates.address_state = params.state;

    const { error: householdError } = await client
      .from('households')
      .update(householdUpdates)
      .eq('id', householdId);

    if (householdError) {
      console.error('Error updating household address:', householdError);
      throw householdError;
    }
  }
}
