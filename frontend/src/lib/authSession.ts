/**
 * AUTH-01 / PRO-01
 * Supabase Authentication, Profile & Household Session Provider.
 * Synchronizes with real Supabase Auth, profiles, and households tables,
 * while maintaining backward compatibility with local session subscribers.
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, authStorage } from './supabase';

export type UserGender = 'boy' | 'girl';

export const DEMO_USER_ID = 'd3b00000-0000-0000-0000-000000000001';
export const DEMO_HOUSEHOLD_ID = 'd3b00000-0000-0000-0000-000000000002';
export const DEMO_EMAIL = 'meiling.tan@example.com';
export const DEMO_PASSWORD = 'password123';

export const LOCAL_SESSION_KEY = '@simeplify_auth_session';
export const OFFLINE_USERS_KEY = '@simeplify_offline_users';

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
  gender: 'girl',
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

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  app_metadata: { provider: 'email' },
  user_metadata: {
    name: 'Mei Ling Tan',
    gender: 'girl',
    state: 'Selangor',
    city: 'Subang Jaya',
    street: '18, Jalan SS 2/6',
  },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  email: DEMO_EMAIL,
  role: 'authenticated',
} as User;

export const DEMO_PROFILE: UserProfile = {
  id: DEMO_USER_ID,
  name: 'Mei Ling Tan',
  email: DEMO_EMAIL,
  household_id: DEMO_HOUSEHOLD_ID,
  onboarding_done: true,
  onboarding_step: 3,
};

export const DEMO_HOUSEHOLD: HouseholdRecord = {
  id: DEMO_HOUSEHOLD_ID,
  address_state: 'Selangor',
  address_city: 'Subang Jaya',
  address_street: '18, Jalan SS 2/6',
  residents_count: 3,
  showers_per_person: 2,
  minutes_per_shower: 8,
};

export const DEMO_AUTH_SESSION: AuthSession = {
  isLoggedIn: true,
  isLoading: false,
  user: DEMO_USER,
  profile: DEMO_PROFILE,
  household: DEMO_HOUSEHOLD,
  name: 'Mei Ling Tan',
  email: DEMO_EMAIL,
  gender: 'girl',
  state: 'Selangor',
  city: 'Subang Jaya',
  street: '18, Jalan SS 2/6',
  addressDisplay: '18, Jalan SS 2/6, Subang Jaya, Selangor',
  onboardingDone: true,
  onboardingStep: 3,
};

export function isNetworkError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('networkerror') ||
    msg.includes('fetch failed') ||
    msg.includes('load failed') ||
    msg.includes('connection refused')
  );
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
    let sbSession: any = null;
    try {
      const res = await supabase.auth.getSession();
      sbSession = res?.data?.session;
    } catch {
      // Supabase is offline / unreachable
    }

    if (sbSession?.user) {
      const user = sbSession.user;
      const { profile, household } = await fetchUserData(user);

      const userMetadata = user.user_metadata || {};
      const gender: UserGender = (userMetadata.gender as UserGender) || 'girl';
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

      try {
        await authStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
      } catch { }

      notifyListeners();
      return { ...currentSession };
    }

    // No active Supabase session - check local saved session
    try {
      const stored = await authStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthSession;
        if (parsed && parsed.isLoggedIn && parsed.user) {
          currentSession = {
            ...parsed,
            isLoading: false,
          };
          notifyListeners();
          return { ...currentSession };
        }
      }
    } catch { }

    currentSession = {
      ...INITIAL_AUTH_SESSION,
      isLoading: false,
      isLoggedIn: false,
    };
    notifyListeners();
    return { ...currentSession };
  } catch (err) {
    console.warn('Failed to refresh session:', err);
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
  try {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        // Only clear if we aren't maintaining a local demo/offline session
        const stored = await authStorage.getItem(LOCAL_SESSION_KEY);
        if (!stored) {
          currentSession = {
            ...INITIAL_AUTH_SESSION,
            isLoading: false,
            isLoggedIn: false,
          };
          notifyListeners();
        }
      } else {
        await refreshSession();
      }
    });
  } catch {
    // Supabase client listener fallback
  }
}

/** Get the current session synchronously */
export function getAuthSession(): AuthSession {
  return { ...currentSession };
}

/** Update the session in memory and sync updates to storage & Supabase */
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

  if (currentSession.isLoggedIn) {
    void authStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
  }
}

/** Sign in with email and password via Supabase with offline demo support */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: Error | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const isDemo = cleanEmail === DEMO_EMAIL;

  let sbResult: { data: { user: User | null; session: any } | null; error: any } = { data: null, error: null };
  try {
    const res = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });
    sbResult = res;
  } catch (err: any) {
    sbResult = { data: null, error: err };
  }

  if (sbResult.error) {
    // If it's the demo account, fallback to local demo session
    if (isDemo) {
      if (cleanPassword === DEMO_PASSWORD) {
        currentSession = { ...DEMO_AUTH_SESSION };
        try {
          await authStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
        } catch { }
        notifyListeners();
        return { user: DEMO_USER, error: null };
      } else {
        return { user: null, error: new Error('Email or password is wrong.') };
      }
    }

    // Check if network error and an offline account exists
    if (isNetworkError(sbResult.error)) {
      try {
        const storedUsers = await authStorage.getItem(OFFLINE_USERS_KEY);
        if (storedUsers) {
          const usersList: any[] = JSON.parse(storedUsers);
          const found = usersList.find(
            (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
          );
          if (found) {
            currentSession = { ...found.session };
            await authStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
            notifyListeners();
            return { user: found.session.user, error: null };
          }
        }
      } catch { }
      return {
        user: null,
        error: new Error('Cannot connect to server. Please use the Demo Account (Mei Ling Tan).'),
      };
    }

    return { user: null, error: new Error('Email or password is wrong.') };
  }

  await refreshSession();
  return { user: sbResult.data?.user || null, error: null };
}

/** Sign up with email, password, and metadata */
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
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  let sbResult: { data: { user: User | null; session: any } | null; error: any } = { data: null, error: null };
  try {
    const res = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          name: metadata?.name || '',
          gender: metadata?.gender || 'girl',
          state: metadata?.state || '',
          city: metadata?.city || '',
          street: metadata?.street || '',
        },
      },
    });
    sbResult = res;
  } catch (err: any) {
    sbResult = { data: null, error: err };
  }

  if (sbResult.error) {
    // Graceful offline account creation if Supabase backend is offline
    if (isNetworkError(sbResult.error)) {
      const offlineUserId = 'offline-user-' + Date.now();
      const offlineHouseholdId = 'offline-hh-' + Date.now();
      const userName = metadata?.name || cleanEmail.split('@')[0];
      const userGender: UserGender = metadata?.gender || 'girl';
      const userState = metadata?.state || '';
      const userCity = metadata?.city || '';
      const userStreet = metadata?.street || '';

      const offlineUser: User = {
        id: offlineUserId,
        app_metadata: { provider: 'email' },
        user_metadata: {
          name: userName,
          gender: userGender,
          state: userState,
          city: userCity,
          street: userStreet,
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
        role: 'authenticated',
      } as User;

      const offlineProfile: UserProfile = {
        id: offlineUserId,
        name: userName,
        email: cleanEmail,
        household_id: offlineHouseholdId,
        onboarding_done: false,
        onboarding_step: 1,
      };

      const offlineHousehold: HouseholdRecord = {
        id: offlineHouseholdId,
        address_state: userState,
        address_city: userCity,
        address_street: userStreet,
        residents_count: 1,
        showers_per_person: 1,
        minutes_per_shower: 10,
      };

      const offlineSession: AuthSession = {
        isLoggedIn: true,
        isLoading: false,
        user: offlineUser,
        profile: offlineProfile,
        household: offlineHousehold,
        name: userName,
        email: cleanEmail,
        gender: userGender,
        state: userState,
        city: userCity,
        street: userStreet,
        addressDisplay: computeAddressDisplay(userStreet, userCity, userState),
        onboardingDone: false,
        onboardingStep: 1,
      };

      currentSession = offlineSession;

      try {
        await authStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentSession));
        const storedUsers = await authStorage.getItem(OFFLINE_USERS_KEY);
        const usersList: any[] = storedUsers ? JSON.parse(storedUsers) : [];
        usersList.push({
          email: cleanEmail,
          password: cleanPassword,
          session: offlineSession,
        });
        await authStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(usersList));
      } catch { }

      notifyListeners();
      return { user: offlineUser, error: null };
    }

    return { user: null, error: sbResult.error };
  }

  await refreshSession();
  return { user: sbResult.data?.user || null, error: null };
}

/** Sign out from Supabase and clear local session */
export async function logoutAuthSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
  try {
    await authStorage.removeItem(LOCAL_SESSION_KEY);
  } catch { }
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

  return {
    session,
    updateSession: updateAuthSession,
    logout,
    refresh,
    signIn,
    signUp,
  };
}
