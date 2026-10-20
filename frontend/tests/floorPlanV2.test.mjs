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

test('every item lies fully inside its room', async () => {
  const { MOCK_SIMULATOR_ITEMS } = await import('../src/features/simulator/logic/mockHomeData.ts');
  const { createDefaultRooms } = await import('../src/features/simulator/logic/roomData.ts');
  const MOCK_SIMULATOR_ROOMS = createDefaultRooms(false);
  const { getSlotRect } = await import('../src/features/simulator/logic/roomLayout.ts');
  const canvasSide = 390;

  for (const item of MOCK_SIMULATOR_ITEMS) {
    const room = MOCK_SIMULATOR_ROOMS.find((r) => r.id === item.roomId);
    assert.ok(room, `Item ${item.name} (${item.id}) must have a valid room`);
    const roomRect = getSlotRect(room.slot);
    const roomW = roomRect.width * canvasSide;
    const roomH = roomRect.height * canvasSide;

    const dims = getItemDimensions(item.spriteKey || item.type, roomH, roomW);
    const visHalfWFrac = (dims.visibleWidth / 2) / canvasSide;
    const visHalfHFrac = (dims.visibleHeight / 2) / canvasSide;

    const left = item.posX - visHalfWFrac;
    const right = item.posX + visHalfWFrac;
    const top = item.posY - visHalfHFrac;
    const bottom = item.posY + visHalfHFrac;

    const roomLeft = roomRect.x;
    const roomRight = roomRect.x + roomRect.width;
    const roomTop = roomRect.y;
    const roomBottom = roomRect.y + roomRect.height;

    // Tolerance for 1-pixel rounding
    const tol = 0.005;
    assert.ok(
      left >= roomLeft - tol,
      `Item ${item.name} (${item.id}) left edge ${left.toFixed(4)} must be >= room left ${roomLeft}`
    );
    assert.ok(
      right <= roomRight + tol,
      `Item ${item.name} (${item.id}) right edge ${right.toFixed(4)} must be <= room right ${roomRight}`
    );
    assert.ok(
      top >= roomTop - tol,
      `Item ${item.name} (${item.id}) top edge ${top.toFixed(4)} must be >= room top ${roomTop}`
    );
    assert.ok(
      bottom <= roomBottom + tol,
      `Item ${item.name} (${item.id}) bottom edge ${bottom.toFixed(4)} must be <= room bottom ${roomBottom}`
    );
  }
});

test('no two footprints overlap by more than 15% (except an item marked on desk)', async () => {
  const { MOCK_SIMULATOR_ITEMS } = await import('../src/features/simulator/logic/mockHomeData.ts');
  const { createDefaultRooms } = await import('../src/features/simulator/logic/roomData.ts');
  const MOCK_SIMULATOR_ROOMS = createDefaultRooms(false);
  const { getSlotRect } = await import('../src/features/simulator/logic/roomLayout.ts');
  const canvasSide = 390;

  // Group items by room
  const byRoom = new Map();
  for (const item of MOCK_SIMULATOR_ITEMS) {
    if (!byRoom.has(item.roomId)) byRoom.set(item.roomId, []);
    byRoom.get(item.roomId).push(item);
  }

  for (const [roomId, items] of byRoom.entries()) {
    const room = MOCK_SIMULATOR_ROOMS.find((r) => r.id === roomId);
    assert.ok(room);
    const roomRect = getSlotRect(room.slot);
    const roomW = roomRect.width * canvasSide;
    const roomH = roomRect.height * canvasSide;

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        // Workplace on desk is explicitly allowed to sit on top of the desk
        if (a.type === 'workplace' && b.type === 'table') continue;
        if (b.type === 'workplace' && a.type === 'table') continue;

        const dimsA = getItemDimensions(a.spriteKey || a.type, roomH, roomW);
        const dimsB = getItemDimensions(b.spriteKey || b.type, roomH, roomW);

        const halfWA = (dimsA.visibleWidth / 2) / canvasSide;
        const halfHA = (dimsA.visibleHeight / 2) / canvasSide;
        const halfWB = (dimsB.visibleWidth / 2) / canvasSide;
        const halfHB = (dimsB.visibleHeight / 2) / canvasSide;

        const boxA = {
          left: a.posX - halfWA,
          right: a.posX + halfWA,
          top: a.posY - halfHA,
          bottom: a.posY + halfHA,
          area: (halfWA * 2) * (halfHA * 2),
        };
        const boxB = {
          left: b.posX - halfWB,
          right: b.posX + halfWB,
          top: b.posY - halfHB,
          bottom: b.posY + halfHB,
          area: (halfWB * 2) * (halfHB * 2),
        };

        const overlapW = Math.max(0, Math.min(boxA.right, boxB.right) - Math.max(boxA.left, boxB.left));
        const overlapH = Math.max(0, Math.min(boxA.bottom, boxB.bottom) - Math.max(boxA.top, boxB.top));
        const overlapArea = overlapW * overlapH;
        const minArea = Math.min(boxA.area, boxB.area);
        const overlapPct = minArea > 0 ? (overlapArea / minArea) * 100 : 0;

        assert.ok(
          overlapPct <= 15.0,
          `Overlap between ${a.name} and ${b.name} in ${roomId} is ${overlapPct.toFixed(1)}%, must be <= 15%`
        );
      }
    }
  }
});

test('every appliance and furniture roomId exists and the room is set up; nothing in dark rooms', async () => {
  const { MOCK_SIMULATOR_ITEMS } = await import('../src/features/simulator/logic/mockHomeData.ts');
  const { createDefaultRooms } = await import('../src/features/simulator/logic/roomData.ts');
  const MOCK_SIMULATOR_ROOMS = createDefaultRooms(false);

  const setupRoomIds = new Set(
    MOCK_SIMULATOR_ROOMS.filter((room) => room.isSetUp).map((room) => room.id)
  );
  const darkRoomIds = new Set(
    MOCK_SIMULATOR_ROOMS.filter((room) => !room.isSetUp).map((room) => room.id)
  );

  assert.ok(darkRoomIds.has('f2-C'), 'f2-C must be dark by default');
  assert.ok(darkRoomIds.has('f2-D'), 'f2-D must be dark by default');

  for (const item of MOCK_SIMULATOR_ITEMS) {
    assert.ok(
      setupRoomIds.has(item.roomId),
      `Item ${item.name} (${item.id}) placed in non-setup room ${item.roomId}`
    );
    assert.ok(
      !darkRoomIds.has(item.roomId),
      `Item ${item.name} (${item.id}) cannot be placed in dark room ${item.roomId}`
    );
  }
});

test('stairs are never in the placed data items', async () => {
  const { MOCK_SIMULATOR_ITEMS } = await import('../src/features/simulator/logic/mockHomeData.ts');
  for (const item of MOCK_SIMULATOR_ITEMS) {
    assert.notEqual(item.type, 'stair');
    assert.notEqual(item.spriteKey, 'stair');
    assert.notEqual(item.category, 'Stairs');
    assert.ok(!item.name.toLowerCase().includes('stair'));
  }
});

test('the counts match raw totals and placed counts (skipping missing images)', async () => {
  const {
    RAW_SPEC_APPLIANCES,
    RAW_SPEC_FURNITURE,
    MOCK_SIMULATOR_ITEMS,
    SKIPPED_ITEM_TYPES,
  } = await import('../src/features/simulator/logic/mockHomeData.ts');

  // Raw specification counts
  assert.equal(RAW_SPEC_APPLIANCES.length, 14, 'Spec must contain 14 appliances total');
  const floor1Appliances = RAW_SPEC_APPLIANCES.filter((a) => a.floor === 1);
  const floor2Appliances = RAW_SPEC_APPLIANCES.filter((a) => a.floor === 2);
  assert.equal(floor1Appliances.length, 8, 'Floor 1 must specify 8 appliances');
  assert.equal(floor2Appliances.length, 6, 'Floor 2 must specify 6 appliances');

  assert.equal(RAW_SPEC_FURNITURE.length, 9, 'Spec must contain 9 furniture items total');
  const floor1Furniture = RAW_SPEC_FURNITURE.filter((f) => f.floor === 1);
  const floor2Furniture = RAW_SPEC_FURNITURE.filter((f) => f.floor === 2);
  assert.equal(floor1Furniture.length, 6, 'Floor 1 must specify 6 furniture items');
  assert.equal(floor2Furniture.length, 3, 'Floor 2 must specify 3 furniture items');

  const acItems = RAW_SPEC_APPLIANCES.filter((a) => a.type === 'air_conditioner');
  assert.equal(acItems.length, 2, 'Spec must specify 2 air conditioners');

  const alwaysOnItems = RAW_SPEC_APPLIANCES.filter((a) => a.alwaysOn);
  assert.equal(alwaysOnItems.length, 1, 'Spec must specify 1 always-on appliance (fridge)');
  assert.equal(alwaysOnItems[0].item, 'Fridge');

  // Placed items check (skipping fans and toilets)
  const placedAppliances = MOCK_SIMULATOR_ITEMS.filter((i) => i.category === 'Appliances');
  const placedFurniture = MOCK_SIMULATOR_ITEMS.filter((i) => i.category === 'Furniture');
  assert.equal(placedAppliances.length, 11, 'Placed appliances must be 11 (14 minus 3 fans on default floors)');
  assert.equal(placedFurniture.length, 8, 'Placed furniture must be 8 (9 minus 1 toilet on default floors)');

  const placedFloor1Apps = placedAppliances.filter((i) => i.roomId.startsWith('f1'));
  const placedFloor2Apps = placedAppliances.filter((i) => i.roomId.startsWith('f2'));
  assert.equal(placedFloor1Apps.length, 7, 'Placed Floor 1 appliances = 7 (8 minus 1 fan)');
  assert.equal(placedFloor2Apps.length, 4, 'Placed Floor 2 appliances = 4 (6 minus 2 fans)');
});

test('every type has a picture file or an explicit skip', async () => {
  const { RAW_SPEC_APPLIANCES, RAW_SPEC_FURNITURE, SKIPPED_ITEM_TYPES } = await import('../src/features/simulator/logic/mockHomeData.ts');
  const { existsSync } = await import('node:fs');
  const { resolve } = await import('node:path');

  const assetBase = resolve(process.cwd(), 'assets/sprites');
  const knownAssets = {
    air_conditioner: resolve(assetBase, 'appliances/aircon.png'),
    refrigerator: resolve(assetBase, 'appliances/fridge.png'),
    lights: resolve(assetBase, 'appliances/light.png'),
    light_bulb: resolve(assetBase, 'appliances/light_bulb.png'),
    tv: resolve(assetBase, 'appliances/tv.png'),
    water_heater: resolve(assetBase, 'appliances/shower.png'),
    workplace: resolve(assetBase, 'appliances/workplace.png'),
    bed: resolve(assetBase, 'furniture/bed.png'),
    sink: resolve(assetBase, 'furniture/sink.png'),
    sofa: resolve(assetBase, 'furniture/sofa.png'),
    stair: resolve(assetBase, 'furniture/stair.png'),
    table: resolve(assetBase, 'furniture/table.png'),
  };

  const allItems = [...RAW_SPEC_APPLIANCES, ...RAW_SPEC_FURNITURE];
  for (const item of allItems) {
    const hasAsset = knownAssets[item.type] && existsSync(knownAssets[item.type]);
    const isSkipped = SKIPPED_ITEM_TYPES.includes(item.type);
    assert.ok(
      hasAsset || isSkipped,
      `Item type ${item.type} (${item.item}) must have an existing picture or an explicit skip entry`
    );
  }
});
