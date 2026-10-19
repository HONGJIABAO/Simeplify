import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import {
  Mail,
  Sprout,
  TreePine,
  Check,
  Scale,
  Users,
  ChevronRight,
} from 'lucide-react-native';
import { VotingOption } from '../types';

interface VotedWaitingViewProps {
  votedOption: VotingOption;
  submittedTime?: string;
  onViewResults?: () => void;
}

export function VotedWaitingView({
  votedOption,
  submittedTime = '3:15 PM',
  onViewResults,
}: VotedWaitingViewProps) {
  return (
    <View style={styles.container}>
      {/* 1. Hero Pigeon Carrier Card */}
      <View style={styles.heroCard}>
        {/* Top Tags */}
        <View style={styles.heroTagsRow}>
          <View style={styles.sealedTag}>
            <View style={styles.sealedDot} />
            <Text style={styles.sealedText}>Ballot Sealed</Text>
          </View>

          <View style={styles.collectedTag}>
            <Mail size={13} color="#57534E" strokeWidth={1.8} />
            <Text style={styles.collectedText}>Letter collected</Text>
          </View>
        </View>

        {/* Carrier Pigeon Illustration */}
        <Image
          source={require('../../../../assets/images/community/pigeon_illustration.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <Text style={styles.heroCaption}>
          The community post carrier has gathered ballots for Cedar Grove.
        </Text>
      </View>

      {/* 2. Main Vote Saved Status Card */}
      <View style={styles.statusCard}>
        {/* Header with Leaf Circle */}
        <View style={styles.leafIconCircle}>
          <Sprout size={18} color="#566549" strokeWidth={1.8} />
        </View>

        <Text style={styles.statusTitle}>Vote saved. Result arrives tomorrow.</Text>
        <Text style={styles.statusDescription}>
          We have safely recorded your household ballot for this month’s community reward.
        </Text>

        <View style={styles.divider} />

        {/* Your Household's Vote Section */}
        <Text style={styles.sectionHeader}>YOUR HOUSEHOLD’S VOTE</Text>

        <View style={styles.votedMiniCard}>
          <View style={styles.votedIconCircle}>
            <TreePine size={16} color="#566549" strokeWidth={1.8} />
          </View>

          <View style={styles.votedTextGroup}>
            <Text style={styles.votedTitle} numberOfLines={1}>
              {votedOption.title}
            </Text>
            <Text style={styles.votedSubtitle} numberOfLines={1}>
              {votedOption.category}
            </Text>
          </View>

          <View style={styles.submittedBadge}>
            <Check size={12} color="#4E6743" strokeWidth={2.5} />
            <Text style={styles.submittedBadgeText}>Submitted</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* What Happens Next Section */}
        <Text style={styles.sectionHeader}>WHAT HAPPENS NEXT</Text>

        <View style={styles.timelineContainer}>
          {/* Timeline Step 1 */}
          <View style={styles.timelineStep}>
            <View style={styles.stepIndicatorCol}>
              <View style={[styles.stepCircle, { backgroundColor: '#7D9B76' }]}>
                <Check size={13} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.stepConnectorLine} />
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Vote submitted today</Text>
              <Text style={styles.stepSubtitle}>
                Collected at {submittedTime} from your cottage
              </Text>
            </View>
          </View>

          {/* Timeline Step 2 */}
          <View style={styles.timelineStep}>
            <View style={styles.stepIndicatorCol}>
              <View style={[styles.stepCircle, { backgroundColor: '#F6E8D8' }]}>
                <Mail size={13} color="#A97A4A" strokeWidth={2} />
              </View>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Announcement letter tomorrow morning</Text>
              <Text style={styles.stepSubtitle}>
                Delivered directly to your community noticeboard
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Legal Fairness Notice */}
        <View style={styles.fairnessRow}>
          <Scale size={16} color="#8C867E" strokeWidth={1.8} />
          <Text style={styles.fairnessText}>
            One vote per household per month. Results are tallied fairly across the
            neighborhood.
          </Text>
        </View>
      </View>

      {/* 3. Bottom Neighbors Turnout Card */}
      <View style={styles.turnoutCard}>
        <View style={styles.turnoutIconCircle}>
          <Users size={18} color="#566549" strokeWidth={1.8} />
        </View>

        <View style={styles.turnoutTextContainer}>
          <Text style={styles.turnoutBold}>214 neighbors voted so far</Text>
          <Text style={styles.turnoutSub}>
            Voting closes tonight at midnight across all blocks.
          </Text>
        </View>
      </View>

      {/* 4. Optional View Final Results / Announcement Trigger */}
      {onViewResults && (
        <Pressable
          onPress={onViewResults}
          style={({ pressed }) => [
            styles.resultsTriggerButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.resultsTriggerContent}>
            <Text style={styles.resultsTriggerTitle}>
              Official Announcement Preview
            </Text>
            <Text style={styles.resultsTriggerSub}>
              View community ballot audit & results breakdown
            </Text>
          </View>
          <ChevronRight size={18} color="#78716C" strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#F1F4EE',
    borderRadius: 28,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8DC',
  },
  heroTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  sealedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sealedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#566549',
  },
  sealedText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#566549',
  },
  collectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  collectedText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12.5,
    color: '#57534E',
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
  },
  heroCaption: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  leafIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5ECE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    lineHeight: 28,
    marginBottom: 6,
  },
  statusDescription: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534E',
    lineHeight: 20,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0ECE4',
    marginVertical: 14,
  },
  sectionHeader: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#8C867E',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  votedMiniCard: {
    backgroundColor: '#F6EEE2',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  votedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  votedTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  votedTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  votedSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCE7D6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  submittedBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#4E6743',
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnectorLine: {
    width: 2,
    height: 22,
    backgroundColor: '#C5D4BF',
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 8,
  },
  stepTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#292524',
  },
  stepSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
    marginTop: 1,
  },
  fairnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fairnessText: {
    fontFamily: 'SourceSans3_400Regular',
    fontStyle: 'italic',
    fontSize: 12.5,
    color: '#78716C',
    flex: 1,
    lineHeight: 17,
  },
  turnoutCard: {
    backgroundColor: '#F1F5EE',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  turnoutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCE5D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnoutTextContainer: {
    flex: 1,
  },
  turnoutBold: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#292524',
  },
  turnoutSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
    marginTop: 2,
  },
  resultsTriggerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6DE',
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsTriggerContent: {
    flex: 1,
  },
  resultsTriggerTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13.5,
    color: '#292524',
  },
  resultsTriggerSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#78716C',
    marginTop: 1,
  },
});
