/**
 * SIM-06
 * Resident Avatar component drawn with react-native-svg.
 * Source: docs/design.md Unit 12 §3a, docs/Feature_Requirements.md SIM-06.
 *
 * Rules:
 * - Natural Organic hand-drawn style.
 * - Outline: brown #5c4033, 2 px, round caps (never black).
 * - Fills: skin tan-300, hair brown, top sage-400, bottom tan-600.
 * - Soft ground shadow ellipse.
 * - Poses: stand, walk, sit, lie, cook, shower.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  G,
  Circle,
  Ellipse,
  Path,
} from 'react-native-svg';
import { AvatarPose } from '../logic/avatarPlace';

interface ResidentAvatarProps {
  pose?: AvatarPose;
  size?: number;
}

const OUTLINE = '#5c4033'; // brown
const SKIN = '#e6c39b';    // tan-300
const HAIR = '#5c4033';    // brown
const TOP = '#8b9d77';     // sage-400
const BOTTOM = '#a97a4a';  // tan-600
const SHADOW = 'rgba(214, 211, 209, 0.45)'; // stone-300 45%

export function ResidentAvatar({ pose = 'stand', size = 36 }: ResidentAvatarProps) {
  // Height ~36px, width ~28px
  const width = size * 0.8;
  const height = size;

  if (pose === 'lie') {
    // Horizontal sleeping pose
    return (
      <View style={[styles.container, { width: height, height: width }]}>
        <Svg width={height} height={width} viewBox="0 0 36 24">
          {/* Shadow */}
          <Ellipse cx="18" cy="18" rx="16" ry="4" fill={SHADOW} />
          {/* Body lying down */}
          <G transform="rotate(90 18 12)">
            {/* Torso */}
            <Path
              d="M 14 12 Q 18 10 22 12 L 22 20 Q 18 21 14 20 Z"
              fill={TOP}
              stroke={OUTLINE}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Legs */}
            <Path
              d="M 15 20 L 15 26 M 21 20 L 21 26"
              stroke={BOTTOM}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Head */}
            <Circle cx="18" cy="8" r="5" fill={SKIN} stroke={OUTLINE} strokeWidth="2" />
            <Path d="M 13 7 Q 18 3 23 7" fill={HAIR} stroke={OUTLINE} strokeWidth="1.5" />
          </G>
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 28 36">
        {/* Soft ground shadow */}
        <Ellipse cx="14" cy="33" rx="10" ry="2.5" fill={SHADOW} />

        {/* Legs / Bottom */}
        {pose === 'sit' ? (
          <Path
            d="M 10 23 L 6 27 L 6 31 M 18 23 L 22 27 L 22 31"
            stroke={BOTTOM}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        ) : pose === 'walk' ? (
          <Path
            d="M 11 23 L 8 32 M 17 23 L 20 32"
            stroke={BOTTOM}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <Path
            d="M 11 23 L 11 32 M 17 23 L 17 32"
            stroke={BOTTOM}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Torso / Top */}
        <Path
          d="M 9 13 Q 14 11 19 13 L 19 23 Q 14 24 9 23 Z"
          fill={TOP}
          stroke={OUTLINE}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Special pose accessories */}
        {pose === 'shower' && (
          <G>
            {/* Water drops */}
            <Path
              d="M 14 2 Q 14 4 14 5"
              stroke="#8b9d77"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Path
              d="M 10 3 Q 10 5 10 6 M 18 3 Q 18 5 18 6"
              stroke="#8b9d77"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </G>
        )}

        {pose === 'cook' && (
          <Path
            d="M 19 16 L 24 14"
            stroke={OUTLINE}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {/* Head */}
        <Circle cx="14" cy="8" r="5" fill={SKIN} stroke={OUTLINE} strokeWidth="2" />

        {/* Hair */}
        <Path
          d="M 9 7 Q 14 3 19 7 C 19 5 17 3 14 3 C 11 3 9 5 9 7 Z"
          fill={HAIR}
          stroke={OUTLINE}
          strokeWidth="1.5"
        />

        {/* Face dots & smile */}
        <Circle cx="12.5" cy="8" r="0.75" fill={OUTLINE} />
        <Circle cx="15.5" cy="8" r="0.75" fill={OUTLINE} />
        <Path
          d="M 13 10 Q 14 11.5 15 10"
          stroke={OUTLINE}
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
