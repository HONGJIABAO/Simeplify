import React from 'react';
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
  Mail,
  TreePine,
  Leaf,
  ShoppingBag,
  Wrench,
  Users,
  CircleCheck,
  Check,
} from 'lucide-react-native';
import { VotingOptionId } from '../types';
import { COMMUNITY_VOTING_OPTIONS } from '../mockData';

interface VotingLetterModalProps {
  visible: boolean;
  selectedOptionId: VotingOptionId;
  onSelectOption: (id: VotingOptionId) => void;
  onSubmitVote: () => void;
  onClose: () => void;
  turnoutCount?: number;
}

export function VotingLetterModal({
  visible,
  selectedOptionId,
  onSelectOption,
  onSubmitVote,
  onClose,
  turnoutCount = 184,
}: VotingLetterModalProps) {
  const turnoutPercent = Math.min(100, Math.round((turnoutCount / 240) * 100));

  const renderOptionIcon = (id: VotingOptionId) => {
    switch (id) {
      case 'tree':
        return (
          <View style={[styles.optionIconCircle, { backgroundColor: '#D4E2CD' }]}>
            <Leaf size={16} color="#566549" strokeWidth={1.8} />
          </View>
        );
      case 'discount':
        return (
          <View style={[styles.optionIconCircle, { backgroundColor: '#F7EFE6' }]}>
            <ShoppingBag size={16} color="#D4A373" strokeWidth={1.8} />
          </View>
        );
      case 'tools':
        return (
          <View style={[styles.optionIconCircle, { backgroundColor: '#EDEAE4' }]}>
            <Wrench size={16} color="#57534E" strokeWidth={1.8} />
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrimOverlay} className="flex-1 justify-end items-center">
        <Pressable style={styles.scrimPressable} onPress={onClose} />

        <View style={styles.sheetContainer} className="max-w-md mx-auto w-full">
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Tag */}
            <View style={styles.ballotTagRow}>
              <Mail size={13} color="#57534E" strokeWidth={1.8} />
              <Text style={styles.ballotTagText}>Official Ballot • Issue #09</Text>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.sheetTitle}>This month’s community vote</Text>
            <Text style={styles.sheetSubtitle}>
              Choose the reward our neighborhood should unlock this month. One vote per
              household.
            </Text>

            {/* Community Tree Planting Banner */}
            <View style={styles.bannerContainer}>
              <Image
                source={require('../../../../assets/images/community/tree_planting_banner.png')}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              <View style={styles.bannerBadge}>
                <TreePine size={12} color="#566549" strokeWidth={2} />
                <Text style={styles.bannerBadgeText}>Oakridge Green Commons</Text>
              </View>
            </View>

            {/* Options List */}
            <View style={styles.optionsList}>
              {COMMUNITY_VOTING_OPTIONS.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => onSelectOption(opt.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected ? styles.optionCardSelected : styles.optionCardUnselected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    {renderOptionIcon(opt.id)}

                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>{opt.title}</Text>
                      <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.selectedBadge}>
                        <Check size={13} color="#3E5334" strokeWidth={2.5} />
                        <Text style={styles.selectedBadgeText}>Selected</Text>
                      </View>
                    ) : (
                      <View style={styles.voteButtonBadge}>
                        <Text style={styles.voteButtonBadgeText}>Vote</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Household Turnout Card */}
            <View style={styles.turnoutCard}>
              <View style={styles.turnoutTopRow}>
                <View style={styles.turnoutIconCircle}>
                  <Users size={16} color="#A97A4A" strokeWidth={1.8} />
                </View>
                <Text style={styles.turnoutLabel}>Household Turnout</Text>
                <Text style={styles.turnoutValue}>{turnoutCount} / 240</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${turnoutPercent}%` }]}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <Pressable
              onPress={onSubmitVote}
              accessibilityRole="button"
              accessibilityLabel="Submit vote"
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
              ]}
            >
              <CircleCheck size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.submitButtonText}>Submit vote</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Later"
              style={styles.laterButton}
            >
              <Text style={styles.laterButtonText}>Later</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrimOverlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 37, 36, 0.45)',
    justifyContent: 'flex-end',
  },
  scrimPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 10,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D6D3D1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 36,
  },
  ballotTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ballotTagText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12.5,
    color: '#57534E',
  },
  sheetTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 24,
    color: '#292524',
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13.5,
    color: '#57534E',
    lineHeight: 19,
    marginBottom: 16,
  },
  bannerContainer: {
    position: 'relative',
    height: 155,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 9999,
  },
  bannerBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11.5,
    color: '#292524',
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionCardSelected: {
    backgroundColor: '#E5EDE1',
    borderColor: '#BDD2B7',
  },
  optionCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAE7E0',
  },
  optionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14.5,
    color: '#292524',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12.5,
    color: '#57534E',
    lineHeight: 16,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9999,
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#3E5334',
  },
  voteButtonBadge: {
    backgroundColor: '#F0EDE7',
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  voteButtonBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#292524',
  },
  turnoutCard: {
    backgroundColor: '#F5EDE1',
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
  },
  turnoutTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  turnoutIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBDCC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  turnoutLabel: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 13,
    color: '#57534E',
    flex: 1,
  },
  turnoutValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 14,
    color: '#292524',
  },
  progressTrack: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DDD4C7',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7D9B76',
    borderRadius: 3.5,
  },
  submitButton: {
    backgroundColor: '#829A78',
    borderRadius: 9999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonPressed: {
    backgroundColor: '#6F8565',
    transform: [{ translateY: 1 }],
  },
  submitButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  laterButtonText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 14.5,
    color: '#57534E',
  },
});
