import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Mail,
  Clock,
  Megaphone,
  Leaf,
  Trophy,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react-native';

export type StateNavigatorId =
  | 'envelope_source'
  | 'waiting_page'
  | 'announce_voting'
  | 'living_task'
  | 'announce_final';

export type LivingLeafVariation = 'healthy' | 'dry';

interface DemoControlsPanelProps {
  activeState: StateNavigatorId;
  onSelectState: (stateId: StateNavigatorId) => void;
  livingLeafVariation: LivingLeafVariation;
  onToggleVariation: (variation: LivingLeafVariation) => void;
  onReset?: () => void;
}

interface NavItem {
  id: StateNavigatorId;
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'envelope_source', label: 'Envelope Source', icon: Mail },
  { id: 'waiting_page', label: 'Waiting Page', icon: Clock },
  { id: 'announce_voting', label: 'Announce Voting', icon: Megaphone },
  { id: 'living_task', label: 'Living Task (States)', icon: Leaf },
  { id: 'announce_final', label: 'Announce Final', icon: Trophy },
];

export function DemoControlsPanel({
  activeState,
  onSelectState,
  livingLeafVariation,
  onToggleVariation,
  onReset,
}: DemoControlsPanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <View style={styles.outerContainer}>
      {/* 
        Container styled specifically as a separate developer panel:
        - Muted bg-gray-100 (#F3F4F6)
        - Dashed border (border-dashed border-gray-400)
        - Distinct "Demo State Navigator" label so it never looks like native app UI
      */}
      <View style={styles.devCard}>
        {/* Header Bar */}
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.headerBar}
          accessibilityRole="button"
          accessibilityLabel="Toggle Demo State Navigator"
        >
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <SlidersHorizontal size={13} color="#4B5563" strokeWidth={2} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Demo State Navigator</Text>
              <Text style={styles.headerSubtext}>
                Developer & evaluation controls • Isolated from app UI
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV PANEL</Text>
            </View>
            {isExpanded ? (
              <ChevronUp size={16} color="#6B7280" strokeWidth={2} />
            ) : (
              <ChevronDown size={16} color="#6B7280" strokeWidth={2} />
            )}
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* 1. App State Buttons Row */}
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>JOURNEY STATE:</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.buttonsRow}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeState === item.id;
                const Icon = item.icon;
                const iconColor = isActive ? '#FFFFFF' : '#4B5563';

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectState(item.id)}
                    style={({ pressed }) => [
                      styles.statePill,
                      isActive ? styles.statePillActive : styles.statePillInactive,
                      pressed && styles.pillPressed,
                    ]}
                  >
                    <Icon size={12} color={iconColor} strokeWidth={2} />
                    <Text
                      style={[
                        styles.statePillText,
                        isActive
                          ? styles.statePillTextActive
                          : styles.statePillTextInactive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.activeDot} />}
                  </Pressable>
                );
              })}

              {onReset && (
                <Pressable
                  onPress={onReset}
                  style={[styles.statePill, styles.resetPill]}
                >
                  <RotateCcw size={12} color="#DC2626" strokeWidth={2} />
                  <Text style={styles.resetPillText}>Reset</Text>
                </Pressable>
              )}
            </ScrollView>

            {/* 2. Living Task Variation Switcher */}
            {activeState === 'living_task' && (
              <View style={styles.variationRow}>
                <Text style={styles.sectionLabel}>LIVING LEAF VARIATION:</Text>
                <View style={styles.variationToggleGroup}>
                  <Pressable
                    onPress={() => onToggleVariation('healthy')}
                    style={[
                      styles.variationBtn,
                      livingLeafVariation === 'healthy' && styles.variationBtnActiveHealthy,
                    ]}
                  >
                    <Leaf
                      size={13}
                      color={livingLeafVariation === 'healthy' ? '#FFFFFF' : '#047857'}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.variationBtnText,
                        livingLeafVariation === 'healthy'
                          ? styles.variationBtnTextActive
                          : styles.variationBtnTextInactive,
                      ]}
                    >
                      🌿 Healthy (Thriving)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => onToggleVariation('dry')}
                    style={[
                      styles.variationBtn,
                      livingLeafVariation === 'dry' && styles.variationBtnActiveDry,
                    ]}
                  >
                    <Leaf
                      size={13}
                      color={livingLeafVariation === 'dry' ? '#FFFFFF' : '#B45309'}
                      strokeWidth={2}
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                    <Text
                      style={[
                        styles.variationBtnText,
                        livingLeafVariation === 'dry'
                          ? styles.variationBtnTextActive
                          : styles.variationBtnTextInactive,
                      ]}
                    >
                      🍂 Dry State (0 Actions)
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  devCard: {
    backgroundColor: '#F3F4F6', // bg-gray-100
    borderWidth: 1.5,
    borderStyle: 'dashed', // Dashed border separating it visually from native UI
    borderColor: '#9CA3AF', // border-gray-400
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#374151',
    letterSpacing: 0.2,
  },
  headerSubtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  devBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 9.5,
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionLabelRow: {
    marginBottom: 6,
  },
  sectionLabel: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    ...(Platform.OS === 'web'
      ? ({
          whiteSpace: 'nowrap',
          overflowX: 'auto',
        } as any)
      : {}),
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    flexShrink: 0,
    ...(Platform.OS === 'web'
      ? ({
          whiteSpace: 'nowrap',
          userSelect: 'none',
          cursor: 'pointer',
        } as any)
      : {}),
  },
  statePillActive: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  statePillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  pillPressed: {
    opacity: 0.8,
  },
  statePillText: {
    fontSize: 12,
    includeFontPadding: false,
  },
  statePillTextActive: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#FFFFFF',
  },
  statePillTextInactive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#374151',
  },
  activeDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#10B981',
  },
  resetPill: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#DC2626',
  },
  variationRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  variationToggleGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  variationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  variationBtnActiveHealthy: {
    backgroundColor: '#065F46', // emerald-800
    borderColor: '#047857',
  },
  variationBtnActiveDry: {
    backgroundColor: '#92400E', // amber-800
    borderColor: '#78350F',
  },
  variationBtnText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
  },
  variationBtnTextActive: {
    color: '#FFFFFF',
  },
  variationBtnTextInactive: {
    color: '#4B5563',
  },
});
