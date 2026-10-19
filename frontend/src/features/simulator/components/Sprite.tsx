import React from 'react';
import { Image, View, StyleSheet, Platform, ImageStyle, ViewStyle } from 'react-native';
import { getSpriteSource, SPRITE_MAP } from '../logic/spriteMap';

interface SpriteProps {
  type: string;
  size?: number;
  width?: number;
  height?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
}

export function Sprite({ type, size = 44, width, height, style, containerStyle }: SpriteProps) {
  const source = getSpriteSource(type);
  if (!source) return null;

  const itemDef = SPRITE_MAP[type];
  const targetW = width ?? (itemDef ? (itemDef.baseWidth / Math.max(itemDef.baseWidth, itemDef.baseHeight)) * size * 1.1 : size);
  const targetH = height ?? (itemDef ? (itemDef.baseHeight / Math.max(itemDef.baseWidth, itemDef.baseHeight)) * size * 1.1 : size);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { width: size, height: size },
        containerStyle,
      ]}
    >
      <Image
        source={source}
        resizeMode="contain"
        style={[
          styles.image,
          {
            width: targetW,
            height: targetH,
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  image: {
    ...Platform.select({
      web: {
        // Keeps sprites sharp and crisp
        imageRendering: 'auto',
      } as any,
    }),
  },
});
