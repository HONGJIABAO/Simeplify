import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthSession } from '@/lib/authSession';

export default function OnboardingIndex() {
  const { session } = useAuthSession();

  const step = session.profile?.onboarding_step ?? 1;
  if (step === 2) {
    return <Redirect href="/(onboarding)/schedule" />;
  }
  if (step === 3) {
    return <Redirect href="/(onboarding)/appliances" />;
  }
  return <Redirect href="/(onboarding)/layout" />;
}
