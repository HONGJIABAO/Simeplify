import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import {
  CommunityDashboard,
  CommunityLoading,
  CommunityStatus,
} from '@/features/community/components/CommunityDashboard';
import { COMMUNITY_DEV_FIXTURES } from '@/features/community/devFixtures';
import { useAuthSession, DEMO_HOUSEHOLD_ID } from '@/lib/authSession';
import {
  castHouseholdVote,
  CommunityServiceError,
  fetchCommunityState,
  isCommunityOfflineError,
  type CommunityState,
} from '@/lib/services/communityService';
import { useUnreadNotifications } from '@/lib/services/notificationService';

type LoadState = 'loading' | 'ready' | 'error' | 'offline';

export default function CommunityScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;
  const effectiveHouseholdId = householdId || session.user?.id || DEMO_HOUSEHOLD_ID;
  const { hasUnread } = useUnreadNotifications(householdId);
  const [community, setCommunity] = useState<CommunityState | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');
  const [votePending, setVotePending] = useState(false);

  const loadCommunity = useCallback(
    async (showSkeleton = true) => {
      if (showSkeleton && !community) setLoadState('loading');
      try {
        const next = await fetchCommunityState(effectiveHouseholdId);
        setCommunity(next);
        setMessage('');
        setLoadState('ready');
      } catch (error) {
        const offline =
          error instanceof CommunityServiceError
            ? error.kind === 'offline'
            : isCommunityOfflineError(error);

        // Fall back gracefully to mock community state when Supabase backend is unreachable/offline
        if (offline) {
          setCommunity((prev) => prev ?? COMMUNITY_DEV_FIXTURES['ready-unvoted']);
          setMessage('');
          setLoadState('ready');
          return;
        }

        const nextMessage =
          error instanceof Error ? error.message : 'Could not load Community. Try again.';
        setMessage(nextMessage);
        setLoadState('error');
        showToast(nextMessage, 'error');
      }
    },
    [community, effectiveHouseholdId, showToast]
  );

  useFocusEffect(
    useCallback(() => {
      void loadCommunity(false);
    }, [loadCommunity])
  );

  const handleVote = async (rewardId: string) => {
    if (!community || votePending) return;
    setVotePending(true);
    try {
      await castHouseholdVote(effectiveHouseholdId, rewardId, community.currentVotingMonth);
      showToast('Your household vote has been saved.', 'success');
      await loadCommunity(false);
    } catch (error) {
      const offline =
        error instanceof CommunityServiceError
          ? error.kind === 'offline'
          : isCommunityOfflineError(error);

      if (offline) {
        // Optimistic local state update in offline/demo mode
        const selected = community.rewards.find((r) => r.id === rewardId) ?? null;
        setCommunity((prev) =>
          prev
            ? {
                ...prev,
                vote: {
                  id: 'offline-vote-' + Date.now(),
                  household_id: effectiveHouseholdId,
                  reward_id: rewardId,
                  voting_month: prev.currentVotingMonth,
                  created_at: new Date().toISOString(),
                },
                selectedReward: selected,
                visibleVoteCounts: {
                  ...prev.visibleVoteCounts,
                  [rewardId]: (prev.visibleVoteCounts[rewardId] || 0) + 1,
                },
              }
            : prev
        );
        showToast('Your household vote has been saved.', 'success');
        return;
      }

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
        {/* No title bar — bell pill only matching BinHomeScreen (S5.1) */}
        <Header variant="bell-only" hasUnread={hasUnread} />

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
});

