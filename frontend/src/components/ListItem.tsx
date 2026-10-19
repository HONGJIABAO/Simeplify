import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightValue?: React.ReactNode;
  showChevron?: boolean;
  showDivider?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightValue,
  showChevron = true,
  showDivider = true,
  onPress,
  style,
  accessibilityLabel,
}: ListItemProps) {
  const content = (
    <View style={[styles.container, style]}>
      <View style={styles.leftRow}>
        {leftIcon ? <View style={styles.iconCircle}>{leftIcon}</View> : null}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightRow}>
        {rightValue ? (
          typeof rightValue === 'string' ? (
            <Text style={styles.rightValueText}>{rightValue}</Text>
          ) : (
            rightValue
          )
        ) : null}
        {showChevron ? (
          <ChevronRight size={18} color="#a8a29e" strokeWidth={1.5} />
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          style={({ pressed }) => [
            styles.pressable,
            pressed && styles.pressed,
          ]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  pressable: {
    borderRadius: 16,
  },
  pressed: {
    backgroundColor: '#f5f5f4', // stone-100
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: '#f5f5f4', // stone-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 15,
    color: '#292524', // stone-800
  },
  subtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#57534e', // stone-600
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightValueText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#57534e', // stone-600
  },
  divider: {
    height: 1,
    backgroundColor: '#e7e5e4', // stone-200
    marginHorizontal: 8,
  },
});
