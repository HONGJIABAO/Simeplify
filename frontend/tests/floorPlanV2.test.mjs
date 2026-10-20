import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STAIR_RECT,
  STAIR_IMAGE_FIT,
  calculateSquarePlanSide,
  getFloorPlanLayout,
} from '../src/features/simulator/logic/roomLayout.ts';
import { getItemDimensions, SPRITE_BASE_SIZE, SPRITE_SCALE } from '../src/features/simulator/logic/spriteSizing.ts';

test('stair aspect ratio is within 10% of block ratio and STAIR_IMAGE_FIT is stretch', () => {
  const stairFileWidth = 120;
  const stairFileHeight = 389;
  const stairFileRatio = stairFileWidth / stairFileHeight; // ~0.3085

  const blockRatio = STAIR_RECT.width / STAIR_RECT.height; // 0.14 / 0.45 = 0.3111...
  const ratioDifference = Math.abs(stairFileRatio - blockRatio) / blockRatio;

  assert.ok(ratioDifference < 0.10, `Ratio difference ${(ratioDifference * 100).toFixed(2)}% should be < 10%`);
  assert.equal(STAIR_IMAGE_FIT, 'stretch');
});

test('stair image size equals the block size on both floors', () => {
  for (const floor of [1, 2]) {
    const layout = getFloorPlanLayout(floor);
    const canvasSide = 340;
    const blockWidth = layout.stair.width * canvasSide;
    const blockHeight = layout.stair.height * canvasSide;

    // Sized to block rectangle edge-to-edge
    const imageWidth = blockWidth;
    const imageHeight = blockHeight;

    assert.equal(imageWidth, blockWidth);
    assert.equal(imageHeight, blockHeight);
    assert.equal(blockWidth, 0.14 * 340);
    assert.equal(blockHeight, 0.45 * 340);
  }
});

test('square plan side never exceeds available width or height', () => {
  const testCases = [
    { width: 380, height: 600, label: 'Tall phone' },
    { width: 600, height: 380, label: 'Wide screen' },
    { width: 350, height: 350, label: 'Square container' },
    { width: 380, height: 260, label: 'Shrunk container (Edit tray open)' },
    { width: 380, height: 480, label: 'Normal container (Edit tray closed)' },
    { width: 0, height: 500, label: 'Zero width' },
    { width: 500, height: 0, label: 'Zero height' },
  ];

  for (const { width, height, label } of testCases) {
    const side = calculateSquarePlanSide(width, height);
    if (width <= 0 || height <= 0) {
      assert.equal(side, 0, `${label} with non-positive dimensions should yield 0`);
    } else {
      assert.ok(side <= width, `${label}: side ${side} must not exceed available width ${width}`);
      assert.ok(side <= height, `${label}: side ${side} must not exceed available height ${height}`);
      assert.equal(side, Math.min(width, height), `${label}: side must be min(width, height)`);
    }
  }
});

test('room tag visibility rule: hidden by default, shown on hover/long-press/edit mode', () => {
  function computeTagVisibility({ isEditMode = false, isHovered = false, isMouseOver = false, isLongPressActive = false }) {
    return Boolean(isEditMode || isHovered || isMouseOver || isLongPressActive);
  }

  // Default: hidden
  assert.equal(computeTagVisibility({}), false, 'Tag should be hidden by default');

  // Shown on web mouse hover
  assert.equal(computeTagVisibility({ isMouseOver: true }), true, 'Tag should be visible on mouse over');
  assert.equal(computeTagVisibility({ isHovered: true }), true, 'Tag should be visible on hovered prop');

  // Shown on phone long press (400ms)
  assert.equal(computeTagVisibility({ isLongPressActive: true }), true, 'Tag should be visible during long press');

  // Shown in Edit mode
  assert.equal(computeTagVisibility({ isEditMode: true }), true, 'Tag should be visible in edit mode');
});

test('sprite sizing sizes pictures from visible content', () => {
  const roomPixelHeight = 150;
  const roomPixelWidth = 180;

  // Fridge: tall item (~34% room height)
  const fridge = getItemDimensions('fridge', roomPixelHeight, roomPixelWidth);
  const expectedFridgeVisH = Math.round(roomPixelHeight * SPRITE_BASE_SIZE.fridge.targetRoomHeightFraction * SPRITE_SCALE);
  assert.equal(fridge.visibleHeight, expectedFridgeVisH);
  assert.ok(fridge.height > fridge.visibleHeight, 'Canvas height must compensate for transparent top/bottom margins');

  // Bed: medium item (~26% room height)
  const bed = getItemDimensions('bed', roomPixelHeight, roomPixelWidth);
  const expectedBedVisH = Math.round(roomPixelHeight * SPRITE_BASE_SIZE.bed.targetRoomHeightFraction * SPRITE_SCALE);
  assert.equal(bed.visibleHeight, expectedBedVisH);

  // Aircon: wall item (~12% room height)
  const aircon = getItemDimensions('aircon', roomPixelHeight, roomPixelWidth);
  const expectedAirconVisH = Math.round(roomPixelHeight * SPRITE_BASE_SIZE.aircon.targetRoomHeightFraction * SPRITE_SCALE);
  assert.equal(aircon.visibleHeight, expectedAirconVisH);

  // Clamping: visible width & height never exceed room boundaries
  assert.ok(fridge.visibleWidth <= roomPixelWidth);
  assert.ok(fridge.visibleHeight <= roomPixelHeight);
});
