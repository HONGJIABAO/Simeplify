/** SIM-06 — platform-neutral contract for lit/off appliance rendering. */
export type GlowPlatform = 'web' | 'ios' | 'android' | 'other';

export interface LitAppearance {
  spriteOpacity: number;
  surface: { backgroundColor: 'transparent'; borderWidth: 0 };
  webFilter?: string;
  iosShadow?: { shadowColor: string; shadowOffset: { width: 0; height: 0 }; shadowRadius: number };
  androidCopy?: { scale: number; tintColor: string; opacity: number };
}

export function getLitAppearance(isOn: boolean, isFurniture: boolean, platform: GlowPlatform): LitAppearance {
  const lit = isOn && !isFurniture;
  const base: LitAppearance = {
    spriteOpacity: 1,
    surface: { backgroundColor: 'transparent', borderWidth: 0 },
  };
  if (!lit) return base;
  if (platform === 'web') {
    return {
      ...base,
      webFilter:
        'drop-shadow(0px 0px 4px rgba(255, 245, 200, 0.95)) drop-shadow(0px 0px 10px rgba(255, 230, 150, 0.85))',
    };
  }
  return {
    ...base,
    androidCopy: { scale: 1.06, tintColor: '#FFF3C4', opacity: 0.65 },
  };
}
