import React from 'react';
import { View, StyleSheet, Platform, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { ImageOff } from 'lucide-react-native';
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
  if (!source) {
    return (
      <View
        pointerEvents="none"
        style={[styles.container, styles.placeholder, { width: size, height: size }, containerStyle]}
      >
        <ImageOff size={Math.max(18, size * 0.42)} color="#78716C" strokeWidth={1.5} />
      </View>
    );
  }

  const itemDef = SPRITE_MAP[type];
  const longestSide = itemDef ? Math.max(itemDef.baseWidth, itemDef.baseHeight) : size;
  const targetW = width ?? (itemDef ? (itemDef.baseWidth / longestSide) * size : size);
  const targetH = height ?? (itemDef ? (itemDef.baseHeight / longestSide) * size : size);
  // Metro returns a module value for a static require. On web, resolving that
  // value first avoids expo-image receiving an opaque module and drawing an
  // empty box while avatar sprites happen to be served from cache.
  const resolvedWebUri = Platform.OS === 'web'
    ? Asset.fromModule(source as Parameters<typeof Asset.fromModule>[0]).uri
    : undefined;
  const imageSource = resolvedWebUri ? { uri: resolvedWebUri } : source;

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
        source={imageSource as any}
        contentFit="contain"
        transition={0}
        cachePolicy="memory-disk"
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
  placeholder: {
    borderRadius: 16,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
});
