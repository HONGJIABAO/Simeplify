import { supabase } from '../supabase';
import {
  castHouseholdVoteWithClient,
  CommunityServiceError,
  fetchCommunityStateWithClient,
} from './communityCore';

export * from './communityCore';

export function isCommunityOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('networkerror')
  );
}

export async function fetchCommunityState(householdId: string) {
  try {
    return await fetchCommunityStateWithClient(supabase, householdId);
  } catch (error) {
    if (isCommunityOfflineError(error)) {
      throw new CommunityServiceError(
        'You appear to be offline. Reconnect and try again.',
        'offline'
      );
    }
    throw error;
  }
}

export async function castHouseholdVote(
  householdId: string,
  rewardId: string,
  votingMonth: string
) {
  try {
    return await castHouseholdVoteWithClient(
      supabase,
      householdId,
      rewardId,
      votingMonth
    );
  } catch (error) {
    if (isCommunityOfflineError(error)) {
      throw new CommunityServiceError(
        'You appear to be offline. Reconnect and try again.',
        'offline'
      );
    }
    throw error;
  }
}

