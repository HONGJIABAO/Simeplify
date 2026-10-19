import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProfileScreen from '@/features/profile/ProfileScreen';

export default function ProfileTab() {
  const { sheet } = useLocalSearchParams<{ sheet?: string }>();

  return (
    <ProfileScreen
      initialSheetStatus={sheet === 'out' ? 'out' : 'at-home'}
      autoOpenSheet={sheet === 'at-home' || sheet === 'out'}
    />
  );
}
