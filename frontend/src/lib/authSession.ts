/**
 * AUTH-01 / PRO-01
 * Supabase Authentication, Profile & Household Session Provider.
 * Synchronizes with real Supabase Auth, profiles, and households tables,
 * while maintaining backward compatibility with local session subscribers.
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type UserGender = 'boy' | 'girl';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  household_id: string | null;
  onboarding_done: boolean;
  onboarding_step: number;
}

export interface HouseholdRecord {
  id: string;
  address_state: string;
  address_city: string;
  address_street: string | null;
  residents_count: number;
  showers_per_person: number;
  minutes_per_shower: number;
}

export interface AuthSession {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  profile: UserProfile | null;
  household: HouseholdRecord | null;
  name: string;
  email: string;
  gender: UserGender;
  state: string;
  city: string;
  street: string;
  addressDisplay: string;
  onboardingDone: boolean;
  onboardingStep: number;
}

export const INITIAL_AUTH_SESSION: AuthSession = {
  isLoggedIn: false,
  isLoading: true,
  user: null,
  profile: null,
  household: null,
  name: '',
  email: '',
  gender: 'boy',
  state: '',
  city: '',
  street: '',
  addressDisplay: '',
  onboardingDone: false,
  onboardingStep: 1,
};

let currentSession: AuthSession = { ...INITIAL_AUTH_SESSION };
const listeners = new Set<(session: AuthSession) => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener({ ...currentSession });
    } catch (err) {
      console.warn('Listener notification failed:', err);
    }
  });
}

function computeAddressDisplay(street?: string | null, city?: string | null, state?: string | null): string {
  const parts = [street?.trim(), city?.trim(), state?.trim()].filter(Boolean);
  return parts.join(', ');
}

/**
 * Fetch profile and household from Supabase for a given user.
 */
export async function fetchUserData(user: User | null): Promise<{
  profile: UserProfile | null;
  household: HouseholdRecord | null;
}> {
  if (!user) {
    return { profile: null, household: null };
  }

  try {
    // 1. Fetch profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, household_id, onboarding_done, onboarding_step')
      .eq('id', user.id)
      .maybeSingle();

    // If trigger took a fraction of a second to create profile, retry once
    if (!profile) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const retryResult = await supabase
        .from('profiles')
        .select('id, name, email, household_id, onboarding_done, onboarding_step')
        .eq('id', user.id)
        .maybeSingle();
      profile = retryResult.data;
    }

    // 2. Fetch household if linked
    let household: HouseholdRecord | null = null;
    if (profile?.household_id) {
      const { data: householdData } = await supabase
        .from('households')
        .select('id, address_state, address_city, address_street, residents_count, showers_per_person, minutes_per_shower')
        .eq('id', profile.household_id)
        .maybeSingle();
      household = householdData as HouseholdRecord | null;
    }

    return {
      profile: profile as UserProfile | null,
      household,
    };
  } catch (error) {
    console.error('Error fetching user profile and household:', error);
    return { profile: null, household: null };
  }
}

/**
 * Refresh current session from Supabase.
 */
export async function refreshSession(): Promise<AuthSession> {
  try {
    const {
      data: { session: sbSession },
    } = await supabase.auth.getSession();

    if (!sbSession?.user) {
      currentSession = {
        ...INITIAL_AUTH_SESSION,
        isLoading: false,
        isLoggedIn: false,
      };
      notifyListeners();
      return { ...currentSession };
    }

    const user = sbSession.user;
    const { profile, household } = await fetchUserData(user);

    const userMetadata = user.user_metadata || {};
    const gender: UserGender = (userMetadata.gender as UserGender) || 'boy';
    const name = profile?.name || userMetadata.name || userMetadata.full_name || user.email?.split('@')[0] || '';
    const email = profile?.email || user.email || '';

    const state = household?.address_state || userMetadata.state || '';
    const city = household?.address_city || userMetadata.city || '';
    const street = household?.address_street || userMetadata.street || '';
    const addressDisplay = computeAddressDisplay(street, city, state);

    const onboardingDone = Boolean(profile?.onboarding_done);
    const onboardingStep = profile?.onboarding_step ?? 1;

    currentSession = {
      isLoggedIn: true,
      isLoading: false,
      user,
      profile,
      household,
      name,
      email,
      gender,
      state,
      city,
      street,
      addressDisplay,
      onboardingDone,
      onboardingStep,
    };

    notifyListeners();
    return { ...currentSession };
  } catch (err) {
    console.error('Failed to refresh session:', err);
    currentSession = {
      ...currentSession,
      isLoading: false,
    };
    notifyListeners();
    return { ...currentSession };
  }
}

// Initialize Supabase auth listener
if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
  // Initial session read
  refreshSession();

  // Listen to Supabase auth events
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      currentSession = {
        ...INITIAL_AUTH_SESSION,
        isLoading: false,
        isLoggedIn: false,
      };
      notifyListeners();
    } else {
      await refreshSession();
    }
  });
}

/** Get the current session synchronously */
export function getAuthSession(): AuthSession {
  return { ...currentSession };
}

/** Update the session in memory and optionally sync updates to Supabase */
export function updateAuthSession(updates: Partial<AuthSession>): void {
  const street = updates.street ?? currentSession.street;
  const city = updates.city ?? currentSession.city;
  const state = updates.state ?? currentSession.state;

  let addressDisplay = updates.addressDisplay;
  if (!addressDisplay && (updates.street !== undefined || updates.city !== undefined || updates.state !== undefined)) {
    addressDisplay = computeAddressDisplay(street, city, state);
  }

  currentSession = {
    ...currentSession,
    ...updates,
    ...(addressDisplay !== undefined ? { addressDisplay } : {}),
  };
  notifyListeners();

  // If gender is explicitly updated and user is logged in, sync to Supabase user metadata
  if (updates.gender && currentSession.user) {
    void supabase.auth.updateUser({
      data: { gender: updates.gender },
    }).catch((err) => {
      console.warn('Failed to sync gender to Supabase auth metadata:', err);
    });
  }
}

/** Explicitly change the user avatar gender and persist to Supabase Auth */
export async function setUserGender(gender: UserGender): Promise<void> {
  updateAuthSession({ gender });
  if (currentSession.user) {
    try {
      await supabase.auth.updateUser({
        data: { gender },
      });
    } catch (err) {
      console.warn('Failed to persist gender to Supabase:', err);
    }
  }
}

/** Sign in with email and password via Supabase */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: Error | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error };
  }

  await refreshSession();
  return { user: data.user, error: null };
}

/** Sign up with email, password, and metadata via Supabase */
export async function signUp(
  email: string,
  password: string,
  metadata?: {
    name?: string;
    gender?: UserGender;
    state?: string;
    city?: string;
    street?: string;
  }
): Promise<{ user: User | null; error: Error | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: metadata?.name || '',
        gender: metadata?.gender || 'boy',
        state: metadata?.state || '',
        city: metadata?.city || '',
        street: metadata?.street || '',
      },
    },
  });

  if (error) {
    return { user: null, error };
  }

  await refreshSession();
  return { user: data.user, error: null };
}

/** Sign out from Supabase and clear local session */
export async function logoutAuthSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
  currentSession = {
    ...INITIAL_AUTH_SESSION,
    isLoading: false,
    isLoggedIn: false,
  };
  notifyListeners();
}

/** React hook for subscribing to auth session changes */
export function useAuthSession(): {
  session: AuthSession;
  updateSession: (updates: Partial<AuthSession>) => void;
  setGender: (gender: UserGender) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: {
      name?: string;
      gender?: UserGender;
      state?: string;
      city?: string;
      street?: string;
    }
  ) => Promise<{ user: User | null; error: Error | null }>;
} {
  const [session, setSession] = useState<AuthSession>({ ...currentSession });

  useEffect(() => {
    const listener = (newSession: AuthSession) => {
      setSession(newSession);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const logout = useCallback(async () => {
    await logoutAuthSession();
  }, []);

  const refresh = useCallback(async () => {
    return await refreshSession();
  }, []);

  const setGender = useCallback(async (gender: UserGender) => {
    await setUserGender(gender);
  }, []);

  return {
    session,
    updateSession: updateAuthSession,
    setGender,
    logout,
    refresh,
    signIn,
    signUp,
  };
}
