import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import {
  X,
  Sprout,
  Users,
  Zap,
  Trophy,
  TreePine,
  Check,
} from 'lucide-react-native';

interface RewardUnlockedModalProps {
  visible: boolean;
  onClose: () => void;
  onClaim?: () => void;
}

export function RewardUnlockedModal({
  visible,
  onClose,
  onClaim,
}: RewardUnlockedModalProps) {
  const [isClaimed, setIsClaimed] = useState(false);

  const handleClaim = () => {
    setIsClaimed(true);
    if (onClaim) onClaim();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop} className="flex-1 justify-center items-center p-4">
        <View style={styles.contentCard} className="max-w-md mx-auto w-full">
          {/* Top Bar with Close X */}
          <View style={styles.topBar}>
            <View style={{ width: 36 }} />
            <View style={styles.dragPill} />
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeButton}
            >
              <X size={18} color="#292524" strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Sprout Illustration */}
            <View style={styles.sproutWrapper}>
              <Image
                source={require('../../../../assets/images/community/reward_sprout.png')}
                style={styles.sproutImage}
                resizeMode="contain"
              />
            </View>

            {/* Header Titles */}
            <Text style={styles.rewardTitle}>Reward unlocked</Text>
            <Text style={styles.rewardSubtitle}>
              Thank you for tending to our neighborhood! You completed your green action.
            </Text>

            {/* 1. Claim Reward Card (Warm tan) */}
            <View style={styles.claimCard}>
              <View style={styles.readyBadge}>
                <View style={styles.readyDot} />
                <Text style={styles.readyBadgeText}>
                  {isClaimed ? 'Claimed & Reserved' : 'Ready to claim'}
                </Text>
              </View>

              <Text style={styles.claimTreeTitle}>
                Plant a tree in our community
              </Text>

              {/* Sapling photo media box */}
              <View style={styles.mediaBox}>
                <Image
                  source={require('../../../../assets/images/community/sapling_thumbnail.png')}
                  style={styles.saplingThumb}
                  resizeMode="cover"
                />
                <View style={styles.mediaTextGroup}>
                  <Text style={styles.mediaTitle}>Oakwood Grove • Plot #42</Text>
                  <Text style={styles.mediaSubtitle}>
                    Community Planting Weekend
                  </Text>
                </View>
              </View>

              <Text style={styles.claimBodyText}>
                Your household sapling has been reserved for the Community Planting
                Weekend on Nov 12th. Tap below to choose your dedication plaque name and
                download your certificate.
              </Text>

              {/* Claim Action Button */}
              <Pressable
                onPress={handleClaim}
                disabled={isClaimed}
                accessibilityRole="button"
                accessibilityLabel="Claim reward"
                style={({ pressed }) => [
                  styles.claimButton,
                  isClaimed && styles.claimButtonCompleted,
                  pressed && !isClaimed && styles.claimButtonPressed,
                ]}
              >
                {isClaimed ? (
                  <>
                    <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.claimButtonText}>Certificate Claimed</Text>
                  </>
                ) : (
                  <>
                    <Sprout size={18} color="#FFFFFF" strokeWidth={1.8} />
                    <Text style={styles.claimButtonText}>Claim reward</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.claimFooterNote}>
                Reserved under Family Grove Account
              </Text>
            </View>

            {/* 2. Village Milestone Card (White) */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneTopRow}>
                <View style={styles.trophyBadge}>
                  <Trophy size={13} color="#A97A4A" strokeWidth={2} />
                  <Text style={styles.trophyBadgeText}>Village Milestone • Unlocked</Text>
                </View>
                <Text style={styles.monthGoalText}>Month 11 Goal</Text>
              </View>

              <Text style={styles.milestoneTitle}>
                Together, Our Neighborhood Did It
              </Text>
              <Text style={styles.milestoneSubtitle}>
                240 households united this month to bring our village grove to life and
                exceed our shared district goal.
              </Text>

              {/* 3 Metrics with Connecting Line */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <View style={styles.metricIconCircle}>
                    <Users size={16} color="#A97A4A" strokeWidth={1.8} />
                  </View>
                  <Text style={styles.metricValue}>240</Text>
                  <Text style={styles.metricName}>Active Homes</Text>
                  <Text style={styles.metricDetail}>100% engaged</Text>
                </View>

                <View style={styles.metricItem}>
                  <View style={styles.metricIconCircle}>
                    <Zap size={16} color="#A97A4A" strokeWidth={1.8} />
                  </View>
                  <Text style={styles.metricValue}>18.4k</Text>
                  <Text style={styles.metricName}>kWh Saved</Text>
                  <Text style={styles.metricDetail}>+14% vs goal</Text>
                </View>

                <View style={styles.metricItem}>
                  <View style={styles.metricIconCircle}>
                    <Sprout size={16} color="#A97A4A" strokeWidth={1.8} />
                  </View>
                  <Text style={styles.metricValue}>+42.8k</Text>
                  <Text style={styles.metricName}>Grove Points</Text>
                  <Text style={styles.metricDetail}>District fund</Text>
                </View>
              </View>

              {/* Green Box: Unlocked Perk */}
              <View style={styles.perkBox}>
                <View style={styles.perkIconCircle}>
                  <TreePine size={16} color="#FFFFFF" strokeWidth={1.8} />
                </View>
                <View style={styles.perkTextGroup}>
                  <Text style={styles.perkTitle}>
                    Unlocked Perk: Oakwood Grove Enhancement
                  </Text>
                  <Text style={styles.perkSubtitle}>
                    Sapling dedication ceremonies and shaded community bench
                    installations begin this Saturday.
                  </Text>
                </View>
              </View>
            </View>

            {/* Bottom Done Button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 37, 36, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  contentCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '94%',
    backgroundColor: '#FAF7F2',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D3D1',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  sproutWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  sproutImage: {
    width: 86,
    height: 98,
  },
  rewardTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 27,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 6,
  },
  rewardSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    color: '#57534E',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  claimCard: {
    backgroundColor: '#F7EDE0',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9DEC9',
    marginBottom: 16,
  },
  readyBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E3ECE0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 10,
  },
  readyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4E6543',
  },
  readyBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#4E6543',
  },
  claimTreeTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 21,
    color: '#292524',
    marginBottom: 12,
  },
  mediaBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  saplingThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  mediaTextGroup: {
    flex: 1,
  },
  mediaTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13.5,
    color: '#292524',
  },
  mediaSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  claimBodyText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
    lineHeight: 18.5,
    marginBottom: 14,
  },
  claimButton: {
    backgroundColor: '#829A78',
    borderRadius: 9999,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  claimButtonPressed: {
    backgroundColor: '#6F8565',
    transform: [{ translateY: 1 }],
  },
  claimButtonCompleted: {
    backgroundColor: '#566549',
  },
  claimButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  claimFooterNote: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11.5,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 8,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
  },
  milestoneTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  trophyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F6EAD8',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
  },
  trophyBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#A97A4A',
  },
  monthGoalText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11.5,
    color: '#78716C',
  },
  milestoneTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 21,
    color: '#292524',
    marginBottom: 6,
  },
  milestoneSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
    lineHeight: 17,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FBF4EC',
    borderWidth: 1,
    borderColor: '#F3E4D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  metricName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#57534E',
    marginTop: 1,
  },
  metricDetail: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 10.5,
    color: '#78716C',
  },
  perkBox: {
    backgroundColor: '#E9EFE6',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  perkIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4B5F43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTextGroup: {
    flex: 1,
  },
  perkTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12.5,
    color: '#292524',
  },
  perkSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11.5,
    color: '#57534E',
    lineHeight: 15,
    marginTop: 2,
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#EFECE6',
    borderRadius: 9999,
  },
  doneButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14.5,
    color: '#292524',
  },
});
