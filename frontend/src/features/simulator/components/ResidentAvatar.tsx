import React from 'react';
import { View, Text } from 'react-native';
import { AvatarPose } from '../logic/avatarPlace';
import { Sprite } from './Sprite';
export function ResidentAvatar({ pose = 'stand', size = 42, variant = 'girl' }: { pose?: AvatarPose; size?: number; variant?: 'boy' | 'girl' }) {
  return <View style={{ width: size, height: size, transform: [{ rotate: pose === 'lie' ? '90deg' : '0deg' }] }}>
    <Sprite type={variant} size={size} />
    {pose === 'lie' && <Text style={{ position: 'absolute', top: -8, right: 0, fontSize: 10, color: '#566549' }}>zZ</Text>}
  </View>;
}
