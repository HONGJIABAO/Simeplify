import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthSession } from '@/lib/authSession';

export default function Index() {
  const { session } = useAuthSession();

  if (session.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#566549" />
      </View>
    );
  }

  if (!session.isLoggedIn || !session.user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!session.profile?.household_id || !session.profile?.onboarding_done) {
    const step = session.profile?.onboarding_step ?? 1;
    if (step === 2) {
      return <Redirect href="/(onboarding)/schedule" />;
    }
    if (step === 3) {
      return <Redirect href="/(onboarding)/appliances" />;
    }
    return <Redirect href="/(onboarding)/layout" />;
  }

  return <Redirect href="/(tabs)/simulator" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#faf6f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
