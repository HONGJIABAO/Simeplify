import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Recycle, Sprout, ReceiptText, User } from 'lucide-react-native';

const TAB_CONFIG: Record<
  string,
  { label: string; Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }
> = {
  simulator: { label: 'Simulator', Icon: House },
  bin: { label: 'Bin', Icon: Recycle },
  community: { label: 'Community', Icon: Sprout },
  scanner: { label: 'Scanner', Icon: ReceiptText },
  profile: { label: 'Profile', Icon: User },
};

type TabsTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function FloatingTabBar({ state }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barWrapper, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.barContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            label: route.name,
            Icon: House,
          };
          const { Icon, label } = config;

          const onPress = () => {
            if (!isFocused) {
              router.navigate(`/(tabs)/${route.name}` as any);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
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

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="simulator" options={{ title: 'Simulator' }} />
      <Tabs.Screen name="bin" options={{ title: 'Bin' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="scanner" options={{ title: 'Scanner' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 50,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#faf6f1', // cream
    borderRadius: 9999,
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
    color: '#566549', // sage-600 deep green
  },
  tabLabelInactive: {
    fontFamily: 'SourceSans3_400Regular',
    color: '#57534e', // stone-600
  },
});
