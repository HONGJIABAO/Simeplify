import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import {
  CommunityDashboard,
  CommunityLoading,
  CommunityStatus,
} from '@/features/community/components/CommunityDashboard';
import { MonthlyWrapUpSection } from '@/features/community/components/MonthlyWrapUpSection';
import { EcoDemoControlModal } from '@/features/simulator/components/EcoDemoControlModal';
import { COMMUNITY_DEV_FIXTURES } from '@/features/community/devFixtures';
import { useAuthSession, DEMO_HOUSEHOLD_ID } from '@/lib/authSession';
import {
  castHouseholdVote,
  CommunityServiceError,
  fetchCommunityState,
  isCommunityOfflineError,
  type CommunityState,
} from '@/lib/services/communityService';
import {
  fetchMonthlyWrapUp,
  getCurrentMonthMyt,
  type MonthlyWrapUpData,
} from '@/lib/services/monthlyWrapUpService';
import { useUnreadNotifications } from '@/lib/services/notificationService';

import { useEcoHabit } from '@/lib/ecoHabitContext';

type LoadState = 'loading' | 'ready' | 'error' | 'offline';

export default function CommunityScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { session } = useAuthSession();
  const { demoDate, isVotingVisible } = useEcoHabit();
  const householdId = session.profile?.household_id;
  const effectiveHouseholdId = householdId || session.user?.id || DEMO_HOUSEHOLD_ID;
  const { hasUnread } = useUnreadNotifications(householdId);
  const [community, setCommunity] = useState<CommunityState | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');
  const [votePending, setVotePending] = useState(false);
  const [ecoDemoModalVisible, setEcoDemoModalVisible] = useState(false);

  // Monthly wrap-up state follows demo date month by default
  const [selectedMonth, setSelectedMonth] = useState<string>(() => demoDate.slice(0, 7) + '-01');
  const [wrapUp, setWrapUp] = useState<MonthlyWrapUpData | null>(null);
  const [wrapUpLoading, setWrapUpLoading] = useState(false);
  const [wrapUpError, setWrapUpError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sync wrap-up month when demo date month changes
  useEffect(() => {
    setSelectedMonth(demoDate.slice(0, 7) + '-01');
  }, [demoDate]);

  const loadWrapUp = useCallback(async (month: string) => {
    setWrapUpLoading(true);
    setWrapUpError(null);
    try {
      const data = await fetchMonthlyWrapUp(month);
      setWrapUp(data);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Could not load monthly wrap-up';
      setWrapUpError(errMsg);
    } finally {
      setWrapUpLoading(false);
    }
  }, []);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
    void loadWrapUp(month);
  }, [loadWrapUp]);

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
      void loadWrapUp(selectedMonth);
    }, [loadCommunity, loadWrapUp, selectedMonth])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadCommunity(false),
        loadWrapUp(selectedMonth),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadCommunity, loadWrapUp, selectedMonth]);

  const handleVote = async (rewardId: string) => {
    if (!community || votePending) return;
    setVotePending(true);
    try {
      await castHouseholdVote(effectiveHouseholdId, rewardId, community.currentVotingMonth);
      showToast('Your household vote has been saved.', 'success');
      await loadCommunity(false);
    } catch (_error) {
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
    } finally {
      setVotePending(false);
    }
  };

  return (
    <View style={styles.outer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* No title bar — bell pill only matching BinHomeScreen (S5.1) */}
        <Header variant="bell-only" hasUnread={hasUnread || isVotingVisible} />

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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#566549"
                colors={['#566549']}
              />
            }
          >
            <CommunityDashboard
              state={community}
              votePending={votePending}
              onVote={handleVote}
              onAction={(route) => router.push(route)}
              wrapUpNode={
                <MonthlyWrapUpSection
                  data={wrapUp}
                  loading={wrapUpLoading}
                  error={wrapUpError}
                  selectedMonth={selectedMonth}
                  onMonthChange={handleMonthChange}
                  onRetry={() => void loadWrapUp(selectedMonth)}
                />
              }
            />
          </ScrollView>
        )}

        {/* Floating Demo Controls Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Demo date and habit simulator"
          onPress={() => setEcoDemoModalVisible(true)}
          style={({ pressed }) => [styles.ecoDemoFloatingBtn, pressed && styles.pressed]}
        >
          <Sparkles size={14} color="#FFFFFF" />
          <Text style={styles.ecoDemoFloatingText}>Demo Controls</Text>
        </Pressable>

        <EcoDemoControlModal
          visible={ecoDemoModalVisible}
          onClose={() => setEcoDemoModalVisible(false)}
        />
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
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 112,
  },
  ecoDemoFloatingBtn: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    zIndex: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#566549',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#292524',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  ecoDemoFloatingText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.78,
  },
});

