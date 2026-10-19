import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Leaf, Mail } from 'lucide-react-native';

interface NewLetterHomeProps {
  onOpenLetter: () => void;
}

export function NewLetterHome({ onOpenLetter }: NewLetterHomeProps) {
  return (
    <View style={styles.container}>
      {/* 1. Hero Mailbox Card */}
      <View style={styles.heroCard}>
        {/* Top Right 'New letter' Pill */}
        <View style={styles.newLetterBadge}>
          <Leaf size={13} color="#566549" strokeWidth={2} />
          <Text style={styles.newLetterText}>New letter</Text>
        </View>

        {/* Mailbox Landscape Illustration */}
        <Image
          source={require('../../../../assets/images/community/mailbox_illustration.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      {/* 2. Monthly Decision Card */}
      <View style={styles.decisionCard}>
        {/* Card Header Row */}
        <View style={styles.decisionHeader}>
          <Text style={styles.decisionCategory}>MONTHLY DECISION</Text>
          <View style={styles.remainingBadge}>
            <Text style={styles.remainingText}>4 days remaining</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.decisionTitle}>This month's vote</Text>

        {/* Open Letter Primary Button */}
        <Pressable
          onPress={onOpenLetter}
          accessibilityRole="button"
          accessibilityLabel="Open letter"
          style={({ pressed }) => [
            styles.openButton,
            pressed && styles.openButtonPressed,
          ]}
        >
          <Mail size={18} color="#FFFFFF" strokeWidth={1.8} />
          <Text style={styles.openButtonText}>Open letter</Text>
        </Pressable>

        {/* Description */}
        <Text style={styles.decisionDescription}>
          Your household letter has arrived in the mailbox outside. Open your ballot
          to vote on this month's community eco-reward.
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.leafIconCircle}>
            <Leaf size={14} color="#566549" strokeWidth={1.8} />
          </View>
          <Text style={styles.infoText}>1 letter per household • No points required</Text>
        </View>
      </View>
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
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8DC',
  },
  newLetterBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(224, 232, 217, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  newLetterText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12.5,
    color: '#566549',
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 22,
  },
  decisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#5C4033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  decisionCategory: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#78716C',
    letterSpacing: 0.6,
  },
  remainingBadge: {
    backgroundColor: '#F7EDE2',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  remainingText: {
    fontFamily: 'SourceSans3_500Medium',
    fontSize: 12,
    color: '#A97A4A',
  },
  decisionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 26,
    color: '#292524',
    marginBottom: 18,
    marginTop: 2,
  },
  openButton: {
    backgroundColor: '#262220',
    borderRadius: 9999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  openButtonPressed: {
    backgroundColor: '#3E3835',
    transform: [{ translateY: 1 }],
  },
  openButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  decisionDescription: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14.5,
    color: '#57534E',
    lineHeight: 22,
    marginTop: 18,
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0ECE4',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leafIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E7EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534E',
    flex: 1,
  },
});
