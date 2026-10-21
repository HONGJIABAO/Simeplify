/**
 * BIN-01, BIN-02
 * Bin home screen (S5.1): eco progress, scan card, sorting bins guide, recent scans.
 * Source: docs/page_refined.md S5.1, docs/design.md Unit 12.3
 *
 * Layout: scroll, no title bar, bell pill top right (page_refined.md 1.1).
 * Screenshots: docs/screenshot/bin/Bin.png
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Recycle,
  Camera,
  Upload,
  Leaf,
} from 'lucide-react-native';

import { Header } from '@/components/Header';
import { Card } from '@/components/Card';
import { MiniCard } from '@/components/MiniCard';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import {
  mockEcoProgress,
  mockRecentScans,
  BIN_GUIDE,
  getBinInfo,
  SHOW_CO2_CARD,
} from '@/lib/mockData';
import { useAuthSession } from '@/lib/authSession';
import { fetchBinState, type BinState } from '@/lib/services/binService';
import { useUnreadNotifications } from '@/lib/services/notificationService';

export default function BinHomeScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const householdId = session.profile?.household_id;
  const { hasUnread } = useUnreadNotifications(householdId);

  const [binState, setBinState] = useState<BinState | null>(null);

  const loadState = React.useCallback(async () => {
    if (!householdId) return;
    try {
      const state = await fetchBinState(householdId);
      setBinState(state);
    } catch (err) {
      console.error('Failed to load bin state:', err);
    }
  }, [householdId]);

  useFocusEffect(
    React.useCallback(() => {
      loadState();
    }, [loadState])
  );

  const points = binState?.points ?? mockEcoProgress.points;
  const milestoneTarget = binState?.milestoneTarget ?? mockEcoProgress.milestoneTarget;
  const milestoneName = binState?.milestoneName ?? mockEcoProgress.milestoneName;
  const itemsDiverted = binState?.itemsDiverted ?? mockEcoProgress.itemsDiverted;
  const scans = binState ? binState.recentScans : mockRecentScans;

  const progress = milestoneTarget > 0 ? points / milestoneTarget : 0;
  const pointsRemaining = Math.max(0, milestoneTarget - points);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* No title bar — bell pill only (page_refined.md 1.1) */}
      <Header variant="bell-only" hasUnread={hasUnread} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ----------------------------------------------------------------
            1. Eco progress card
            ---------------------------------------------------------------- */}
        <Card style={styles.ecoCard}>
          <View style={styles.ecoHeaderRow}>
            <View style={styles.ecoHeaderLeft}>
              <Text style={styles.ecoLabel}>Household eco progress</Text>
              <Text style={styles.ecoHeroNumber}>
                {points}
                <Text style={styles.ecoHeroPts}> pts</Text>
              </Text>
              <Text style={styles.ecoSubline}>
                +10 pts per cleanly sorted item
              </Text>
            </View>
            <View style={styles.ecoBadge}>
              <Recycle size={28} color="#566549" strokeWidth={1.5} />
            </View>
          </View>

          {/* Milestone progress */}
          <View style={styles.milestoneRow}>
            <Text style={styles.milestoneName}>{milestoneName}</Text>
            <Text style={styles.milestoneCount}>
              {points} / {milestoneTarget} pts
            </Text>
          </View>
          <ProgressBar progress={progress} style={styles.progressBar} />
          <Text style={styles.milestoneRemaining}>
            {pointsRemaining} pts until next sapling planted
          </Text>

          {/* Mini cards row */}
          <View style={styles.miniCardRow}>
            <MiniCard style={styles.miniCardHalf}>
              <View style={styles.miniCardInner}>
                <Recycle size={18} color="#566549" strokeWidth={1.5} />
                <View>
                  <Text style={styles.miniCardValue}>{itemsDiverted} items</Text>
                  <Text style={styles.miniCardLabel}>Diverted total</Text>
                </View>
              </View>
            </MiniCard>

            {/* TODO(open-item 10): CO2 card hidden until factor is decided. SHOW_CO2_CARD = false */}
            {SHOW_CO2_CARD && mockEcoProgress.co2Prevented !== null && (
              <MiniCard style={styles.miniCardHalf}>
                <View style={styles.miniCardInner}>
                  <Leaf size={18} color="#566549" strokeWidth={1.5} />
                  <View>
                    <Text style={styles.miniCardValue}>{mockEcoProgress.co2Prevented} kg</Text>
                    <Text style={styles.miniCardLabel}>CO₂ prevented</Text>
                  </View>
                </View>
              </MiniCard>
            )}
          </View>
        </Card>

        {/* ----------------------------------------------------------------
            2. Scan card
            ---------------------------------------------------------------- */}
        <Card style={styles.scanCard}>
          <View style={styles.scanBadge}>
            <Camera size={28} color="#57534e" strokeWidth={1.5} />
          </View>
          <Text style={styles.scanTitle}>Scan your waste</Text>
          <Text style={styles.scanBody}>
            Snap a photo of packaging, containers, or leftovers. Gemini AI instantly identifies the right bin.
          </Text>

          <Button
            variant="primary"
            onPress={() => router.push('/bin/scanner' as any)}
            leftIcon={<Camera size={18} color="#fafaf9" strokeWidth={1.5} />}
            style={styles.scanPrimaryBtn}
          >
            Open AI scanner
          </Button>
          <Button
            variant="secondary"
            onPress={() => router.push('/bin/upload' as any)}
            leftIcon={<Upload size={18} color="#292524" strokeWidth={1.5} />}
          >
            Upload photo from gallery
          </Button>
        </Card>

        {/* ----------------------------------------------------------------
            3. Sorting bins guide
            ---------------------------------------------------------------- */}
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>Sorting bins guide</Text>

          {BIN_GUIDE.map((bin) => (
            <Card key={bin.type} style={styles.binGuideCard}>
              <View style={styles.binGuideRow}>
                <View style={[styles.binGuideIcon, { backgroundColor: bin.color }]}>
                  <Recycle size={22} color={bin.textColor} strokeWidth={1.5} />
                </View>
                <View style={styles.binGuideInfo}>
                  <View style={styles.binGuideNameRow}>
                    <Text style={styles.binGuideName}>{bin.name}</Text>
                    <Badge tone={bin.points > 0 ? 'sage' : 'stone'}>
                      {bin.points > 0 ? `+${bin.points} pts` : `${bin.points} pts`}
                    </Badge>
                  </View>
                  <Text style={styles.binGuideExamples}>{bin.examples}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* ----------------------------------------------------------------
            4. Recent scans
            ---------------------------------------------------------------- */}
        <Card style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent scans</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all scans"
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          </View>

          {scans.length === 0 ? (
            <View style={styles.emptyScansBox}>
              <Text style={styles.emptyScansText}>No waste scans yet. Tap above to scan your first item.</Text>
            </View>
          ) : (
            scans.map((scan, index) => {
              const info = getBinInfo(scan.binType);
              const dateDisplay = (scan as any).dateStr || (scan as any).date || 'Today';
              return (
                <View key={scan.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <MiniCard style={styles.recentItemCard}>
                    <View style={styles.recentItemRow}>
                      <View style={[styles.recentItemIcon, { backgroundColor: info.color + '22' }]}>
                        <Recycle size={18} color={info.color} strokeWidth={1.5} />
                      </View>
                      <View style={styles.recentItemInfo}>
                        <Text style={styles.recentItemName}>{scan.itemName}</Text>
                        <Text style={styles.recentItemMeta}>
                          {info.name} bin • {dateDisplay}
                        </Text>
                      </View>
                      <Badge
                        tone={scan.points > 0 ? 'sage' : 'stone'}
                        style={styles.recentPointsBadge}
                      >
                        {scan.points > 0 ? `+${scan.points} pts` : `${scan.points} pts`}
                      </Badge>
                    </View>
                  </MiniCard>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyScansBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyScansText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#78716c',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#faf6f1', // cream
  },
  scrollContent: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 112, // pb-28
    gap: 32, // section gap-8
  },

  // Eco progress
  ecoCard: {
    padding: 24,
  },
  ecoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ecoHeaderLeft: {
    flex: 1,
  },
  ecoLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e', // stone-600
    marginBottom: 4,
  },
  ecoHeroNumber: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 40,
    color: '#292524', // stone-800
    letterSpacing: -1,
  },
  ecoHeroPts: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 18,
    color: '#57534e',
  },
  ecoSubline: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    marginTop: 2,
  },
  ecoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e0e6d9', // sage-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#292524',
  },
  milestoneCount: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  progressBar: {
    marginBottom: 8,
  },
  milestoneRemaining: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    textAlign: 'center',
    marginBottom: 16,
  },
  miniCardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniCardHalf: {
    flex: 1,
  },
  miniCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniCardValue: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  miniCardLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
  },

  // Scan card
  scanCard: {
    alignItems: 'center',
    padding: 24,
  },
  scanBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f4', // stone-100
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scanTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    textAlign: 'center',
    marginBottom: 8,
  },
  scanBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  scanPrimaryBtn: {
    width: '100%',
    marginBottom: 12,
  },

  // Guide section
  guideSection: {
    gap: 12,
  },
  guideSectionTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginBottom: 4,
  },
  binGuideCard: {
    padding: 16,
  },
  binGuideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  binGuideIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binGuideInfo: {
    flex: 1,
  },
  binGuideNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  binGuideName: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 16,
    color: '#292524',
  },
  binGuideExamples: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
    lineHeight: 18,
  },

  // Recent scans
  recentCard: {
    padding: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
  },
  viewAllBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#566549', // sage-600
  },
  divider: {
    height: 1,
    backgroundColor: '#e7e5e4', // stone-200
    marginVertical: 6,
  },
  recentItemCard: {
    padding: 12,
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  recentItemMeta: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#57534e',
  },
  recentPointsBadge: {
    alignSelf: 'center',
  },
});
