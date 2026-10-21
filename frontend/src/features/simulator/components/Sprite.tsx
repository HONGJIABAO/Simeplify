import React from 'react';
import { View, StyleSheet, Platform, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { getSpriteSource, SPRITE_MAP } from '../logic/spriteMap';
import { ITEM_IMAGE_META } from '../logic/furnishedLayout';

interface SpriteProps {
  type: string;
  size?: number;
  width?: number;
  height?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  cropTransparent?: boolean;
}

export function Sprite({ type, size = 44, width, height, style, containerStyle, cropTransparent = false }: SpriteProps) {
  const source = getSpriteSource(type);
  if (!source) {
    return null;
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
  const cropMeta = cropTransparent ? ITEM_IMAGE_META[type] : undefined;
  const croppedCanvasWidth = cropMeta && width
    ? width * cropMeta.canvasWidth / cropMeta.contentWidth
    : targetW;
  const croppedCanvasHeight = cropMeta && height
    ? height * cropMeta.canvasHeight / cropMeta.contentHeight
    : targetH;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        { width: width ?? size, height: height ?? size },
        cropMeta && styles.croppedContainer,
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
            width: croppedCanvasWidth,
            height: croppedCanvasHeight,
          },
          cropMeta && width && height ? {
            position: 'absolute',
            left: -cropMeta.contentX * width / cropMeta.contentWidth,
            top: -cropMeta.contentY * height / cropMeta.contentHeight,
          } : undefined,
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
  croppedContainer: {
    overflow: 'hidden',
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
