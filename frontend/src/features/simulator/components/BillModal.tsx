/**
 * SIM-01
 * Estimated bill modal — centered modal card over a scrim.
 * States: filled (by appliance breakdown) and empty (no appliances yet).
 * Source: docs/page_refined.md S4.2, docs/design.md Unit 11.
 *
 * Layout (from screenshot simulator_bill_card.png):
 *   "Estimated monthly bill"  [×]
 *   RM 233  (Lora 44)
 *   525 kWh a month
 *   [stacked bar, one segment per appliance]
 *   By appliance
 *   [row per appliance: dot, icon, name, room | RM | %]
 *   [thin progress bar in appliance color]
 *   ---
 *   Footer note
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  X,
} from 'lucide-react-native';
import { Appliance, MOCK_APPLIANCE_KWH, Room } from '@/lib/mockData';
import { calcBillFromKwh, applianceShare, formatRM } from '@/features/simulator/logic/billCalc';
import { Sprite } from './Sprite';
import { Button } from '@/components/Button';
import { colors, shadows } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Appliance icon map
// ---------------------------------------------------------------------------
function ApplianceIcon({
  type,
  size = 20,
}: {
  type: Appliance['type'];
  color: string;
  size?: number;
}) {
  return <Sprite type={type} size={size + 12} />;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface BillModalProps {
  rooms?: Room[]; usage?: Record<string, number>;
  visible: boolean;
  onClose: () => void;
  appliances: Appliance[];
  /** Monthly kWh total */
  totalKwh: number;
  /** Called when user taps "Add appliances" in the empty state */
  onAddAppliances: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BillModal({
  visible,
  rooms, usage,
  onClose,
  appliances,
  totalKwh,
  onAddAppliances,
}: BillModalProps) {
  const { width } = useWindowDimensions();
  const modalWidth = Math.min(width - 32, 420);

  const totalBillRm = useMemo(() => calcBillFromKwh(totalKwh), [totalKwh]);
  const isEmpty = appliances.length === 0 || totalKwh <= 0;

  // Per-appliance computed shares
  const applianceData = useMemo(() => {
    return appliances.map((app) => {
      const kWh = usage?.[app.id] ?? MOCK_APPLIANCE_KWH[app.id] ?? 0;
      const roomEntry = rooms?.find(r => r.id === app.roomId);
      const baseName = roomEntry?.name || 'Unnamed room';
      const duplicates = rooms?.filter((candidate) => candidate.name === baseName).length ?? 0;
      const room = duplicates > 1 && (roomEntry as any)?.floor
        ? `${baseName} (${(roomEntry as any).floor}F)` : baseName;
      const { rm, pct } = applianceShare(kWh, totalKwh, totalBillRm);
      return { app, kWh, rm, pct, room };
    });
  }, [appliances, totalKwh, totalBillRm, usage, rooms]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Scrim container */}
      <View style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss estimated bill modal"
        />
        {/* Card */}
        <View style={[styles.card, { width: modalWidth }]}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Estimated monthly bill</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close estimated bill"
            >
              <X size={20} color={colors['stone-600']} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Hero number */}
          <Text style={styles.heroNumber}>
            {isEmpty ? 'RM 0' : formatRM(Math.round(totalBillRm))}
          </Text>
          <Text style={styles.kwhLine}>
            {isEmpty ? '0 kWh a month' : `${totalKwh} kWh a month`}
          </Text>

          {/* Stacked bar */}
          <View style={styles.stackedBar}>
            {isEmpty ? (
              <View style={[styles.stackedBarEmpty]} />
            ) : (
              applianceData.map(({ app, pct }) => (
                <View
                  key={app.id}
                  style={[
                    styles.stackedBarSegment,
                    {
                      flex: pct,
                      backgroundColor: app.color,
                    },
                  ]}
                />
              ))
            )}
          </View>

          {isEmpty ? (
            /* ── Empty state ─────────────────────────────────────────── */
            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No appliances yet</Text>
              <Text style={styles.emptyBody}>
                Add your appliances to see where your money goes.
              </Text>
              <Button
                variant="accent"
                onPress={() => {
                  onClose();
                  onAddAppliances();
                }}
                style={styles.addButton}
              >
                Add appliances
              </Button>
            </View>
          ) : (
            /* ── Filled breakdown ─────────────────────────────────────── */
            <ScrollView
              style={styles.breakdownScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.byApplianceHeading}>By appliance</Text>

              {applianceData.map(({ app, rm, pct, room }, idx) => (
                <View key={app.id}>
                  {/* Appliance row */}
                  <View style={styles.applianceRow}>
                    {/* Left: dot + icon */}
                    <View style={styles.applianceLeft}>
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: app.color },
                        ]}
                      />
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: app.color + '30' },
                        ]}
                      >
                        <ApplianceIcon
                          type={app.type}
                          color={colors['stone-800']}
                          size={18}
                        />
                      </View>
                      <View style={styles.applianceMeta}>
                        <Text style={styles.applianceName}>{app.name}</Text>
                        <Text style={styles.applianceRoom}>
                          {room}
                        </Text>
                      </View>
                    </View>

                    {/* Right: RM + percent */}
                    <View style={styles.applianceRight}>
                      <Text style={styles.applianceRM}>{formatRM(rm)}</Text>
                      <Text style={styles.appliancePct}>{pct}%</Text>
                    </View>
                  </View>

                  {/* Per-appliance thin progress bar */}
                  <View style={styles.applianceBar}>
                    <View
                      style={[
                        styles.applianceBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: app.color,
                        },
                      ]}
                    />
                  </View>

                  {/* Divider */}
                  {idx < applianceData.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer note (both states) */}
          <Text style={styles.footer}>
            Estimate from your appliances and your day. Your real bill may be
            different.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(41,37,36,0.4)', // stone-800 at 40%
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#faf6f1', // cream
    borderRadius: 32,
    padding: 24,
    maxHeight: '80%',
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e', // stone-600
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -12,
    marginTop: -8,
  },
  heroNumber: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 44,
    color: '#292524', // stone-800
    lineHeight: 52,
  },
  kwhLine: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    marginBottom: 12,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#e7e5e4', // stone-200
    marginBottom: 16,
  },
  stackedBarEmpty: {
    flex: 1,
    backgroundColor: '#e7e5e4',
  },
  stackedBarSegment: {
    height: 14,
  },

  // Empty state
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyTitle: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    color: '#292524',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#57534e',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  addButton: {
    width: '100%',
    marginBottom: 4,
  },

  // Breakdown
  breakdownScroll: {
    flexShrink: 1,
  },
  byApplianceHeading: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 18,
    color: '#292524',
    marginBottom: 12,
  },
  applianceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  applianceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  applianceMeta: {
    flex: 1,
  },
  applianceName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  applianceRoom: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  applianceRight: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  applianceRM: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 15,
    color: '#292524',
  },
  appliancePct: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e',
  },
  applianceBar: {
    height: 4,
    borderRadius: 9999,
    backgroundColor: '#e7e5e4',
    marginBottom: 4,
    overflow: 'hidden',
  },
  applianceBarFill: {
    height: 4,
    borderRadius: 9999,
  },
  divider: {
    height: 1,
    backgroundColor: '#e7e5e4',
    marginVertical: 4,
  },

  // Footer
  footer: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#a8a29e', // stone-400
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
