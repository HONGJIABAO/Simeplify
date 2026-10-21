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
    spriteOpacity: isFurniture || lit ? 1 : 0.4,
    surface: { backgroundColor: 'transparent', borderWidth: 0 },
  };
  if (!lit) return base;
  if (platform === 'web') return { ...base, webFilter: 'drop-shadow(0px 0px 6px rgba(243, 201, 139, 0.55))' };
  if (platform === 'ios') return { ...base, iosShadow: {
    shadowColor: '#F3C98B', shadowOffset: { width: 0, height: 0 }, shadowRadius: 6,
  } };
  if (platform === 'android') return { ...base, androidCopy: { scale: 1.06, tintColor: '#F3C98B', opacity: 0.5 } };
  return base;
}
