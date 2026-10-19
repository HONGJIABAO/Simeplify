import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Recycle, Sprout, ReceiptText, User } from 'lucide-react-native';

export type TabKey = 'simulator' | 'bin' | 'community' | 'scanner' | 'profile';

export interface TabBarItem {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

export const TABS: TabBarItem[] = [
  { key: 'simulator', label: 'Simulator', Icon: House },
  { key: 'bin', label: 'Bin', Icon: Recycle },
  { key: 'community', label: 'Community', Icon: Sprout },
  { key: 'scanner', label: 'Scanner', Icon: ReceiptText },
  { key: 'profile', label: 'Profile', Icon: User },
];

export interface TabBarProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  style?: StyleProp<ViewStyle>;
}

export function TabBar({ activeTab, onTabPress, style }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barWrapper, { bottom: Math.max(insets.bottom, 16) }, style]}>
      <View style={styles.barContainer}>
        {TABS.map((tab) => {
          const isFocused = activeTab === tab.key;
          const { Icon, label } = tab;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemActive,
              ]}
            >
              <Icon
                size={22}
                color={isFocused ? '#566549' : '#57534e'}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#faf6f1', // cream
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    borderColor: '#e7e5e4', // stone-200
    padding: 6,
    shadowColor: '#5c4033', // brown shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 9999,
    minHeight: 44,
  },
  tabItemActive: {
    backgroundColor: '#e0e6d9', // sage-100 soft green pill
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  tabLabelActive: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#566549', // sage-600
  },
  tabLabelInactive: {
    fontFamily: 'SourceSans3_400Regular',
    color: '#57534e', // stone-600
  },
});
