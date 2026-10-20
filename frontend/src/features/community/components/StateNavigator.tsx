import React from 'react';
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
} from 'lucide-react-native';

export type StateNavigatorId =
  | 'envelope_source'
  | 'waiting_page'
  | 'announce_voting'
  | 'living_task'
  | 'announce_final';

interface StateNavigatorProps {
  activeState: StateNavigatorId;
  onSelectState: (stateId: StateNavigatorId) => void;
}

interface NavItem {
  id: StateNavigatorId;
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

// Strictly ordered items as required:
// 1. Envelope Source
// 2. Waiting Page
// 3. Announce Voting Results
// 4. Living Task (States)
// 5. Announce Final Results
const NAV_ITEMS: NavItem[] = [
  {
    id: 'envelope_source',
    label: 'Envelope Source',
    icon: Mail,
  },
  {
    id: 'waiting_page',
    label: 'Waiting Page',
    icon: Clock,
  },
  {
    id: 'announce_voting',
    label: 'Announce Voting Results',
    icon: Megaphone,
  },
  {
    id: 'living_task',
    label: 'Living Task (States)',
    icon: Leaf,
  },
  {
    id: 'announce_final',
    label: 'Announce Final Results',
    icon: Trophy,
  },
];

export function StateNavigator({
  activeState,
  onSelectState,
}: StateNavigatorProps) {
  return (
    <View style={styles.outerWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeState === item.id;
          const Icon = item.icon;
          const iconColor = isActive ? '#FFFFFF' : '#4A6D56';

          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectState(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.pillButton,
                isActive ? styles.pillButtonActive : styles.pillButtonInactive,
                pressed && styles.pillButtonPressed,
              ]}
            >
              <View style={styles.iconContainer}>
                <Icon size={14} color={iconColor} strokeWidth={2} />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.pillText,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {item.label}
              </Text>

              {isActive && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    backgroundColor: '#FAF6F1',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7DE',
    paddingVertical: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3 (12px)
    paddingHorizontal: 16,
    paddingVertical: 2,
    ...(Platform.OS === 'web'
      ? ({
          display: 'flex',
          whiteSpace: 'nowrap',
          overflowX: 'auto',
        } as any)
      : {}),
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    flexShrink: 0,
    ...(Platform.OS === 'web'
      ? ({
          whiteSpace: 'nowrap',
          userSelect: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s ease-in-out',
        } as any)
      : {}),
  },
  pillButtonActive: {
    backgroundColor: '#4A6D56',
    borderWidth: 1,
    borderColor: '#3D5B46',
    shadowColor: '#4A6D56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  pillButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E2D4',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pillButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
  },
  pillTextActive: {
    fontFamily: 'SourceSans3_700Bold',
    color: '#FFFFFF',
  },
  pillTextInactive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#3F4D3A',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#95D5A6',
    marginLeft: 2,
  },
});
