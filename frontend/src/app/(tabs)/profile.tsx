import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProfileScreen from '@/features/profile/ProfileScreen';
import { UserGender } from '@/lib/authSession';

export default function ProfileTab() {
  const { gender } = useLocalSearchParams<{ gender?: UserGender }>();

  return <ProfileScreen initialGender={gender} />;
}
