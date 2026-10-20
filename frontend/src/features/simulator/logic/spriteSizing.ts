/** SIM-05 floor-plan sprite sizing. Tray sizes are intentionally separate. */

export const SPRITE_SCALE = 1.8;

export const FLOOR_SPRITE_BASE_SIZE = {
  appliance: 48,
  furniture: 66,
  avatar: 66,
} as const;

export function getFloorSpriteSizes(planWidth: number) {
  const visualScale = Math.max(0.92, Math.min(1.25, planWidth / 350));
  return {
    appliance: FLOOR_SPRITE_BASE_SIZE.appliance * visualScale * SPRITE_SCALE,
    furniture: FLOOR_SPRITE_BASE_SIZE.furniture * visualScale * SPRITE_SCALE,
    avatar: Math.max(60, Math.min(72, FLOOR_SPRITE_BASE_SIZE.avatar * visualScale)),
    labelFont: Math.max(12, Math.min(14, 12 * visualScale)),
  };
}

