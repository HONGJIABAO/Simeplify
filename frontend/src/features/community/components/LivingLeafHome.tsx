import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Leaf,
  Users,
  Zap,
  RefreshCw,
  Clock,
  ChevronRight,
  Recycle,
  ReceiptText,
  Sliders,
  TreePine,
} from 'lucide-react-native';
import { TaskItem } from '../types';

interface LivingLeafHomeProps {
  tasks: TaskItem[];
  onCompleteTask: (taskId: string) => void;
  onOpenRewardModal: () => void;
}

export function LivingLeafHome({
  tasks,
  onCompleteTask,
  onOpenRewardModal,
}: LivingLeafHomeProps) {
  const router = useRouter();

  const handleTaskAction = (task: TaskItem) => {
    onCompleteTask(task.id);
    // Trigger celebration / reward
    onOpenRewardModal();
  };

  return (
    <View style={styles.container}>
      {/* 1. Hero Living Leaf Dial */}
      <View style={styles.dialSection}>
        <View style={styles.dialWrapper}>
          <Image
            source={require('../../../../assets/images/community/living_leaf_dial.png')}
            style={styles.dialImage}
            resizeMode="contain"
          />

          {/* 1 / 2 deeds pill at the base of the leaf */}
          <View style={styles.deedsPill}>
            <Leaf size={12} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.deedsPillText}>1 / 2 deeds</Text>
          </View>
        </View>

        {/* Healthy Stage Pill */}
        <View style={styles.stageStatusBadge}>
          <View style={styles.stageDot} />
          <Text style={styles.stageStatusText}>Healthy Stage • 1 action today</Text>
        </View>

        {/* Heading & Subtitle */}
        <Text style={styles.leafTitle}>Living Leaf is Thriving</Text>
        <Text style={styles.leafSubtitle}>
          Complete 1 more green action today to unlock tomorrow&apos;s Lush state &
          community perks.
        </Text>

        {/* Stage Stepper Row */}
        <View style={styles.stepperRow}>
          <View style={[styles.stepperPill, styles.stepperPillInactive]}>
            <View style={styles.stepperDotInactive} />
            <Text style={styles.stepperTextInactive}>Dry (0)</Text>
          </View>

          <Text style={styles.stepperArrow}>→</Text>

          <View style={[styles.stepperPill, styles.stepperPillActive]}>
            <View style={styles.stepperDotActive} />
            <Text style={styles.stepperTextActive}>Healthy (Active)</Text>
          </View>

          <Text style={styles.stepperArrow}>→</Text>

          <View style={[styles.stepperPill, styles.stepperPillInactive]}>
            <View style={styles.stepperDotInactive} />
            <Text style={styles.stepperTextInactive}>Lush (2+)</Text>
          </View>
        </View>
      </View>

      {/* 2. Oakridge Community Impact Card */}
      <View style={styles.impactCard}>
        {/* Header */}
        <View style={styles.impactHeader}>
          <View style={styles.impactTitleGroup}>
            <Users size={18} color="#292524" strokeWidth={1.8} />
            <Text style={styles.impactTitle}>Oakridge Community Impact</Text>
          </View>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>This Month</Text>
          </View>
        </View>

        {/* Two Mini Cards Side-by-Side */}
        <View style={styles.miniCardsRow}>
          {/* Energy Saved */}
          <View style={styles.energyMiniCard}>
            <View style={styles.metricLabelRow}>
              <Zap size={14} color="#D4A373" strokeWidth={2} />
              <Text style={styles.metricLabel}>ENERGY SAVED</Text>
            </View>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricHeroNumber}>18,420</Text>
              <Text style={styles.metricUnit}>kWh</Text>
            </View>
          </View>

          {/* Points Earned */}
          <View style={styles.pointsMiniCard}>
            <View style={styles.metricLabelRow}>
              <Leaf size={14} color="#566549" strokeWidth={2} />
              <Text style={styles.metricLabel}>POINTS EARNED</Text>
            </View>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricHeroNumber}>+42,850</Text>
              <Text style={styles.metricUnit}>pts</Text>
            </View>
          </View>
        </View>

        {/* Footer info row */}
        <View style={styles.impactFooter}>
          <View style={styles.contributingGroup}>
            <View style={styles.greenContributingDot} />
            <Text style={styles.contributingText}>240 households contributing</Text>
          </View>

          <View style={styles.syncGroup}>
            <Text style={styles.syncText}>Live sync</Text>
            <RefreshCw size={12} color="#57534E" strokeWidth={2} />
          </View>
        </View>
      </View>

      {/* 3. Recommended for you Section */}
      <View style={styles.recommendedSection}>
        {/* Section Header */}
        <View style={styles.recommendedHeader}>
          <Text style={styles.recommendedTitle}>Recommended for you</Text>
          <View style={styles.availableBadge}>
            <Text style={styles.availableBadgeText}>4 available</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={styles.swipeText}>Swipe →</Text>
        </View>

        {/* Horizontal Task Cards ScrollView */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalTasksContainer}
        >
          {/* Task 1: Recycle 1 item */}
          <View style={styles.taskCard}>
            <View style={styles.taskCardTop}>
              <View style={[styles.taskIconCircle, { backgroundColor: '#E2EBDC' }]}>
                <Recycle size={18} color="#566549" strokeWidth={1.8} />
              </View>
              <View style={styles.todoBadge}>
                <View style={styles.todoDot} />
                <Text style={styles.todoBadgeText}>To do</Text>
              </View>
            </View>

            <Text style={styles.taskCardTitle}>Recycle 1 item</Text>
            <Text style={styles.taskCardDescription}>
              Scan & correctly sort paper, plastic or metal at the community bin station.
            </Text>

            <View style={styles.taskCardFooter}>
              <View style={styles.taskMetricGroup}>
                <Clock size={14} color="#78716C" strokeWidth={1.8} />
                <Text style={styles.taskMetricText}>~30s</Text>
              </View>

              <Pressable
                onPress={() => handleTaskAction(tasks[0])}
                style={({ pressed }) => [
                  styles.taskActionButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.taskActionText}>Go to Bin →</Text>
              </Pressable>
            </View>
          </View>

          {/* Task 2: Upload lower bill */}
          <View style={styles.taskCard}>
            <View style={styles.taskCardTop}>
              <View style={[styles.taskIconCircle, { backgroundColor: '#F7EFE6' }]}>
                <ReceiptText size={18} color="#D4A373" strokeWidth={1.8} />
              </View>
              <View style={styles.todoBadge}>
                <View style={styles.todoDot} />
                <Text style={styles.todoBadgeText}>To do</Text>
              </View>
            </View>

            <Text style={styles.taskCardTitle}>Upload lower bill</Text>
            <Text style={styles.taskCardDescription}>
              Snap electricity or water bill showing baseline (&lt; 280 kWh).
            </Text>

            <View style={styles.taskCardFooter}>
              <View style={styles.taskMetricGroup}>
                <Zap size={14} color="#D4A373" strokeWidth={2} />
                <Text style={styles.taskMetricText}>&lt; 280 kWh</Text>
              </View>

              <Pressable
                onPress={() => handleTaskAction(tasks[1])}
                style={({ pressed }) => [
                  styles.taskActionButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.taskActionText}>Go to Scanner →</Text>
              </Pressable>
            </View>
          </View>

          {/* Task 3: Appliance swap simulation */}
          <View style={styles.taskCard}>
            <View style={styles.taskCardTop}>
              <View style={[styles.taskIconCircle, { backgroundColor: '#EDEAE4' }]}>
                <Sliders size={18} color="#57534E" strokeWidth={1.8} />
              </View>
              <View style={styles.todoBadge}>
                <View style={styles.todoDot} />
                <Text style={styles.todoBadgeText}>To do</Text>
              </View>
            </View>

            <Text style={styles.taskCardTitle}>Test appliance swap</Text>
            <Text style={styles.taskCardDescription}>
              Simulate replacing old AC with a 5-star inverter in the bedroom.
            </Text>

            <View style={styles.taskCardFooter}>
              <View style={styles.taskMetricGroup}>
                <Leaf size={14} color="#566549" strokeWidth={1.8} />
                <Text style={styles.taskMetricText}>+40 pts</Text>
              </View>

              <Pressable
                onPress={() => handleTaskAction(tasks[2])}
                style={({ pressed }) => [
                  styles.taskActionButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.taskActionText}>Go to Sim →</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 4. Bottom Tree Planting Banner */}
      <Pressable
        onPress={onOpenRewardModal}
        style={({ pressed }) => [
          styles.bottomBannerCard,
          pressed && { opacity: 0.88 },
        ]}
      >
        <View style={styles.bannerIconCircle}>
          <TreePine size={20} color="#D4A373" strokeWidth={1.8} />
        </View>

        <View style={styles.bannerContent}>
          <View style={styles.bannerTitleRow}>
            <Text style={styles.bannerTitle}>Oakridge Tree Planting</Text>
            <View style={styles.bannerPercentBadge}>
              <Text style={styles.bannerPercentText}>88%</Text>
            </View>
          </View>
          <Text style={styles.bannerSubtitle}>
            142 neighbors joined. Unlocks on Lush
          </Text>
        </View>

        <ChevronRight size={20} color="#A8A29E" strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  dialSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  dialWrapper: {
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dialImage: {
    width: 230,
    height: 230,
  },
  deedsPill: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#263321',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  deedsPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  stageStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5ECE0',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 9999,
    marginTop: 10,
    marginBottom: 8,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#425438',
  },
  stageStatusText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12.5,
    color: '#425438',
  },
  leafTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 24,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 6,
  },
  leafSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    color: '#57534E',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 9999,
  },
  stepperPillActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#8B9D77',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperPillInactive: {
    backgroundColor: '#F0EDE7',
  },
  stepperDotActive: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#566549',
  },
  stepperDotInactive: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#8C867E',
  },
  stepperTextActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#292524',
  },
  stepperTextInactive: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11.5,
    color: '#8C867E',
  },
  stepperArrow: {
    color: '#A8A29E',
    fontSize: 12,
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 20,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  impactTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impactTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  monthBadge: {
    backgroundColor: '#EFECE6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  monthBadgeText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11.5,
    color: '#57534E',
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  energyMiniCard: {
    flex: 1,
    backgroundColor: '#FAF6EE',
    borderRadius: 18,
    padding: 14,
  },
  pointsMiniCard: {
    flex: 1,
    backgroundColor: '#F3F6EF',
    borderRadius: 18,
    padding: 14,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  metricLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10.5,
    color: '#8C867E',
    letterSpacing: 0.4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricHeroNumber: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
  },
  metricUnit: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534E',
  },
  impactFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
  },
  contributingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenContributingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#566549',
  },
  contributingText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
  },
  syncGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
  },
  recommendedSection: {
    marginBottom: 18,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendedTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    color: '#292524',
  },
  availableBadge: {
    backgroundColor: '#E5ECE0',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  availableBadgeText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11.5,
    color: '#425438',
  },
  swipeText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#8C867E',
  },
  horizontalTasksContainer: {
    gap: 12,
    paddingRight: 4,
  },
  taskCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  taskIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0EDE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  todoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#78716C',
  },
  todoBadgeText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 11,
    color: '#78716C',
  },
  taskCardTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15.5,
    color: '#292524',
    marginBottom: 4,
  },
  taskCardDescription: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
    lineHeight: 17,
    marginBottom: 14,
    height: 34,
  },
  taskCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EC',
  },
  taskMetricGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetricText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#78716C',
  },
  taskActionButton: {
    backgroundColor: '#EFECE6',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  taskActionText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },
  bottomBannerCard: {
    backgroundColor: '#F7EFE4',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE5D6',
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14.5,
    color: '#292524',
  },
  bannerPercentBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 9999,
  },
  bannerPercentText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10.5,
    color: '#A97A4A',
  },
  bannerSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
});
