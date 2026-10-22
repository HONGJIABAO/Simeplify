import React from 'react';
import { View, StyleSheet, Platform, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { getSpriteSource } from '../logic/spriteMap';
import { ITEM_IMAGE_META } from '../logic/furnishedLayout';

interface SpriteProps {
  type: string;
  size?: number;
  width?: number;
  height?: number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  cropTransparent?: boolean;
  resizeMode?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
}

export function Sprite({
  type,
  size = 44,
  width,
  height,
  style,
  containerStyle,
  cropTransparent = false,
  resizeMode = 'contain',
}: SpriteProps) {
  const source = getSpriteSource(type);
  if (!source) {
    return null;
  }

  const targetW = width ?? size;
  const targetH = height ?? size;
  // Metro returns a module value for a static require. On web, resolving that
  // value first avoids expo-image receiving an opaque module and drawing an
  // empty box while avatar sprites happen to be served from cache.
  const resolvedWebUri = Platform.OS === 'web'
    ? Asset.fromModule(source as Parameters<typeof Asset.fromModule>[0]).uri
    : undefined;
  const imageSource = resolvedWebUri ? { uri: resolvedWebUri } : source;
  const cropMeta = cropTransparent ? ITEM_IMAGE_META[type] : undefined;
  // Use one scale for both axes. The previous independent width/height scales
  // changed the canvas aspect ratio on web, so expo-image's `contain` pass
  // added another offset and the painted pixels could land outside the crop.
  const cropScale = cropMeta
    ? Math.min(targetW / cropMeta.contentWidth, targetH / cropMeta.contentHeight)
    : 1;
  const croppedCanvasWidth = cropMeta ? cropMeta.canvasWidth * cropScale : targetW;
  const croppedCanvasHeight = cropMeta ? cropMeta.canvasHeight * cropScale : targetH;
  const cropLeft = cropMeta
    ? (targetW - cropMeta.contentWidth * cropScale) / 2 - cropMeta.contentX * cropScale
    : 0;
  const cropTop = cropMeta
    ? (targetH - cropMeta.contentHeight * cropScale) / 2 - cropMeta.contentY * cropScale
    : 0;

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
        contentFit={resizeMode as any}
        transition={0}
        cachePolicy="memory-disk"
        style={[
          styles.image,
          {
            width: croppedCanvasWidth,
            height: croppedCanvasHeight,
          },
          cropMeta ? {
            position: 'absolute',
            left: cropLeft,
            top: cropTop,
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
