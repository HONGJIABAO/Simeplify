import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

export interface SliderStop {
  value: number;
  label: string;
}

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  stops?: SliderStop[];
  onChange?: (val: number) => void;
  formatValue?: (val: number) => string;
  disabled?: boolean;
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  stops,
  onChange,
  formatValue,
  disabled = false,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const thumbX = useSharedValue(0);

  const range = max - min;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
    if (range > 0) {
      const initialRatio = Math.max(0, Math.min(1, (value - min) / range));
      thumbX.value = initialRatio * width;
    }
  };

  const updateValueFromX = (x: number) => {
    if (trackWidth <= 0 || range <= 0) return;
    const clampedX = Math.max(0, Math.min(trackWidth, x));
    thumbX.value = clampedX;
    const ratio = clampedX / trackWidth;
    let rawVal = min + ratio * range;

    if (stops && stops.length > 0) {
      // Snap to closest stop
      let closest = stops[0].value;
      let minDiff = Math.abs(rawVal - closest);
      for (let i = 1; i < stops.length; i++) {
        const diff = Math.abs(rawVal - stops[i].value);
        if (diff < minDiff) {
          minDiff = diff;
          closest = stops[i].value;
        }
      }
      rawVal = closest;
    } else if (step > 0) {
      rawVal = Math.round(rawVal / step) * step;
    }

    onChange?.(rawVal);
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((e) => {
      runOnJS(updateValueFromX)(e.x);
    })
    .onEnd((e) => {
      runOnJS(updateValueFromX)(e.x);
    });

  const ratio = range > 0 ? Math.max(0, Math.min(1, (value - min) / range)) : 0;
  const currentThumbX = trackWidth > 0 ? ratio * trackWidth : 0;

  const fillStyle = {
    width: currentThumbX,
  };

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: currentThumbX - 14 }], // 28px width / 2
  }));

  const displayBadgeValue = formatValue ? formatValue(value) : `${value}`;

  return (
    <View style={styles.container}>
      {/* Value Badge above thumb */}
      <View style={styles.badgeRow}>
        <View style={styles.valueBadge}>
          <Text style={styles.badgeText}>{displayBadgeValue}</Text>
        </View>
      </View>

      <GestureDetector gesture={panGesture}>
        <View
          style={styles.touchArea}
          onLayout={handleLayout}
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: value }}
        >
          {/* Base Track */}
          <View style={styles.track}>
            {/* Filled Track */}
            <View style={[styles.fill, fillStyle]} />
          </View>

          {/* Stops Markers */}
          {stops && trackWidth > 0
            ? stops.map((stop) => {
                const stopRatio = range > 0 ? (stop.value - min) / range : 0;
                const stopX = stopRatio * trackWidth;
                return (
                  <View
                    key={stop.value}
                    style={[styles.stopDot, { left: stopX - 4 }]}
                  />
                );
              })
            : null}

          {/* Thumb */}
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
        </View>
      </GestureDetector>

      {/* Discrete Stops Labels */}
      {stops && stops.length > 0 ? (
        <View style={styles.labelsRow}>
          {stops.map((stop) => {
            const isSelected = stop.value === value;
            return (
              <Pressable
                key={stop.value}
                onPress={() => !disabled && onChange?.(stop.value)}
                style={styles.stopLabelPressable}
                accessibilityRole="button"
                accessibilityLabel={stop.label}
              >
                <Text
                  style={[
                    styles.stopLabelText,
                    isSelected ? styles.stopLabelSelected : null,
                  ]}
                >
                  {stop.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  badgeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  valueBadge: {
    backgroundColor: '#e0e6d9', // sage-100
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#566549', // sage-600
  },
  touchArea: {
    height: 48, // 48px touch target
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 8,
    borderRadius: 9999,
    backgroundColor: '#e7e5e4', // stone-200
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: '#8b9d77', // sage-400
    borderRadius: 9999,
  },
  thumb: {
    position: 'absolute',
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 9999,
    backgroundColor: '#faf6f1', // cream
    borderWidth: 2,
    borderColor: '#566549', // sage-600
    shadowColor: '#5c4033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  stopDot: {
    position: 'absolute',
    top: 22,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a8a29e', // stone-400
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stopLabelPressable: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  stopLabelText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#a8a29e', // stone-400
  },
  stopLabelSelected: {
    fontFamily: 'SourceSans3_600SemiBold',
    color: '#566549', // sage-600
  },
});
