import React, { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { useToast } from '@/components/Toast';
import {
  CommunityDashboard,
  CommunityLoading,
  CommunityStatus,
} from '@/features/community/components/CommunityDashboard';
import { useAuthSession } from '@/lib/authSession';
import {
  castHouseholdVote,
  CommunityServiceError,
  fetchCommunityState,
  isCommunityOfflineError,
  type CommunityState,
} from '@/lib/services/communityService';

type LoadState = 'loading' | 'ready' | 'error' | 'offline';

export default function CommunityScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;
  const [community, setCommunity] = useState<CommunityState | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');
  const [votePending, setVotePending] = useState(false);

  const loadCommunity = useCallback(
    async (showSkeleton = true) => {
      if (!householdId) {
        setMessage('Finish household setup before opening Community.');
        setLoadState('error');
        return;
      }
      if (showSkeleton) setLoadState('loading');
      try {
        const next = await fetchCommunityState(householdId);
        setCommunity(next);
        setMessage('');
        setLoadState('ready');
      } catch (error) {
        const offline =
          error instanceof CommunityServiceError
            ? error.kind === 'offline'
            : isCommunityOfflineError(error);
        const nextMessage =
          error instanceof Error ? error.message : 'Could not load Community. Try again.';
        setMessage(nextMessage);
        setLoadState(offline ? 'offline' : 'error');
        showToast(nextMessage, 'error');
      }
    },
    [householdId, showToast]
  );

  useFocusEffect(
    useCallback(() => {
      void loadCommunity(false);
    }, [loadCommunity])
  );

  const handleVote = async (rewardId: string) => {
    if (!householdId || !community || votePending) return;
    setVotePending(true);
    try {
      await castHouseholdVote(householdId, rewardId, community.currentVotingMonth);
      showToast('Your household vote has been saved.', 'success');
      await loadCommunity(false);
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : 'Could not save your vote. Try again.';
      showToast(nextMessage, 'error');
      if (error instanceof CommunityServiceError && error.kind === 'already-voted') {
        await loadCommunity(false);
      }
      throw error;
    } finally {
      setVotePending(false);
    }
  };

  return (
    <View style={styles.outer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.topRow}>
          <View />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [styles.bellButton, pressed && styles.pressed]}
          >
            <Bell size={22} color="#292524" strokeWidth={1.7} />
          </Pressable>
        </View>

        {loadState === 'loading' && <CommunityLoading />}
        {(loadState === 'error' || loadState === 'offline') && (
          <CommunityStatus
            offline={loadState === 'offline'}
            message={message}
            onRetry={() => void loadCommunity(true)}
          />
        )}
        {loadState === 'ready' && community && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <CommunityDashboard
              state={community}
              votePending={votePending}
              onVote={handleVote}
              onAction={(route) => router.push(route)}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#EDE7DF',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FAF6F1',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'web' ? 0.12 : 0,
    shadowRadius: 16,
    elevation: Platform.OS === 'web' ? 4 : 0,
  },
  topRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bellButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.72 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
});

