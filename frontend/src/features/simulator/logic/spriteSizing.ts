/**
 * SIM-05 / Unit 12 sprite sizing.
 * Sizing is calculated from visible content boundaries, compensating for transparent canvas margins.
 */

export interface SpriteBounds {
  canvasWidth: number;
  canvasHeight: number;
  contentWidth: number;
  contentHeight: number;
  targetRoomHeightFraction: number;
}

export const SPRITE_SCALE = 1.0;

/**
 * Exact sprite measurements from png alpha bounds.
 * Target fractions of room height:
 * - tall items (fridge, shower): ~34%
 * - medium items (bed, tv, sofa, table, workplace): ~26%
 * - small items (sink, lights, light_bulb): ~18% - 22%
 * - wall items (aircon): ~12%
 */
export const SPRITE_BASE_SIZE: Record<string, SpriteBounds> = {
  fridge: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 161,
    contentHeight: 279,
    targetRoomHeightFraction: 0.34,
  },
  refrigerator: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 161,
    contentHeight: 279,
    targetRoomHeightFraction: 0.34,
  },
  shower: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 202,
    contentHeight: 235,
    targetRoomHeightFraction: 0.34,
  },
  water_heater: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 202,
    contentHeight: 235,
    targetRoomHeightFraction: 0.12, // wall item (12%)
  },
  bed: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 227,
    contentHeight: 164,
    targetRoomHeightFraction: 0.26,
  },
  tv: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 182,
    contentHeight: 164,
    // 15% smaller so the TV can stay at x=.72 without entering the A-B doorway.
    targetRoomHeightFraction: 0.22,
  },
  sofa: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 284,
    contentHeight: 155,
    targetRoomHeightFraction: 0.26,
  },
  table: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 262,
    contentHeight: 161,
    // The transparent canvas makes tables wider than 55% of the small rooms at
    // the medium size. A uniform 25% reduction keeps every table in bounds.
    targetRoomHeightFraction: 0.195,
  },
  workplace: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 292,
    contentHeight: 244,
    targetRoomHeightFraction: 0.26,
  },
  sink: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 132,
    contentHeight: 199,
    targetRoomHeightFraction: 0.22,
  },
  light: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 150,
    contentHeight: 200,
    targetRoomHeightFraction: 0.18,
  },
  lights: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 150,
    contentHeight: 200,
    targetRoomHeightFraction: 0.18,
  },
  light_bulb: {
    canvasWidth: 388,
    canvasHeight: 388,
    contentWidth: 157,
    contentHeight: 336,
    targetRoomHeightFraction: 0.18,
  },
  aircon: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 320,
    contentHeight: 130,
    targetRoomHeightFraction: 0.12,
  },
  air_conditioner: {
    canvasWidth: 520,
    canvasHeight: 388,
    contentWidth: 320,
    contentHeight: 130,
    targetRoomHeightFraction: 0.12,
  },
};

const DEFAULT_SPRITE_BOUNDS: SpriteBounds = {
  canvasWidth: 520,
  canvasHeight: 388,
  contentWidth: 200,
  contentHeight: 200,
  targetRoomHeightFraction: 0.24,
};

export function getItemDimensions(
  spriteKey: string,
  roomPixelHeight: number,
  roomPixelWidth: number
): { width: number; height: number; visibleWidth: number; visibleHeight: number } {
  const meta = SPRITE_BASE_SIZE[spriteKey] ?? DEFAULT_SPRITE_BOUNDS;
  const targetVisH = Math.max(16, roomPixelHeight * meta.targetRoomHeightFraction * SPRITE_SCALE);
  // Canvas height needed to make visible content = targetVisH
  const imgH = targetVisH * (meta.canvasHeight / meta.contentHeight);
  // Keep canvas aspect ratio
  const imgW = imgH * (meta.canvasWidth / meta.canvasHeight);
  const visW = imgW * (meta.contentWidth / meta.canvasWidth);

  // Guard against exceeding room bounds (clamping max visible width/height to room dimensions)
  const maxVisW = Math.max(20, roomPixelWidth - 12);
  const maxVisH = Math.max(20, roomPixelHeight - 12);
  let finalImgW = imgW;
  let finalImgH = imgH;
  let finalVisW = visW;
  let finalVisH = targetVisH;

  if (finalVisW > maxVisW) {
    const scale = maxVisW / finalVisW;
    finalImgW *= scale;
    finalImgH *= scale;
    finalVisW *= scale;
    finalVisH *= scale;
  }
  if (finalVisH > maxVisH) {
    const scale = maxVisH / finalVisH;
    finalImgW *= scale;
    finalImgH *= scale;
    finalVisW *= scale;
    finalVisH *= scale;
  }

  return {
    width: Math.round(finalImgW),
    height: Math.round(finalImgH),
    visibleWidth: Math.round(finalVisW),
    visibleHeight: Math.round(finalVisH),
  };
}

/** Floor-plan item art is intentionally uniform. Tray art has its own sizing. */
export const FLOOR_ITEM_SCALE = 2.2;
export const FLOOR_SPRITE_BASE_SIZE = {
  item: 24,
  appliance: 24,
  furniture: 24,
  avatar: 66,
} as const;

export function getFloorSpriteSizes(planWidth: number) {
  const visualScale = Math.max(0.92, Math.min(1.25, planWidth / 350));
  return {
    item: FLOOR_SPRITE_BASE_SIZE.item * FLOOR_ITEM_SCALE * visualScale,
    appliance: FLOOR_SPRITE_BASE_SIZE.appliance * visualScale,
    furniture: FLOOR_SPRITE_BASE_SIZE.furniture * visualScale,
    avatar: Math.max(60, Math.min(72, FLOOR_SPRITE_BASE_SIZE.avatar * visualScale)),
    labelFont: Math.max(12, Math.min(14, 12 * visualScale)),
  };
}
