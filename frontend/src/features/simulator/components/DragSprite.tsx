import React, { useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable } from 'react-native';
import { Sprite } from './Sprite';
export function DragSprite({ type, label, onDrop, onPress, enabled = true, on = false, size = 48, catalog = false, onDrag }: {
  type: string; label: string; onDrop?: (x: number, y: number) => void; onPress: () => void;
  onDrag?: (point: { x: number; y: number } | null) => void;
  enabled?: boolean; on?: boolean; size?: number; catalog?: boolean;
}) {
  const [delta] = useState(() => new Animated.ValueXY());
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => enabled,
    onMoveShouldSetPanResponderCapture: (_, g) => enabled && (catalog ? Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx) : Math.hypot(g.dx, g.dy) > 6),
    onPanResponderMove: (_, g) => { delta.setValue({ x: g.dx, y: g.dy }); onDrag?.({ x: g.moveX, y: g.moveY }); },
    onPanResponderRelease: (_, g) => { delta.setValue({ x: 0, y: 0 }); onDrag?.(null); if (Math.hypot(g.dx, g.dy) < 6) onPress(); else onDrop?.(g.moveX, g.moveY); },
    onPanResponderTerminate: () => { delta.setValue({ x: 0, y: 0 }); onDrag?.(null); },
    onPanResponderTerminationRequest: () => false,
  }), [enabled, catalog, delta, onDrop, onDrag, onPress]);
  return <Animated.View {...responder.panHandlers} style={{ transform: delta.getTranslateTransform(), zIndex: 20 }}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}${on ? ', on' : ''}`} style={{ width: size, height: size, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? 'rgba(255,225,112,.7)' : 'transparent', borderWidth: on ? 1 : 0, borderColor: '#d4a373' }}>
      <Sprite type={type} size={size} />
    </Pressable>
  </Animated.View>;
}
