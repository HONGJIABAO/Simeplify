/**
 * AUTH-01 / PRO-01
 * Client-side mock authentication and user session store.
 * Stores current login state, profile credentials, selected gender (boy/girl), and address.
 */

import { useState, useEffect } from 'react';

export type UserGender = 'boy' | 'girl';

export interface AuthSession {
  isLoggedIn: boolean;
  name: string;
  email: string;
  gender: UserGender;
  state: string;
  city: string;
  street: string;
  addressDisplay: string;
}

export const INITIAL_AUTH_SESSION: AuthSession = {
  isLoggedIn: true,
  name: 'Mei Ling Tan',
  email: 'meiling.tan@example.com',
  gender: 'girl', // default girl sprite
  state: 'Selangor',
  city: 'Petaling Jaya',
  street: '18, Jalan SS 2/6',
  addressDisplay: '18, Jalan SS 2/6, Petaling Jaya, Selangor',
};

let currentSession: AuthSession = { ...INITIAL_AUTH_SESSION };
const listeners = new Set<(session: AuthSession) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener({ ...currentSession }));
}

/** Get the current mock session synchronously */
export function getAuthSession(): AuthSession {
  return { ...currentSession };
}

/** Update the mock session and notify all subscribers */
export function updateAuthSession(updates: Partial<AuthSession>): void {
  const street = updates.street ?? currentSession.street;
  const city = updates.city ?? currentSession.city;
  const state = updates.state ?? currentSession.state;

  let addressDisplay = updates.addressDisplay;
  if (!addressDisplay && (updates.street || updates.city || updates.state)) {
    const parts = [street, city, state].filter(Boolean);
    addressDisplay = parts.join(', ');
  }

  currentSession = {
    ...currentSession,
    ...updates,
    ...(addressDisplay ? { addressDisplay } : {}),
  };
  notifyListeners();
}

/** Log out: mark logged out and reset session */
export function logoutAuthSession(): void {
  currentSession = {
    ...INITIAL_AUTH_SESSION,
    isLoggedIn: false,
  };
  notifyListeners();
}

/** React hook for subscribing to auth session changes */
export function useAuthSession(): {
  session: AuthSession;
  updateSession: (updates: Partial<AuthSession>) => void;
  logout: () => void;
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

  return {
    session,
    updateSession: updateAuthSession,
    logout: logoutAuthSession,
  };
}
