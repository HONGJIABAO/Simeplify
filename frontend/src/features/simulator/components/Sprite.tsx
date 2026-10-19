import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
export const SPRITES: Record<string, ImageSourcePropType> = {
  air_conditioner: require('../../../../assets/sprites/appliances/aircon.png'),
  refrigerator: require('../../../../assets/sprites/appliances/fridge.png'),
  lights: require('../../../../assets/sprites/appliances/light.png'),
  light_bulb: require('../../../../assets/sprites/appliances/light_bulb.png'),
  tv: require('../../../../assets/sprites/appliances/tv.png'),
  water_heater: require('../../../../assets/sprites/appliances/shower.png'),
  bed: require('../../../../assets/sprites/furniture/bed.png'),
  sofa: require('../../../../assets/sprites/furniture/sofa.png'),
  table: require('../../../../assets/sprites/furniture/table.png'),
  sink: require('../../../../assets/sprites/furniture/sink.png'),
  boy: require('../../../../assets/sprites/avatar/avatar_boy.png'),
  girl: require('../../../../assets/sprites/avatar/avatar_girl.png'),
};
export function Sprite({ type, size = 44 }: { type: string; size?: number }) {
  const source = SPRITES[type];
  if (!source) return null;
  const scale = ['boy', 'girl'].includes(type) ? 1 : 1.65;
  return <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <Image source={source} resizeMode="contain" style={{ width: size * scale, height: size * scale }} />
  </View>;
}
