import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { CommunityHeader } from '@/features/community/components/CommunityHeader';
import { NewLetterHome } from '@/features/community/components/NewLetterHome';
import { VotingLetterModal } from '@/features/community/components/VotingLetterModal';
import { VotedWaitingView } from '@/features/community/components/VotedWaitingView';
import { LivingLeafHome } from '@/features/community/components/LivingLeafHome';
import { RewardUnlockedModal } from '@/features/community/components/RewardUnlockedModal';
import { AnnouncementModal } from '@/features/community/components/AnnouncementModal';
import { DevStatePill } from '@/features/community/components/DevStatePill';

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

  // ── Journey Voting Phase State ─────────────────────────────────────────────
  // 'new'    -> Phase 1: Initial/New Letter (Living Task hidden)
  // 'sealed' -> Phase 2: Voted/Waiting ("Ballot Sealed" displayed)
  // 'tasks'  -> Phase 3: "Got it" clicked on Announcement ("Living Task • Day 1" unlocked)
  const [votingPhase, setVotingPhase] = useState<VotingPhase>('new');

  // Sub-view mode (active tab when both are available in 'tasks' phase)
  const [viewMode, setViewMode] = useState<CommunityViewMode>('letter');

  // ── Voting State ──────────────────────────────────────────────────────────
  const [selectedVoteId, setSelectedVoteId] = useState<VotingOptionId>('tree');
  const [votedOptionId, setVotedOptionId] = useState<VotingOptionId>('tree');
  const [turnoutCount, setTurnoutCount] = useState<number>(184);

  // ── Modals / Overlays ─────────────────────────────────────────────────────
  const [votingModalVisible, setVotingModalVisible] = useState<boolean>(false);
  const [rewardModalVisible, setRewardModalVisible] = useState<boolean>(false);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState<boolean>(false);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<TaskItem[]>(COMMUNITY_TASKS);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenLetter = () => {
    setVotingModalVisible(true);
  };

  const handleSelectOption = (id: VotingOptionId) => {
    setSelectedVoteId(id);
  };

  const handleSubmitVote = () => {
    setVotedOptionId(selectedVoteId);
    // Transition to Phase 2: Ballot Sealed
    setVotingPhase('sealed');
    setViewMode('letter');
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
    // Instantly update "Ballot Sealed" to "Living Task"
    setVotingPhase('tasks');
    setViewMode('living_leaf');

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

  // Quick State Switcher for demo & verification
  const handleSelectDevState = (stateIndex: number) => {
    switch (stateIndex) {
      case 1: // Phase 1: New Letter (Unvoted)
        setVotingPhase('new');
        setViewMode('letter');
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        setAnnouncementModalVisible(false);
        break;
      case 2: // Voting Letter Modal Overlay
        setVotingPhase('new');
        setViewMode('letter');
        setVotingModalVisible(true);
        setRewardModalVisible(false);
        setAnnouncementModalVisible(false);
        break;
      case 3: // Phase 2: Voted (Waiting, Ballot Sealed)
        setVotingPhase('sealed');
        setViewMode('letter');
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        setAnnouncementModalVisible(false);
        break;
      case 7: // Group 2: October Results Announcement Modal
        // Note: Keeps votingPhase === 'sealed' until "Got it" is explicitly clicked!
        if (votingPhase === 'new') setVotingPhase('sealed');
        setAnnouncementModalVisible(true);
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        break;
      case 5: // Phase 3: Living Task • Day 1
        setVotingPhase('tasks');
        setViewMode('living_leaf');
        setVotingModalVisible(false);
        setRewardModalVisible(false);
        setAnnouncementModalVisible(false);
        break;
      case 6: // Reward Unlocked Overlay
        setVotingPhase('tasks');
        setViewMode('living_leaf');
        setRewardModalVisible(true);
        setVotingModalVisible(false);
        setAnnouncementModalVisible(false);
        break;
    }
  };

  const handleReset = () => {
    setVotingPhase('new');
    setViewMode('letter');
    setSelectedVoteId('tree');
    setVotedOptionId('tree');
    setTurnoutCount(184);
    setVotingModalVisible(false);
    setRewardModalVisible(false);
    setAnnouncementModalVisible(false);
    setTasks(COMMUNITY_TASKS);
    showToast(
      'Reset Complete: Restored to Phase 1 (New Letter).',
      'info'
    );
  };

  const currentVotedOption =
    COMMUNITY_VOTING_OPTIONS.find((opt) => opt.id === votedOptionId) ||
    COMMUNITY_VOTING_OPTIONS[0];

  const getCurrentStateName = () => {
    if (announcementModalVisible) return 'Group 2: Results Sheet';
    if (rewardModalVisible) return 'Img 6: Reward Unlocked';
    if (votingModalVisible) return 'Img 2: Voting Sheet';
    if (votingPhase === 'tasks' && viewMode === 'living_leaf') return 'Phase 3: Living Task (Day 1)';
    if (votingPhase === 'sealed') return 'Phase 2: Ballot Sealed';
    return 'Phase 1: New Letter';
  };

  return (
    <View style={styles.outerScreenWrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Dynamic Header with state-driven journey tab */}
        <CommunityHeader
          votingPhase={votingPhase}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          onPressNotifications={() => router.push('/notifications')}
        />

        {/* Developer State Navigator */}
        <DevStatePill
          onSelectState={handleSelectDevState}
          onReset={handleReset}
          currentState={getCurrentStateName()}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Content Body dynamically bound to journey phase & viewMode */}
          {votingPhase === 'new' && (
            <NewLetterHome onOpenLetter={handleOpenLetter} />
          )}

          {votingPhase === 'sealed' && (
            <VotedWaitingView
              votedOption={currentVotedOption}
              submittedTime="3:15 PM"
              onViewResults={() => setAnnouncementModalVisible(true)}
            />
          )}

          {votingPhase === 'tasks' && (
            viewMode === 'letter' ? (
              <VotedWaitingView
                votedOption={currentVotedOption}
                submittedTime="3:15 PM"
                onViewResults={() => setAnnouncementModalVisible(true)}
              />
            ) : (
              <LivingLeafHome
                tasks={tasks}
                onCompleteTask={handleCompleteTask}
                onOpenRewardModal={() => setRewardModalVisible(true)}
              />
            )
          )}
        </ScrollView>

        {/* Image 2: Voting Letter Modal */}
        <VotingLetterModal
          visible={votingModalVisible}
          selectedOptionId={selectedVoteId}
          onSelectOption={handleSelectOption}
          onSubmitVote={handleSubmitVote}
          onClose={() => setVotingModalVisible(false)}
          turnoutCount={turnoutCount}
        />

        {/* Image 6: Reward Unlocked Modal */}
        <RewardUnlockedModal
          visible={rewardModalVisible}
          onClose={() => setRewardModalVisible(false)}
          onClaim={handleClaimReward}
        />

        {/* Group 2: October Results Announcement Modal */}
        <AnnouncementModal
          visible={announcementModalVisible}
          onClose={() => setAnnouncementModalVisible(false)}
          onGotIt={handleAnnouncementGotIt}
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
