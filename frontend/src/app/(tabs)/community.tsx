import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { CommunityHeader } from '@/features/community/components/CommunityHeader';
import {
  DemoControlsPanel,
  StateNavigatorId,
  LivingLeafVariation,
} from '@/features/community/components/DemoControlsPanel';
import { NewLetterHome } from '@/features/community/components/NewLetterHome';
import { VotingLetterModal } from '@/features/community/components/VotingLetterModal';
import { VotedWaitingView } from '@/features/community/components/VotedWaitingView';
import { LivingLeafHome } from '@/features/community/components/LivingLeafHome';
import { RewardUnlockedModal } from '@/features/community/components/RewardUnlockedModal';
import { AnnouncementModal } from '@/features/community/components/AnnouncementModal';
import { OakridgeStatsModal } from '@/features/community/components/OakridgeStatsModal';

import {
  CommunityViewMode,
  VotingPhase,
  VotingOptionId,
  TaskItem,
} from '@/features/community/types';
import { COMMUNITY_VOTING_OPTIONS, COMMUNITY_TASKS } from '@/features/community/mockData';
import { useToast } from '@/components/Toast';

export default function CommunityScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // ── Active State Navigator (Default: 'living_task' highlighted) ────────────
  const [activeNavState, setActiveNavState] =
    useState<StateNavigatorId>('living_task');

  // ── Living Leaf Variations (Variation 1: 'healthy', Variation 2: 'dry') ──
  const [livingLeafVariation, setLivingLeafVariation] =
    useState<LivingLeafVariation>('healthy');

  // ── Journey Voting Phase State ─────────────────────────────────────────────
  // 'new'    -> Phase 1: Initial/New Letter (Envelope Source)
  // 'sealed' -> Phase 2: Voted/Waiting (Waiting Page, Ballot Sealed)
  // 'tasks'  -> Phase 3: Living Task active challenge
  const [votingPhase, setVotingPhase] = useState<VotingPhase>('tasks');

  // Sub-view mode (active view)
  const [viewMode, setViewMode] = useState<CommunityViewMode>('living_leaf');

  // ── Voting State ──────────────────────────────────────────────────────────
  const [selectedVoteId, setSelectedVoteId] = useState<VotingOptionId>('tree');
  const [votedOptionId, setVotedOptionId] = useState<VotingOptionId>('tree');
  const [turnoutCount, setTurnoutCount] = useState<number>(184);

  // ── Modals / Overlays ─────────────────────────────────────────────────────
  const [votingModalVisible, setVotingModalVisible] = useState<boolean>(false);
  const [rewardModalVisible, setRewardModalVisible] = useState<boolean>(false);
  const [announcementModalVisible, setAnnouncementModalVisible] =
    useState<boolean>(false);
  const [oakridgeStatsVisible, setOakridgeStatsVisible] =
    useState<boolean>(false);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<TaskItem[]>(COMMUNITY_TASKS);

  // ── Demo Controls State Handler ───────────────────────────────────────────
  const handleSelectNavState = (stateId: StateNavigatorId) => {
    setActiveNavState(stateId);
    switch (stateId) {
      case 'envelope_source':
        setVotingPhase('new');
        setViewMode('letter');
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        setAnnouncementModalVisible(false);
        setOakridgeStatsVisible(false);
        break;

      case 'waiting_page':
        setVotingPhase('sealed');
        setViewMode('letter');
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        setAnnouncementModalVisible(false);
        setOakridgeStatsVisible(false);
        break;

      case 'announce_voting':
        setAnnouncementModalVisible(true);
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        setOakridgeStatsVisible(false);
        break;

      case 'living_task':
        setVotingPhase('tasks');
        setViewMode('living_leaf');
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        setAnnouncementModalVisible(false);
        setOakridgeStatsVisible(false);
        break;

      case 'announce_final':
        setVotingPhase('tasks');
        setViewMode('living_leaf');
        setRewardModalVisible(true);
        setVotingModalVisible(false);
        setAnnouncementModalVisible(false);
        setOakridgeStatsVisible(false);
        break;
    }
  };

  const handleReset = () => {
    setVotingPhase('new');
    setViewMode('letter');
    setActiveNavState('envelope_source');
    setLivingLeafVariation('healthy');
    setSelectedVoteId('tree');
    setVotedOptionId('tree');
    setTurnoutCount(184);
    setVotingModalVisible(false);
    setRewardModalVisible(false);
    setAnnouncementModalVisible(false);
    setOakridgeStatsVisible(false);
    setTasks(COMMUNITY_TASKS);
    showToast(
      'Reset Complete: Restored to Phase 1 (Envelope Source).',
      'info'
    );
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenLetter = () => {
    setVotingModalVisible(true);
  };

  const handleSelectOption = (id: VotingOptionId) => {
    setSelectedVoteId(id);
  };

  const handleSubmitVote = () => {
    setVotedOptionId(selectedVoteId);
    // Transition to Waiting Page: Ballot Sealed
    setVotingPhase('sealed');
    setViewMode('letter');
    setActiveNavState('waiting_page');
    setTurnoutCount((prev) => prev + 1);
    setVotingModalVisible(false);

    showToast(
      'Ballot Sealed: Your household vote was safely recorded for Cedar Grove.',
      'success'
    );
  };

  // Phase 3 Transition Trigger:
  // User explicitly clicks "Got it" button on the Announcement modal
  const handleAnnouncementGotIt = () => {
    setAnnouncementModalVisible(false);
    // Unlocks Living Task and highlights 'living_task'
    setVotingPhase('tasks');
    setViewMode('living_leaf');
    setActiveNavState('living_task');

    showToast(
      'Announcement Acknowledged: Living Task • Day 1 unlocked!',
      'success'
    );
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
  };

  const handleClaimReward = () => {
    showToast(
      'Sapling Reserved: Plot #42 certificate downloaded to your family account.',
      'success'
    );
  };

  const currentVotedOption =
    COMMUNITY_VOTING_OPTIONS.find((opt) => opt.id === votedOptionId) ||
    COMMUNITY_VOTING_OPTIONS[0];

  return (
    <View style={styles.outerScreenWrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Dynamic Native Header with state-driven journey tab & Oakridge pressable */}
        <CommunityHeader
          votingPhase={votingPhase}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          onPressNotifications={() => router.push('/notifications')}
          onPressOakridge={() => setOakridgeStatsVisible(true)}
        />

        {/* 
          CRITICAL FIX: Isolated Demo Controls Collection
          Styled with dashed border, muted bg-gray-100, and clear "Demo State Navigator" label
          so it is visually completely separated from the actual app UI.
        */}
        <DemoControlsPanel
          activeState={activeNavState}
          onSelectState={handleSelectNavState}
          livingLeafVariation={livingLeafVariation}
          onToggleVariation={setLivingLeafVariation}
          onReset={handleReset}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Content Body dynamically bound to journey phase */}
          {votingPhase === 'new' && (
            <NewLetterHome onOpenLetter={handleOpenLetter} />
          )}

          {votingPhase === 'sealed' && (
            <VotedWaitingView
              votedOption={currentVotedOption}
              submittedTime="3:15 PM"
              onViewResults={() => {
                setActiveNavState('announce_voting');
                setAnnouncementModalVisible(true);
              }}
            />
          )}

          {/* Phase 3: "Ballot Sealed" is removed, LivingLeafHome is the active challenge */}
          {votingPhase === 'tasks' && (
            <LivingLeafHome
              tasks={tasks}
              onCompleteTask={handleCompleteTask}
              onOpenRewardModal={() => {
                setActiveNavState('announce_final');
                setRewardModalVisible(true);
              }}
              onPressOakridge={() => setOakridgeStatsVisible(true)}
              variation={livingLeafVariation}
              onToggleVariation={setLivingLeafVariation}
            />
          )}
        </ScrollView>

        {/* Modal 1: Voting Letter Modal (from Envelope Source) */}
        <VotingLetterModal
          visible={votingModalVisible}
          selectedOptionId={selectedVoteId}
          onSelectOption={handleSelectOption}
          onSubmitVote={handleSubmitVote}
          onClose={() => setVotingModalVisible(false)}
          turnoutCount={turnoutCount}
        />

        {/* Modal 2: Announce Final Results (Reward Unlocked Modal) */}
        <RewardUnlockedModal
          visible={rewardModalVisible}
          onClose={() => {
            setRewardModalVisible(false);
            if (activeNavState === 'announce_final') {
              setActiveNavState('living_task');
            }
          }}
          onClaim={handleClaimReward}
        />

        {/* Modal 3: Announce Voting Results (October Results Announcement Modal) */}
        <AnnouncementModal
          visible={announcementModalVisible}
          onClose={() => {
            setAnnouncementModalVisible(false);
            if (activeNavState === 'announce_voting') {
              setActiveNavState(votingPhase === 'tasks' ? 'living_task' : 'waiting_page');
            }
          }}
          onGotIt={handleAnnouncementGotIt}
        />

        {/* Modal 4: Oakridge Commons - Community Activity Dashboard Modal */}
        <OakridgeStatsModal
          visible={oakridgeStatsVisible}
          onClose={() => setOakridgeStatsVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerScreenWrapper: {
    flex: 1,
    backgroundColor: '#ede7df', // Soft neutral background framing mobile viewport on wide screens
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F1',
    width: '100%',
    maxWidth: 430, // Strict mobile viewport constraint
    alignSelf: 'center',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'web' ? 0.12 : 0,
    shadowRadius: 16,
    elevation: Platform.OS === 'web' ? 4 : 0,
  },
  scrollContent: {
    paddingBottom: 112, // pb-28: leaves room for floating bottom tab bar
  },
});
