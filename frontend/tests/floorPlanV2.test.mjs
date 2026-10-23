import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  STAIR_RECT,
  STAIR_CENTER,
  getFloorPlanLayout,
  getSlotRect,
} from '../src/features/simulator/logic/roomLayout.ts';
import {
  footprintOverlapArea,
  clampDraggedItemToRoom,
  getDoorKeepOuts,
  getItemLocalFootprint,
  getVisibleContentFootprint,
  placeHangBack,
  placeLeanBack,
  placeLeanLeft,
  placeLeanRight,
  getPlacementLayer,
  getRoomTemplateId,
  getSlotPlanPoint,
  INNER_FLOOR_RECT,
  WALL_ITEM_TOP,
  isFootprintInside,
  ROOM_SLOTS,
  sortItemsForRoom,
  tidyFloorItems,
  useSpot,
} from '../src/features/simulator/logic/furnishedLayout.ts';
import { FLOOR_ITEM_SCALE, FLOOR_SPRITE_BASE_SIZE, FLOOR_VISIBLE_CONTENT_BOUNDS, getFloorSpriteSizes, getFloorVisibleContentSize } from '../src/features/simulator/logic/spriteSizing.ts';
import { getPlanItemLabel, PLAN_ITEM_LABEL_DURATION_MS } from '../src/features/simulator/logic/itemLabel.ts';
import { WORKPLACE_DEFAULT_WATTS } from '../src/features/simulator/logic/applianceConstants.ts';
import {
  MOCK_SIMULATOR_ITEMS,
  MOCK_SIMULATOR_ITEMS_ALL,
  furnishEmptyRooms,
} from '../src/features/simulator/logic/mockHomeData.ts';
import { createDefaultRooms } from '../src/features/simulator/logic/roomData.ts';
import { BLOCK_PRIMARY_ITEM, resolveAvatarPlacement } from '../src/features/simulator/logic/avatarPlace.ts';
import { DEFAULT_ROUTINE_BLOCKS, WORK_ROUTINE_SUGGESTIONS } from '../src/features/simulator/logic/myDayLogic.ts';
import { shouldFollowAvatarFloor } from '../src/features/simulator/logic/floorFollow.ts';
import { findFloorWalkPath, findHomeWalkRoute, isWalkSegmentValid } from '../src/features/simulator/logic/walkGraph.ts';
import {
  AVATAR_SPEED,
  AVATAR_USE_HOLD_MS,
  STAIR_CROSS_FADE_MS,
  STAIR_FADE_OUT_MS,
  hasHeldUsePose,
  pathLength,
  reelSegmentDurationMs,
  walkTimeMs,
} from '../src/features/simulator/logic/avatarTiming.ts';
import {
  BILL_COUNT_DURATION_MS,
  billCountValue,
  easeOutBillProgress,
} from '../src/features/simulator/logic/billCount.ts';
import {
  SWAP_CATALOG,
  applySwapToItem,
  buildEnergyReport,
  buildSwapSuggestionCards,
  monthlyKwh,
} from '../src/features/simulator/logic/energyReport.ts';
import { calcBillFromKwh } from '../src/features/simulator/logic/billCalc.ts';
import {
  PERIOD_BILL_UNITS,
  PERIOD_MONTHS,
  getPeriodBillTotal,
} from '../src/features/simulator/logic/fastForward.ts';
import {
  allocateAppliancePercentages,
  BILL_PERIOD_FACTORS,
  getBillPeriodTotal,
  normalizeKwhToTotal,
} from '../src/features/simulator/logic/billBreakdown.ts';
import {
  SIMULATOR_BILL_CARD_BASELINE_RM,
  getSimulatorBillCardMonthlyTotal,
} from '../src/features/simulator/logic/billDisplay.ts';
import {
  appendClientApplianceTrayTypeIds,
  getEditLayoutMetrics,
  getInTrayTypeIds,
  getTrayTileWidth,
} from '../src/features/simulator/logic/trayRules.ts';
import { getLitAppearance } from '../src/features/simulator/logic/litAppearance.ts';
import {
  buildWeekReel,
  chooseFeaturedBlock,
  FEATURED_BLOCK_BY_DAY,
  getReducedMotionSummary,
  getReelSavings,
  reducePlayFlow,
} from '../src/features/simulator/logic/weekReel.ts';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = resolve(TEST_DIR, '..');
const PLAN_SIDE = 390;

function roomItems(items, roomId) {
  return items.filter((item) => item.roomId === roomId);
}

function containsPoint(rect, point) {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function getRoomCenter(room) {
  const rect = getSlotRect(room.slot);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

test('stair geometry remains identical on both floors', () => {
  assert.deepEqual(getFloorPlanLayout(1).stair, STAIR_RECT);
  assert.deepEqual(getFloorPlanLayout(2).stair, STAIR_RECT);
});

test('set-up rooms with no persisted rows receive the complete standard furniture fixture', () => {
  const rooms = createDefaultRooms(true).map((room) => ({ ...room, id: `db-${room.floor}-${room.slot}` }));
  const furnished = furnishEmptyRooms([], rooms);
  assert.equal(furnished.length, MOCK_SIMULATOR_ITEMS_ALL.length);
  for (const room of rooms) {
    assert.ok(furnished.some((item) => item.roomId === room.id), `${room.floor}F ${room.slot} stayed empty`);
  }
  assert.ok(furnished.every((item) => item.id.startsWith('mock_default_')));
});

test('real room rows are preserved and are not duplicated by default furnishing', () => {
  const rooms = createDefaultRooms(true);
  const persisted = [{ ...MOCK_SIMULATOR_ITEMS_ALL[0], id: 'real-row', roomId: rooms[0].id }];
  const furnished = furnishEmptyRooms(persisted, rooms);
  assert.equal(furnished.filter((item) => item.roomId === rooms[0].id).length, 1);
  assert.equal(furnished.find((item) => item.roomId === rooms[0].id)?.id, 'real-row');
});

test('floor-plan base art uses 2.2x scale while the avatar stays separate', () => {
  const sizes = getFloorSpriteSizes(350);
  assert.equal(FLOOR_ITEM_SCALE, 2.2);
  assert.equal(sizes.item, FLOOR_SPRITE_BASE_SIZE.item * 2.2);
  assert.notEqual(sizes.item, sizes.avatar);
});

test('floor plan renders bulbs and lamps at half the standard item size', () => {
  const floorPlan = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/FloorPlan.tsx'), 'utf8');
  assert.match(floorPlan, /isSmallLight[\s\S]*uniformItemSize = spriteSizes\.item \* \(isSmallLight \? 0\.5 : 1\)/);
});

test('free drag clamps the item centre so the enlarged square stays inside its room', () => {
  const room = createDefaultRooms(false).find((candidate) => candidate.floor === 1 && candidate.slot === 'A');
  const itemSize = getFloorSpriteSizes(350).item;
  const point = clampDraggedItemToRoom({ x: -1, y: 4 }, room, 350, 350, itemSize);
  const rect = getSlotRect(room.slot);
  const half = itemSize / 350 / 2;
  assert.ok(point.x >= rect.x + half);
  assert.ok(point.y <= rect.y + rect.height - half);
});

test('tap labels show name and watts for three seconds, with no placeholder watts', () => {
  const appliance = {
    id: 'a', category: 'Appliances', type: 'air_conditioner', spriteKey: 'air_conditioner',
    name: 'Air Conditioner', brand: 'Panasonic', wattage: 1200, roomId: 'f1-A', posX: 0.2, posY: 0.2,
  };
  const furniture = {
    id: 'f', category: 'Furniture', type: 'sofa', spriteKey: 'sofa',
    name: 'Sofa', roomId: 'f1-A', posX: 0.2, posY: 0.2,
  };
  const workplace = {
    id: 'w', category: 'Appliances', type: 'workplace', spriteKey: 'workplace',
    name: 'Workplace', wattage: WORKPLACE_DEFAULT_WATTS, roomId: 'f2-B', posX: 0.2, posY: 0.2,
  };
  assert.equal(PLAN_ITEM_LABEL_DURATION_MS, 3000);
  assert.equal(getPlanItemLabel(appliance), 'Panasonic · 1200 W');
  assert.equal(getPlanItemLabel(furniture), 'Sofa');
  assert.equal(getPlanItemLabel(workplace), 'Workplace');
});

test('every sprite manifest require points to an existing file', () => {
  const manifestPath = resolve(FRONTEND_ROOT, 'src/features/simulator/logic/spriteMap.ts');
  const manifest = readFileSync(manifestPath, 'utf8');
  const requirePaths = [...manifest.matchAll(/require\('([^']+\.png)'\)/g)].map((match) => match[1]);
  assert.ok(requirePaths.length > 0);
  for (const requirePath of requirePaths) {
    assert.ok(existsSync(resolve(dirname(manifestPath), requirePath)), `missing sprite: ${requirePath}`);
  }
  assert.match(manifest, /key: 'fan'[\s\S]*stand_fan\.png/);
  assert.match(manifest, /key: 'ceiling_fan'[\s\S]*fan\.png[\s\S]*inTray: false/);
  assert.match(manifest, /key: 'water_heater'[\s\S]*shower\.png/);
  assert.match(manifest, /key: 'toilet'[\s\S]*toilet_bin\.png/);
  assert.match(manifest, /key: 'washing_machine'[\s\S]*washing_machine\.png/);
  assert.match(manifest, /key: 'router'[\s\S]*wifi_router\.png/);

  const spriteComponent = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/Sprite.tsx'), 'utf8');
  assert.doesNotMatch(spriteComponent, /ImageOff|crossed-image/i);
});

test('ROOM_SLOTS contains the requested fixed centres, widths, and facing', () => {
  assert.deepEqual(Object.keys(ROOM_SLOTS), ['f1-A', 'f1-B', 'f1-C', 'f1-D', 'f2-A', 'f2-B', 'f2-C', 'f2-D']);
  assert.deepEqual(ROOM_SLOTS['f1-A'].slots.find((slot) => slot.type === 'tv'),
    { type: 'tv', spriteKey: 'tv', x: 0.43, y: 0.21, bottom: 0.30, h: 0.18, w: 0.15, facing: 'down' });
  assert.equal(ROOM_SLOTS['f1-A'].slots.filter((slot) => slot.type === 'table').length, 1);
  assert.deepEqual(ROOM_SLOTS['f1-A'].slots.find((slot) => slot.type === 'table'),
    { type: 'table', spriteKey: 'table', x: 0.48, y: 0.54, bottom: 0.62, h: 0.16, w: 0.12, role: 'coffee table' });
  const kitchenTable = ROOM_SLOTS['f1-B'].slots.find((slot) => slot.role === 'kitchen table');
  const kitchenBulb = ROOM_SLOTS['f1-B'].slots.find((slot) => slot.type === 'light_bulb');
  assert.deepEqual(kitchenTable,
    { type: 'table', spriteKey: 'table', x: 0.50, y: 0.52, bottom: 0.60, h: 0.16, w: 0.12, role: 'kitchen table' });
  assert.equal(kitchenBulb.x, kitchenTable.x, 'kitchen bulb has same x as table');
  assert.ok(kitchenBulb.y < kitchenTable.y, 'kitchen bulb is above the table');
  assert.ok(kitchenBulb.bottom < kitchenTable.y, 'kitchen bulb bottom stays above table top');
  const roomB = createDefaultRooms(false).find((r) => r.id === 'f1-B');
  const itemsB = roomItems(MOCK_SIMULATOR_ITEMS, 'f1-B');
  const bulbItem = itemsB.find((i) => i.type === 'light_bulb');
  const tableItem = itemsB.find((i) => i.type === 'table');
  const bulbFp = getItemLocalFootprint(bulbItem, roomB, PLAN_SIDE, PLAN_SIDE, itemsB);
  const tableFp = getItemLocalFootprint(tableItem, roomB, PLAN_SIDE, PLAN_SIDE, itemsB);
  const bulbTableGap = tableFp.y - (bulbFp.y + bulbFp.height);
  assert.ok(bulbTableGap >= 0.02 && bulbTableGap <= 0.05, `gap between 0.02 and 0.05 of room height, got ${bulbTableGap.toFixed(4)}`);
  assert.equal(footprintOverlapArea(bulbFp, tableFp), 0, 'kitchen bulb and table must not overlap');
  assert.equal(ROOM_SLOTS['f1-B'].slots.find((slot) => slot.type === 'refrigerator').x, 0.22);
  assert.equal(ROOM_SLOTS['f1-B'].slots.find((slot) => slot.type === 'refrigerator').placement, 'lean_back');
  assert.equal(ROOM_SLOTS['f1-C'].slots.find((slot) => slot.type === 'washing_machine').x, 0.18);
  assert.equal(ROOM_SLOTS['f1-C'].slots.find((slot) => slot.type === 'washing_machine').placement, 'lean_back');
  assert.equal(ROOM_SLOTS['f1-D'].slots.find((slot) => slot.type === 'water_heater').x, 0.20);
  assert.equal(ROOM_SLOTS['f1-D'].slots.find((slot) => slot.type === 'water_heater').placement, 'hang_back');
  assert.equal(ROOM_SLOTS['f2-D'].slots.find((slot) => slot.type === 'water_heater').x, 0.20);
  assert.equal(ROOM_SLOTS['f2-A'].slots.find((slot) => slot.type === 'bed').x, 0.24);
  assert.equal(ROOM_SLOTS['f2-B'].slots.find((slot) => slot.type === 'bed').x, 0.24);
  assert.equal(ROOM_SLOTS['f2-C'].slots.find((slot) => slot.type === 'workplace').x, 0.25);
  assert.equal(ROOM_SLOTS['f2-B'].slots.some((slot) => slot.type === 'workplace'), false);
});

test('Living Room slots are frozen at the product-owner-approved snapshot', () => {
  const snapshot = ROOM_SLOTS['f1-A'].slots.map(({ type, role, x, y, bottom, h, w, rotation, itemFacing }) => ({
    type, role: role ?? null, x, y, bottom: bottom ?? null, h: h ?? null, w,
    rotation: rotation ?? 0, facing: itemFacing ?? 'front',
  }));
  assert.deepEqual(snapshot, [
    { type: 'air_conditioner', role: null, x: 0.16, y: 0.11, bottom: 0.17, h: 0.12, w: 0.18, rotation: 0, facing: 'front' },
    { type: 'tv', role: null, x: 0.43, y: 0.21, bottom: 0.30, h: 0.18, w: 0.15, rotation: 0, facing: 'front' },
    { type: 'router', role: null, x: 0.86, y: 0.12, bottom: 0.17, h: 0.10, w: 0.10, rotation: 0, facing: 'front' },
    { type: 'table', role: 'coffee table', x: 0.48, y: 0.54, bottom: 0.62, h: 0.16, w: 0.12, rotation: 0, facing: 'front' },
    { type: 'sofa', role: null, x: 0.48, y: 0.79, bottom: 0.88, h: 0.18, w: 0.24, rotation: 0, facing: 'back' },
    { type: 'light_bulb', role: null, x: 0.66, y: 0.44, bottom: 0.50, h: 0.12, w: 0.07, rotation: 0, facing: 'front' },
    { type: 'fan', role: null, x: 0.14, y: 0.83, bottom: 0.94, h: 0.22, w: 0.08, rotation: 0, facing: 'front' },
  ]);
});

test('room tags are the final non-interactive floor overlay above items, glow, route, and avatar', () => {
  const source = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/FloorPlan.tsx'), 'utf8');
  const itemIndex = source.indexOf('{floorItems.map((item) =>');
  const routeIndex = source.indexOf('{avatarState.currentFloor === floor && walkPath.length > 1');
  const avatarIndex = source.indexOf('<Avatar');
  const tagIndex = source.indexOf('{floorRooms.map((room) => {', avatarIndex);
  assert.ok(itemIndex >= 0 && routeIndex > itemIndex && avatarIndex > routeIndex && tagIndex > avatarIndex);
  assert.match(source.slice(tagIndex), /pointerEvents="none"/);
  assert.match(source, /roomTag:[\s\S]*zIndex:\s*3000[\s\S]*elevation:\s*20/);
});

test('every non-living fixture item is exactly on its ROOM_SLOTS position with no tag offset', () => {
  const rooms = createDefaultRooms(false);
  for (const room of rooms.filter((candidate) => candidate.id !== 'f1-A' && candidate.isSetUp)) {
    const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
    for (const item of items) {
      const slot = ROOM_SLOTS[getRoomTemplateId(room, items)].slots.find((candidate) =>
        candidate.type === item.type && (!item.role || candidate.role === item.role));
      assert.ok(slot, `${room.id}/${item.type} has a wall-slot definition`);
      const expected = getSlotPlanPoint(room, slot, items, PLAN_SIDE, PLAN_SIDE);
      assert.ok(Math.abs(item.posX - expected.x) < 0.0001, `${room.id}/${item.type} x was offset`);
      assert.ok(Math.abs(item.posY - expected.y) < 0.0001, `${room.id}/${item.type} y was offset`);
    }
  }
});

test('requested living order and back-facing sofa fallback preserve the footprint', () => {
  const living = ROOM_SLOTS['f1-A'].slots;
  const tv = living.find((slot) => slot.type === 'tv');
  const table = living.find((slot) => slot.type === 'table');
  const sofa = living.find((slot) => slot.type === 'sofa');
  const bulb = living.find((slot) => slot.type === 'light_bulb');
  assert.ok(tv.bottom < table.bottom && table.bottom < sofa.bottom);
  assert.ok(bulb.x > table.x && bulb.bottom < table.bottom);
  assert.equal(sofa.itemFacing, 'back');
  assert.equal(sofa.facing, 'up');
  const room = createDefaultRooms(false).find((candidate) => candidate.id === 'f1-A');
  const sofaItem = MOCK_SIMULATOR_ITEMS.find((item) => item.id === 'f1-sofa-living');
  const frontFootprint = getItemLocalFootprint({ ...sofaItem, facing: 'front' }, room, 390, 390, MOCK_SIMULATOR_ITEMS.filter((item) => item.roomId === room.id));
  const backFootprint = getItemLocalFootprint({ ...sofaItem, facing: 'back' }, room, 390, 390, MOCK_SIMULATOR_ITEMS.filter((item) => item.roomId === room.id));
  assert.deepEqual(backFootprint, frontFootprint);
  const spriteMap = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/logic/spriteMap.ts'), 'utf8');
  const spriteComponent = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/Sprite.tsx'), 'utf8');
  assert.match(spriteMap, /FACING_BACK_FALLBACK\s*=\s*'rotate'/);
  assert.match(spriteMap, /shouldRotateFacingBack/);
  assert.match(spriteMap, /backSource\s*\?\?\s*\(FACING_BACK_FALLBACK\s*===\s*'rotate'\s*\?\s*item\?\.source/);
  assert.match(spriteComponent, /rotateBackFallback\s*\?\s*\{\s*transform:\s*\[\{\s*rotate:\s*'180deg'/);
});

test('fridge, sink, washer, and heaters use the requested wall anchors', () => {
  assert.equal(ROOM_SLOTS['f1-B'].slots.find((slot) => slot.type === 'refrigerator').placement, 'lean_back');
  assert.equal(ROOM_SLOTS['f1-B'].slots.find((slot) => slot.type === 'sink').placement, 'lean_right');
  assert.equal(ROOM_SLOTS['f1-B'].slots.find((slot) => slot.type === 'sink').top, 0.30);
  assert.equal(ROOM_SLOTS['f1-C'].slots.find((slot) => slot.type === 'washing_machine').placement, 'lean_back');
  for (const roomId of ['f1-D', 'f2-D']) {
    const slot = ROOM_SLOTS[roomId].slots.find((candidate) => candidate.type === 'water_heater');
    assert.deepEqual({ x: slot.x, placement: slot.placement }, { x: 0.20, placement: 'hang_back' });
  }
});

test('wall placement helpers use visible content edges, not bottom anchors', () => {
  const roomA = getSlotRect('A');
  const roomB = getSlotRect('B');
  const roomD = getSlotRect('D');
  const bed = getFloorVisibleContentSize('bed', PLAN_SIDE);
  const fridge = getFloorVisibleContentSize('refrigerator', PLAN_SIDE);
  const washer = getFloorVisibleContentSize('washing_machine', PLAN_SIDE);
  const shower = getFloorVisibleContentSize('water_heater', PLAN_SIDE);
  const sink = getFloorVisibleContentSize('sink', PLAN_SIDE);
  const leanBed = placeLeanBack(roomA, 0.24, bed, PLAN_SIDE, PLAN_SIDE);
  assert.ok(Math.abs((leanBed.y * PLAN_SIDE - bed.visibleHeight / 2) - (WALL_ITEM_TOP * roomA.height * PLAN_SIDE)) < 0.01);
  const leanFridge = placeLeanBack(roomB, 0.22, fridge, PLAN_SIDE, PLAN_SIDE);
  assert.ok(Math.abs((leanFridge.y * PLAN_SIDE - fridge.visibleHeight / 2) - (WALL_ITEM_TOP * roomB.height * PLAN_SIDE)) < 0.01);
  const leanWasher = placeLeanBack(getSlotRect('C'), 0.18, washer, PLAN_SIDE, PLAN_SIDE);
  assert.ok(leanWasher.x * PLAN_SIDE - washer.visibleWidth / 2 >= 0.06 * getSlotRect('C').width * PLAN_SIDE - 0.01);
  const showerPlacement = placeHangBack(roomD, 0.20, shower, PLAN_SIDE, PLAN_SIDE);
  assert.ok(showerPlacement.y * PLAN_SIDE + showerPlacement.visibleHeight / 2 <= (0.20 + 0.72) * roomD.height * PLAN_SIDE + roomD.y * PLAN_SIDE);
  const rightSink = placeLeanRight(roomB, 0.30, sink, PLAN_SIDE, PLAN_SIDE);
  const rightWall = (roomB.x + 0.94 * roomB.width) * PLAN_SIDE;
  assert.ok(Math.abs(rightSink.x * PLAN_SIDE + sink.visibleWidth / 2 - (rightWall - 0.01 * roomB.width * PLAN_SIDE)) < 0.01);
  const left = placeLeanLeft(roomB, 0.30, sink, PLAN_SIDE, PLAN_SIDE);
  assert.ok(left.x * PLAN_SIDE - sink.visibleWidth / 2 > roomB.x * PLAN_SIDE);
});

test('bedside lamps have a measured visible gap and draw after beds', () => {
  const plan = 390;
  const scale = Math.max(0.92, Math.min(1.25, plan / 350));
  const itemSize = 24 * 2.2 * scale;
  const visible = (item, meta) => {
    const target = item.type === 'lights' ? itemSize * 0.5 : itemSize;
    const cropScale = Math.min(target / meta.contentWidth, target / meta.contentHeight);
    const width = meta.contentWidth * cropScale;
    const height = meta.contentHeight * cropScale;
    return { left: item.posX * plan - width / 2, right: item.posX * plan + width / 2,
      top: item.posY * plan - height / 2, bottom: item.posY * plan + height / 2 };
  };
  const meta = {
    bed: { contentWidth: 227, contentHeight: 164 },
    lights: { contentWidth: 150, contentHeight: 201 },
  };
  const rooms = createDefaultRooms(false);
  for (const roomId of ['f2-A', 'f2-B']) {
    const room = rooms.find((candidate) => candidate.id === roomId);
    const items = MOCK_SIMULATOR_ITEMS.filter((item) => item.roomId === roomId);
    const bed = items.find((item) => item.type === 'bed');
    const lamp = items.find((item) => item.type === 'lights');
    const bedBox = visible(bed, meta.bed);
    const lampBox = visible(lamp, meta.lights);
    const gap = lampBox.left - bedBox.right;
    const roomWidth = getSlotRect(room.slot).width * plan;
    assert.ok(gap >= roomWidth * 0.02, `${roomId} lamp gap must be at least 2% of room width`);
    assert.ok(Math.abs(bedBox.bottom - lampBox.bottom) <= 1, `${roomId} lamp and bed bottoms must align`);
    assert.equal(Math.max(0, Math.min(bedBox.right, lampBox.right) - Math.max(bedBox.left, lampBox.left)), 0);
    assert.deepEqual(sortItemsForRoom([lamp, bed], room).slice(0, 2).map((item) => item.type), ['bed', 'lights']);
  }
  const sameBottom = sortItemsForRoom([
    { id: 'lamp', category: 'Appliances', type: 'lights', spriteKey: 'lights', name: 'lamp', posX: 0.4, posY: 0.5 },
    { id: 'bed', category: 'Furniture', type: 'bed', spriteKey: 'bed', name: 'bed', posX: 0.2, posY: 0.5 },
  ]);
  assert.deepEqual(sameBottom.map((item) => item.id), ['bed', 'lamp']);
});

test('every moved item has its top edge at WALL_ITEM_TOP within 0.005', () => {
  const rooms = createDefaultRooms(false);
  const moved = [
    ['f1-B', 'refrigerator'],
    ['f1-C', 'washing_machine'],
    ['f1-D', 'water_heater'],
    ['f2-A', 'bed'],
    ['f2-B', 'bed'],
    ['f2-D', 'water_heater'],
  ];
  for (const [roomId, type] of moved) {
    const room = rooms.find((candidate) => candidate.id === roomId);
    const items = roomItems(MOCK_SIMULATOR_ITEMS, roomId);
    const item = items.find((candidate) => candidate.type === type);
    const box = getVisibleContentFootprint(item, room, PLAN_SIDE, PLAN_SIDE, items);
    assert.ok(
      Math.abs(box.y - WALL_ITEM_TOP) <= 0.005,
      `${roomId}/${type} top edge ${box.y.toFixed(4)} must be at WALL_ITEM_TOP (${WALL_ITEM_TOP}) within 0.005`
    );
  }
  const roomB = rooms.find((candidate) => candidate.id === 'f1-B');
  const bItems = roomItems(MOCK_SIMULATOR_ITEMS, 'f1-B');
  const sink = bItems.find((candidate) => candidate.type === 'sink');
  const sinkBox = getVisibleContentFootprint(sink, roomB, PLAN_SIDE, PLAN_SIDE, bItems);
  const gap = INNER_FLOOR_RECT.x + INNER_FLOOR_RECT.width - (sinkBox.x + sinkBox.width);
  assert.ok(gap >= -0.005 && gap <= 0.02, `f1-B/sink wall gap must be within 0..2%`);
});

test('set-up rooms have no grey setup placeholder while dark rooms keep one plus', () => {
  const source = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/Room.tsx'), 'utf8');
  assert.doesNotMatch(source, /<Circle\b/);
  assert.match(source, /!room\.isSetUp\s*&&\s*\(/);
  assert.match(source, /<Plus\s+size=\{22\}/);
});

test('all default items avoid walls, doorways, lanes, stairs, and non-ceiling overlaps', () => {
  const rooms = createDefaultRooms(false);
  for (const room of rooms.filter((candidate) => candidate.isSetUp)) {
    const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
    const entries = items.filter((item) => getPlacementLayer(item) !== 'ceiling').map((item) => ({
      item,
      footprint: getItemLocalFootprint(item, room, PLAN_SIDE, PLAN_SIDE, items),
    }));
    const roomRect = getSlotRect(room.slot);
    const doors = getDoorKeepOuts(room.slot, roomRect.width * PLAN_SIDE, roomRect.height * PLAN_SIDE);
    const lanes = ROOM_SLOTS[getRoomTemplateId(room, items)].clearZones;
    for (const item of items) {
      const footprint = getItemLocalFootprint(item, room, PLAN_SIDE, PLAN_SIDE, items);
      assert.ok(item.posX >= roomRect.x && item.posX <= roomRect.x + roomRect.width, `${item.id} x must be in its room`);
      assert.ok(item.posY >= roomRect.y && item.posY <= roomRect.y + roomRect.height, `${item.id} y must be in its room`);
      if (getPlacementLayer(item) !== 'ceiling') {
        assert.equal(doors.some((door) => footprintOverlapArea(footprint, door) > 0.01), false, `${item.id} blocks a doorway`);
      }
    }
    for (const entry of entries) {
      const slot = ROOM_SLOTS[getRoomTemplateId(room, items)].slots.find((candidate) => candidate.type === entry.item.type);
      if (!slot?.placement) {
        assert.equal(lanes.some((lane) => footprintOverlapArea(entry.footprint, lane) > 0), false, `${entry.item.id} blocks a standing lane`);
      }
    }
    for (let index = 0; index < entries.length; index += 1) {
      for (let other = index + 1; other < entries.length; other += 1) {
        assert.equal(
          footprintOverlapArea(entries[index].footprint, entries[other].footprint),
          0,
          `${entries[index].item.id} overlaps ${entries[other].item.id}`
        );
      }
    }
  }
});

test('the sofa faces the TV and its standing lane stays clear', () => {
  const living = ROOM_SLOTS['f1-A'];
  const sofa = living.slots.find((slot) => slot.type === 'sofa');
  const tv = living.slots.find((slot) => slot.type === 'tv');
  assert.equal(sofa.facing, 'up');
  assert.equal(sofa.itemFacing, 'back');
  assert.ok(sofa.y > tv.y);

  const room = createDefaultRooms(false).find((candidate) => candidate.id === 'f1-A');
  const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
  const sofaItem = items.find((item) => item.type === 'sofa');
  const tvItem = items.find((item) => item.type === 'tv');
  const standingSpot = useSpot(sofaItem, room, items, PLAN_SIDE, PLAN_SIDE);
  assert.ok(standingSpot.y > tvItem.posY && standingSpot.y < sofaItem.posY, 'sofa standing spot must be between the TV and sofa');
  const configuredLane = living.clearZones[0];
  const lane = { x: configuredLane.x, y: configuredLane.y, width: configuredLane.width, height: configuredLane.height };
  for (const item of items.filter((candidate) => getPlacementLayer(candidate) !== 'ceiling'
    && candidate.type !== 'tv' && candidate.type !== 'sofa')) {
    assert.equal(footprintOverlapArea(getItemLocalFootprint(item, room, PLAN_SIDE, PLAN_SIDE, items), lane), 0, `${item.id} blocks the TV lane`);
  }
});

test('useSpot stays inside the inner floor and outside doorway keep-outs', () => {
  const rooms = createDefaultRooms(false);
  const cases = [
    ['f1-A', 'sofa'],
    ['f1-D', 'water_heater'],
    ['f1-B', 'refrigerator'],
    ['f1-C', 'washing_machine'],
    ['f2-C', 'workplace'],
    ['f2-A', 'bed'],
    ['f2-B', 'bed'],
    ['f2-D', 'water_heater'],
  ];
  for (const [roomId, type] of cases) {
    const room = rooms.find((candidate) => candidate.id === roomId);
    const items = roomItems(MOCK_SIMULATOR_ITEMS, roomId);
    const item = items.find((candidate) => candidate.type === type);
    const spot = useSpot(item, room, items, PLAN_SIDE, PLAN_SIDE);
    const rect = getSlotRect(room.slot);
    const local = { x: (spot.x - rect.x) / rect.width, y: (spot.y - rect.y) / rect.height };
    assert.ok(containsPoint(INNER_FLOOR_RECT, local), `${type} use spot must stay inside the inner floor`);
    const keepOuts = getDoorKeepOuts(room.slot, rect.width * PLAN_SIDE, rect.height * PLAN_SIDE);
    assert.equal(keepOuts.some((keepOut) => containsPoint(keepOut, local)), false, `${type} use spot must avoid doors`);
    const occupied = items.filter((candidate) => candidate.id !== item.id && getPlacementLayer(candidate) !== 'ceiling')
      .map((candidate) => getItemLocalFootprint(candidate, room, PLAN_SIDE, PLAN_SIDE, items));
    assert.equal(occupied.some((box) => containsPoint(box, local)), false, `${type} use spot must avoid other items`);
  }
});

test('mock, seed, refurnish script and ROOM_SLOTS positions agree', () => {
  const seedSql = readFileSync(resolve(FRONTEND_ROOT, '../supabase/seed.sql'), 'utf8');
  const refurnishScript = readFileSync(resolve(FRONTEND_ROOT, '../scripts/refurnish_local_demo.mjs'), 'utf8');

  const checkItems = [
    { roomId: 'f1-B', type: 'refrigerator', posX: 0.6724, posY: 0.0974 },
    { roomId: 'f1-B', type: 'light_bulb', posX: 0.7900, posY: 0.2310 },
    { roomId: 'f1-C', type: 'washing_machine', posX: 0.0904, posY: 0.6434 },
    { roomId: 'f1-D', type: 'water_heater', posX: 0.6224, posY: 0.6434 },
    { roomId: 'f2-A', type: 'bed', posX: 0.1392, posY: 0.0765 },
    { roomId: 'f2-A', type: 'lights', posX: 0.2544, posY: 0.0933 },
    { roomId: 'f2-A', type: 'fan', posX: 0.0696, posY: 0.4400 },
    { roomId: 'f2-B', type: 'bed', posX: 0.6808, posY: 0.0765 },
    { roomId: 'f2-B', type: 'lights', posX: 0.7928, posY: 0.0933 },
    { roomId: 'f2-D', type: 'water_heater', posX: 0.6224, posY: 0.6434 },
  ];

  for (const item of checkItems) {
    const mockItem = MOCK_SIMULATOR_ITEMS.find((m) => m.roomId === item.roomId && m.type === item.type);
    assert.ok(mockItem, `Mock item ${item.roomId}/${item.type} exists`);
    assert.ok(Math.abs(mockItem.posX - item.posX) < 0.001, `Mock ${item.roomId}/${item.type} posX agrees`);
    assert.ok(Math.abs(mockItem.posY - item.posY) < 0.001, `Mock ${item.roomId}/${item.type} posY agrees`);

    const posXStr = item.posX.toFixed(4).replace('0.', '');
    const posYStr = item.posY.toFixed(4).replace('0.', '');

    const seedMatches = seedSql.includes(`.${posXStr}`) && seedSql.includes(`.${posYStr}`);
    assert.ok(seedMatches, `seed.sql must include .${posXStr} and .${posYStr} for ${item.roomId}/${item.type}`);

    const refurnishMatches = refurnishScript.includes(`.${posXStr}`) && refurnishScript.includes(`.${posYStr}`);
    assert.ok(refurnishMatches, `refurnish script must include .${posXStr} and .${posYStr} for ${item.roomId}/${item.type}`);
  }
});

test('no picture size changed (size table unchanged)', () => {
  assert.deepEqual(FLOOR_VISIBLE_CONTENT_BOUNDS.refrigerator, { width: 162, height: 279 });
  assert.deepEqual(FLOOR_VISIBLE_CONTENT_BOUNDS.washing_machine, { width: 205, height: 256 });
  assert.deepEqual(FLOOR_VISIBLE_CONTENT_BOUNDS.water_heater, { width: 202, height: 235 });
  assert.deepEqual(FLOOR_VISIBLE_CONTENT_BOUNDS.bed, { width: 227, height: 164 });
});

test('TV, shower, work, charging, and sleep blocks resolve one standing target', () => {
  const rooms = createDefaultRooms(false);
  const living = rooms.find((room) => room.id === 'f1-A');
  const livingItems = roomItems(MOCK_SIMULATOR_ITEMS, living.id);
  const tv = resolveAvatarPlacement({
    name: 'Watching TV', iconType: 'custom',
    applianceIds: ['f1-tv-living', 'f1-ac-living'], avatarWalks: true,
  }, living, livingItems);
  assert.equal(tv.interactionItemId, 'f1-sofa-living');
  assert.deepEqual(new Set(tv.activeApplianceIds), new Set(['f1-tv-living', 'f1-ac-living', 'f1-bulb-a']));
  assert.equal(tv.pose, 'stand');

  const bathroom = rooms.find((room) => room.id === 'f1-D');
  const bathroomItems = roomItems(MOCK_SIMULATOR_ITEMS, bathroom.id);
  const shower = resolveAvatarPlacement({
    name: 'Morning Shower', iconType: 'shower', applianceIds: ['f1-shower-bath'], avatarWalks: true,
  }, bathroom, bathroomItems);
  assert.equal(shower.interactionItemId, 'f1-shower-bath');
  assert.equal(shower.pose, 'stand');

  const workplaceRoom = rooms.find((room) => room.id === 'f2-C');
  const workplaceItems = roomItems(MOCK_SIMULATOR_ITEMS, workplaceRoom.id);
  const work = resolveAvatarPlacement({
    name: 'Working', iconType: 'work', applianceIds: ['f2-workplace'], avatarWalks: true,
  }, workplaceRoom, workplaceItems);
  assert.equal(work.interactionItemId, 'f2-workplace');
  assert.equal(work.pose, 'stand');

  const charging = resolveAvatarPlacement({
    name: 'Charging phone', iconType: 'work', applianceIds: ['f2-workplace'], avatarWalks: false,
  }, workplaceRoom, workplaceItems);
  assert.equal(charging.interactionItemId, null);
  assert.equal(charging.shouldWalk, false);
  assert.deepEqual(charging.activeApplianceIds, ['f2-workplace']);

  const legacyRefs = resolveAvatarPlacement({
    name: 'Breakfast', iconType: 'meal', applianceIds: ['f1-fridge-kitchen', 'f1-bulb-b'], avatarWalks: true,
  }, rooms.find((room) => room.id === 'f1-B'), roomItems(MOCK_SIMULATOR_ITEMS, 'f1-B'));
  assert.deepEqual(new Set(legacyRefs.activeApplianceIds), new Set(['f1-fridge-kitchen', 'f1-bulb-b']));
  assert.equal(legacyRefs.interactionItemId, 'f1-fridge-kitchen');

  const laundry = resolveAvatarPlacement({
    name: 'Laundry', iconType: 'custom', applianceIds: ['f1-washer-laundry'], avatarWalks: true,
  }, rooms.find((room) => room.id === 'f1-C'), roomItems(MOCK_SIMULATOR_ITEMS, 'f1-C'));
  assert.equal(laundry.interactionItemId, 'f1-washer-laundry');

  const bedroom = rooms.find((room) => room.id === 'f2-A');
  const bedroomItems = roomItems(MOCK_SIMULATOR_ITEMS, bedroom.id);
  const sleep = resolveAvatarPlacement({
    name: 'Sleep', iconType: 'sleep', applianceIds: [], avatarWalks: true,
  }, bedroom, bedroomItems);
  assert.equal(sleep.interactionItemId, 'f2-bed-master');
  assert.equal(sleep.pose, 'stand');
  assert.deepEqual(BLOCK_PRIMARY_ITEM, {
    watchingTv: 'sofa', shower: 'water_heater', breakfastOrKitchen: 'refrigerator',
    laundry: 'washing_machine', workingOrStudying: 'workplace', chargingPhone: null,
    sleeping: 'bed', fallback: null,
  });
});

test('room-specific layout uses data and its combined Workplace sprite is the only desk item', () => {
  const room = createDefaultRooms(false).find((candidate) => candidate.id === 'f2-C');
  const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
  assert.equal(room.type, 'work_room');
  assert.equal(getRoomTemplateId(room, items), 'f2-C');
  assert.equal(items.filter((item) => item.type === 'workplace').length, 1);
  assert.equal(items.some((item) => item.category === 'Furniture' && /desk/i.test(item.name)), false);
});

test('1F bottom-middle is the set-up bathroom', () => {
  const room = createDefaultRooms(false).find((candidate) => candidate.floor === 1 && candidate.slot === 'D');
  assert.equal(room.isSetUp, true);
  assert.deepEqual(new Set(roomItems(MOCK_SIMULATOR_ITEMS, room.id).map((item) => item.type)),
    new Set(['water_heater', 'light_bulb', 'toilet', 'sink']));
});

test('work suggestion flags remain true, true, false', () => {
  assert.deepEqual(WORK_ROUTINE_SUGGESTIONS.map(({ name, avatarWalks }) => ({ name, avatarWalks })), [
    { name: 'Working', avatarWalks: true },
    { name: 'Studying', avatarWalks: true },
    { name: 'Charging phone', avatarWalks: false },
  ]);
});

test('floor view follows only when it started on the resident floor', () => {
  assert.equal(shouldFollowAvatarFloor({ viewedFloor: 1, avatarFloorAtWalkStart: 1, isEditMode: false }), true);
  assert.equal(shouldFollowAvatarFloor({ viewedFloor: 2, avatarFloorAtWalkStart: 1, isEditMode: false }), false);
  assert.equal(shouldFollowAvatarFloor({ viewedFloor: 1, avatarFloorAtWalkStart: 1, isEditMode: true }), false);
  assert.equal(shouldFollowAvatarFloor({ viewedFloor: 1, avatarFloorAtWalkStart: 1, isEditMode: false, userChangedFloorDuringWalk: true }), false);
});

test('the avatar implementation follows the doorway path and has no idle roaming code', () => {
  const simulator = readFileSync(resolve(FRONTEND_ROOT, 'src/app/(tabs)/simulator.tsx'), 'utf8');
  const engine = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/logic/SimulationEngine.ts'), 'utf8');
  const floorPlan = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/FloorPlan.tsx'), 'utf8');
  const source = `${simulator}\n${engine}\n${floorPlan}`;
  assert.match(simulator, /avatarTargetRef/);
  assert.match(simulator, /findHomeWalkRoute/);
  assert.doesNotMatch(source, /idle wandering|\bwander\b/i);
});

test('normal, 1W, 1M, 1Y, and reel movement share one constant linear speed', () => {
  const path = [{ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.2 }, { x: 0.4, y: 0.6 }];
  assert.equal(AVATAR_SPEED, 0.45);
  assert.ok(Math.abs(pathLength(path) - 0.7) < 0.000001);
  const expected = 0.7 / AVATAR_SPEED * 1000;
  for (const _mode of ['normal', '1W', '1M', '1Y', 'reel']) {
    assert.ok(Math.abs(walkTimeMs(path) - expected) < 0.001);
  }
  const avatar = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/Avatar.tsx'), 'utf8');
  const simulator = readFileSync(resolve(FRONTEND_ROOT, 'src/app/(tabs)/simulator.tsx'), 'utf8');
  assert.doesNotMatch(avatar, /posAnim|toValue:\s*\{\s*x:\s*pixelX/);
  assert.match(simulator, /const step = AVATAR_SPEED \* deltaSec/);
});

test('fast-forward exposes 1W, 1M, 1Y and bill card uses weekly, monthly, annual totals', () => {
  assert.deepEqual(PERIOD_MONTHS, { '1W': 0.25, '1M': 1, '1Y': 12 });
  assert.deepEqual(PERIOD_BILL_UNITS, { '1W': '/ week', '1M': '/ month', '1Y': '/ year' });
  assert.equal(getPeriodBillTotal(221, '1W'), 55.25);
  assert.equal(getPeriodBillTotal(221, '1M'), 221);
  assert.equal(getPeriodBillTotal(221, '1Y'), 2652);
  const billCard = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/BillCard.tsx'), 'utf8');
  assert.match(billCard, /\['1W', '1M', '1Y'\]/);
  assert.match(billCard, /PERIOD_BILL_UNITS/);
});

test('bill breakdown gives non-zero, period-aware appliance data for 1W, 1M and 1Y', () => {
  const normalized = normalizeKwhToTotal([240, 120, 60], 420);
  assert.deepEqual(normalized, [240, 120, 60]);
  assert.deepEqual(allocateAppliancePercentages(normalized), [57, 29, 14]);
  assert.deepEqual(BILL_PERIOD_FACTORS, { '1W': 0.25, '1M': 1, '1Y': 12 });
  assert.equal(Math.round(getBillPeriodTotal(245, '1W')), 61);
  assert.equal(getBillPeriodTotal(245, '1M'), 245);
  assert.equal(getBillPeriodTotal(245, '1Y'), 2940);
  const modal = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/BillModal.tsx'), 'utf8');
  assert.match(modal, /getReasonableMonthlyKwh/);
  assert.match(modal, /allocateAppliancePercentages/);
  const simulator = readFileSync(resolve(FRONTEND_ROOT, 'src/app/(tabs)/simulator.tsx'), 'utf8');
  assert.match(simulator, /period=\{selectedFastForward\}/);
  assert.match(simulator, /monthlyBillRmOverride=\{billCardMonthlyBillRm\}/);
  assert.match(modal, /monthlyBillRmOverride\?\: number/);
});

test('Bill Card keeps the demo month above RM500 and solar below it without changing billCalc', () => {
  assert.equal(getSimulatorBillCardMonthlyTotal(245, false), SIMULATOR_BILL_CARD_BASELINE_RM);
  assert.ok(getSimulatorBillCardMonthlyTotal(245, false) > 500);
  assert.equal(getSimulatorBillCardMonthlyTotal(245, true), 437);
  assert.ok(getSimulatorBillCardMonthlyTotal(245, true) > 400);
  assert.equal(getSimulatorBillCardMonthlyTotal(700, false), 700);
  assert.equal(getSimulatorBillCardMonthlyTotal(700, true), 588);
});

test('a reel segment is route time plus fixed stair fades and at least 2.5 seconds using the appliance', () => {
  const paths = [
    [{ x: 0, y: 0 }, { x: 0.45, y: 0 }],
    [{ x: 0.45, y: 0 }, { x: 0.45, y: 0.45 }],
  ];
  const duration = reelSegmentDurationMs(paths, true);
  assert.equal(duration, 2000 + AVATAR_USE_HOLD_MS + STAIR_FADE_OUT_MS + STAIR_CROSS_FADE_MS);
  assert.equal(hasHeldUsePose(1000, 1000 + AVATAR_USE_HOLD_MS - 1), false);
  assert.equal(hasHeldUsePose(1000, 1000 + AVATAR_USE_HOLD_MS), true);
});

test('block lighting starts immediately, replaces the previous block, and always-on appliances remain lit', () => {
  const simulator = readFileSync(resolve(FRONTEND_ROOT, 'src/app/(tabs)/simulator.tsx'), 'utf8');
  assert.match(simulator, /const isRoomCeilingLight = item\.roomId === targetRoom\?\.id && item\.type === 'light_bulb'/);
  assert.match(simulator, /item\.alwaysOn \|\| visualActiveIds\.includes\(item\.id\) \|\| isRoomCeilingLight/);
  assert.doesNotMatch(simulator, /residentHasArrived/);
  assert.match(simulator, /segmentProgress < 1 \|\| !hasArrivedAndUsed/);
});

test('bill count starts at zero, ends at the exact real value, and never exceeds it', () => {
  const target = 245;
  assert.equal(BILL_COUNT_DURATION_MS, 1500);
  assert.equal(billCountValue(target, 0), 0);
  assert.equal(billCountValue(target, 1), target);
  assert.equal(billCountValue(target, 0, true), 0);
  assert.equal(billCountValue(target, 1, true), target);
  assert.ok(easeOutBillProgress(0.5) > 0.5);
  for (let step = -10; step <= 110; step += 1) {
    const value = billCountValue(target, step / 100, step % 2 === 0);
    assert.ok(value >= 0 && value <= target);
  }
  const billCard = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/BillCard.tsx'), 'utf8');
  assert.match(billCard, /fontVariant:\s*\['tabular-nums'\]/);
});

test('energy report derives every kWh and RM value and chooses its insight from data', () => {
  const report = buildEnergyReport(MOCK_SIMULATOR_ITEMS, 245);
  assert.equal(report.topRows.length, 3);
  for (const row of report.allRows) {
    assert.equal(row.monthlyKwh, monthlyKwh(row.watts, row.hoursPerDay));
    assert.equal(row.monthlyCostRm, calcBillFromKwh(row.monthlyKwh));
  }
  assert.equal(report.insight.item.type, 'refrigerator');
  assert.equal(report.insight.hoursPerDay, 24);
  assert.match(report.insightText, /refrigerator runs 24 hours a day/i);
  assert.equal(report.suggestion.source.item.id, report.insight.item.id);
  assert.deepEqual(report.suggestion.replacement, SWAP_CATALOG.refrigerator);
  assert.equal(report.suggestion.savingKwh, 43.2);
  assert.equal(report.suggestion.savingRm, 19.19);
});

test('swap catalog keeps the approved placeholder brands, stars, and watts', () => {
  assert.deepEqual(SWAP_CATALOG, {
    refrigerator: { type: 'refrigerator', brand: 'Panasonic', stars: 5, wattage: 90, model: '5-star inverter', inverter: true },
    air_conditioner: { type: 'air_conditioner', brand: 'Daikin', stars: 5, wattage: 700, model: '5-star inverter', inverter: true },
    lights: { type: 'lights', brand: 'LED', stars: 5, wattage: 9 },
    light_bulb: { type: 'light_bulb', brand: 'LED', stars: 5, wattage: 9 },
  });
});

test('swap cards use the report top-three sprites and expose the catalog stars, brand, and watts without tabs', () => {
  const report = buildEnergyReport([
    { id: 'top-fridge', type: 'refrigerator', spriteKey: 'refrigerator', name: 'Fridge', brand: 'Sharp', wattage: 150, stars: 2, alwaysOn: true },
    { id: 'top-aircon', type: 'air_conditioner', spriteKey: 'air_conditioner', name: 'Aircon', brand: 'Panasonic', wattage: 1200, stars: 3, hoursPerDay: 4 },
    { id: 'top-light', type: 'light_bulb', spriteKey: 'light_bulb', name: 'Light', brand: 'Standard', wattage: 60, stars: 2, hoursPerDay: 6 },
  ], 245);
  const cards = buildSwapSuggestionCards(report.topRows);
  assert.equal(cards.length, 3);
  for (const card of cards) {
    assert.equal(card.spriteKey, card.source.item.spriteKey || card.source.item.type);
    assert.equal(card.replacement, SWAP_CATALOG[card.source.item.type]);
    assert.ok(card.replacement.brand);
    assert.ok(card.replacement.stars > 0);
    assert.ok(card.replacement.wattage > 0);
  }
  const sheet = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/SwapSuggestionSheet.tsx'), 'utf8');
  assert.match(sheet, /EditSheetSurface/);
  assert.match(sheet, /EditSheetTileSurface/);
  assert.match(sheet, /getTrayTileWidth/);
  assert.match(sheet, /<Sprite/);
  assert.match(sheet, /<Star/);
  assert.match(sheet, /replacement\.brand/);
  assert.match(sheet, /replacement\.wattage/);
  assert.doesNotMatch(sheet, /Furniture|Segmented|tabLabel|activeTab/);
});

test('applying a swap changes only the catalog item fields and lowers the bill calculation', () => {
  const refrigerator = MOCK_SIMULATOR_ITEMS.find((item) => item.type === 'refrigerator');
  const before = buildEnergyReport([refrigerator], 0);
  const swapped = applySwapToItem(refrigerator, SWAP_CATALOG.refrigerator);
  const after = buildEnergyReport([swapped], 0);
  assert.equal(swapped.id, refrigerator.id);
  assert.equal(swapped.type, refrigerator.type);
  assert.equal(swapped.spriteKey, refrigerator.spriteKey);
  assert.equal(swapped.brand, 'Panasonic');
  assert.equal(swapped.stars, 5);
  assert.equal(swapped.wattage, 90);
  assert.ok(after.totalBillRm < before.totalBillRm);
});

test('post-simulation sequence skips the solar suggestion once solar is active', () => {
  const simulator = readFileSync(resolve(FRONTEND_ROOT, 'src/app/(tabs)/simulator.tsx'), 'utf8');
  const reportIndex = simulator.indexOf('{(aiReportVisible || postSwapAiReportVisible)');
  const swapIndex = simulator.indexOf('{swapSuggestionVisible && <SwapSuggestionSheet');
  const solarIndex = simulator.indexOf('{solarSuggestionVisible && !solarApplied && <ApplianceSuggestionSheet');
  assert.ok(simulator.includes('postSwapAiReportVisible'));
  assert.ok(reportIndex >= 0 && reportIndex < swapIndex && swapIndex < solarIndex);
  assert.match(simulator, /setAiReportVisible\(false\);\s*setSwapSuggestionVisible\(true\)/);
  assert.match(simulator, /setSwapSuggestionVisible\(false\);\s*setPostSwapAiReportVisible\(true\)/);
  assert.match(simulator, /setPostSwapAiReportVisible\(false\);\s*if \(!solarApplied\) setSolarSuggestionVisible\(true\)/);
  assert.match(simulator, /setSwapSuggestionVisible\(false\);\s*if \(!solarApplied\) setSolarSuggestionVisible\(true\)/);
  assert.match(simulator, /\{solarSuggestionVisible && !solarApplied && <ApplianceSuggestionSheet/);
  assert.match(simulator, /\(solarSuggestionVisible && !solarApplied\)/);
  assert.match(simulator, /paddingBottom: isFloorPlanCompacted \? 256/);
  assert.match(simulator, /Refusing to apply Simulator swap outside local Supabase/);
});

test('post-swap AI report shows the bill delta while preserving the prior suggestion text', () => {
  const modal = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/AIAnalysisReportModal.tsx'), 'utf8');
  assert.match(modal, /comparisonBaseBillRm/);
  assert.match(modal, /Compared with your last report, this swap saves RM/);
  assert.match(modal, /suggestionOverride/);
  const simulator = readFileSync(resolve(FRONTEND_ROOT, 'src/app/(tabs)/simulator.tsx'), 'utf8');
  assert.match(simulator, /suggestionOverride=\{postSwapAiReportVisible \? \(energyReportBaseline\?\.suggestion \?\? null\)/);
});

test('energy optimization gallery shows the floor plan in the same compact layout as Edit mode', () => {
  const gallery = readFileSync(resolve(FRONTEND_ROOT, 'src/app/_dev/simulator.tsx'), 'utf8');
  assert.match(gallery, /energy-optimization-compact-floor/);
  assert.match(gallery, /compactLayout=\{activeState === 'energy-optimization-compact-floor'\}/);
  assert.match(gallery, /paddingBottom: compactLayout \? 256 : 16/);
  assert.match(gallery, /activeState === 'energy-optimization-compact-floor'.*SwapSuggestionSheet/s);
});

test('every set-up room is reachable from the stair and every segment uses rooms or doorways', () => {
  const rooms = createDefaultRooms(false);
  for (const floor of [1, 2]) {
    for (const room of rooms.filter((candidate) => candidate.floor === floor && candidate.isSetUp)) {
      const route = findFloorWalkPath({
        floor, rooms, start: STAIR_CENTER,
        startRoomId: null, end: getRoomCenter(room), endRoomId: room.id,
      });
      assert.equal(route.reachedTarget, true, `${room.id} must be reachable from the stair`);
      for (let index = 1; index < route.points.length; index += 1) {
        assert.equal(isWalkSegmentValid(floor, rooms, route.points[index - 1], route.points[index]), true, `${room.id} crosses a wall`);
      }
    }
  }
});

test('all room target pairs route through valid door segments, including across floors', () => {
  const rooms = createDefaultRooms(false);
  const setUp = rooms.filter((room) => room.isSetUp);
  for (const from of setUp) {
    for (const to of setUp) {
      const sections = findHomeWalkRoute({
        rooms, startFloor: from.floor, endFloor: to.floor,
        start: getRoomCenter(from), startRoomId: from.id,
        end: getRoomCenter(to), endRoomId: to.id,
      });
      assert.equal(sections.at(-1).reachedTarget, true, `${from.id} -> ${to.id} must reach its target`);
      for (const section of sections) {
        for (let index = 1; index < section.points.length; index += 1) {
          assert.equal(isWalkSegmentValid(section.floor, rooms, section.points[index - 1], section.points[index]), true, `${from.id} -> ${to.id} crosses a wall`);
        }
      }
    }
  }
});

test('the newly set-up bottom-middle room is reachable', () => {
  const rooms = createDefaultRooms(false);
  const from = rooms.find((room) => room.id === 'f1-A');
  const dark = rooms.find((room) => room.id === 'f1-D');
  const route = findFloorWalkPath({
    floor: 1, rooms, start: getRoomCenter(from), startRoomId: from.id,
    end: getRoomCenter(dark), endRoomId: dark.id,
  });
  assert.equal(route.reachedTarget, true);
});

test('tray contains every in-tray database type in sort order and keeps four-plus tiles visible', () => {
  const catalog = [
    ['air_conditioner', true], ['refrigerator', true], ['lights', true], ['fan', true], ['tv', true],
    ['water_heater', true], ['router', true], ['workplace', true], ['washing_machine', true], ['ceiling_fan', false],
  ].map(([id, inTray], sort_order) => ({ id, in_tray: inTray, sort_order }));
  assert.deepEqual(getInTrayTypeIds(catalog), [
    'air_conditioner', 'refrigerator', 'lights', 'fan', 'tv', 'water_heater', 'router', 'workplace', 'washing_machine',
  ]);
  assert.deepEqual(appendClientApplianceTrayTypeIds(['air_conditioner', 'router']),
    ['air_conditioner', 'router', 'light_bulb']);
  assert.equal(Math.round(getTrayTileWidth(390) * 10) / 10, 81.4);
  const manifest = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/logic/spriteMap.ts'), 'utf8');
  assert.match(manifest, /key: 'stair'[\s\S]*inTray: false/);
});

test('edit tray and square plan fit the two target screens', () => {
  assert.deepEqual(getEditLayoutMetrics(390, 844), {
    trayHeight: 150, planOuterSide: 358, planCanvasSide: 340, hideCurrentTask: false,
  });
  assert.deepEqual(getEditLayoutMetrics(360, 740), {
    trayHeight: 150, planOuterSide: 300, planCanvasSide: 282, hideCurrentTask: false,
  });
});

test('lit appearance has no surface fill or border, appliances stay at full opacity, and web has multi-layered drop-shadow', () => {
  for (const platform of ['web', 'ios', 'android']) {
    const lit = getLitAppearance(true, false, platform);
    assert.deepEqual(lit.surface, { backgroundColor: 'transparent', borderWidth: 0 });
    assert.equal(lit.spriteOpacity, 1);
  }
  assert.equal((getLitAppearance(true, false, 'web').webFilter.match(/drop-shadow/g) ?? []).length, 2);
  assert.equal(getLitAppearance(true, false, 'android').androidCopy.scale, 1.06);
  assert.equal(getLitAppearance(false, false, 'web').spriteOpacity, 1);
  assert.equal(getLitAppearance(false, false, 'web').webFilter, undefined);
});

test('default and expanded fixture counts are stable', () => {
  assert.equal(MOCK_SIMULATOR_ITEMS.length, 34);
  assert.equal(MOCK_SIMULATOR_ITEMS_ALL.length, 34);
});

test('table lamps stay in bedrooms, floor 2 has no TV, and every set-up room has one ceiling bulb', () => {
  const rooms = createDefaultRooms(false);
  for (const room of rooms.filter((candidate) => candidate.isSetUp)) {
    const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
    const bulbs = items.filter((item) => item.type === 'light_bulb');
    assert.equal(bulbs.length, 1, `${room.id} needs one ceiling bulb`);
    const bulbSlot = ROOM_SLOTS[getRoomTemplateId(room, items)].slots.find((slot) => slot.type === 'light_bulb');
    assert.ok(bulbSlot, `${room.id} needs a ceiling slot`);
    for (const lamp of items.filter((item) => item.type === 'lights')) {
      assert.equal(room.type, 'bedroom');
      const bed = items.find((item) => item.type === 'bed');
      assert.ok(bed, `${room.id} lamp must have a bed`);
    }
    if (room.floor === 2) assert.equal(items.some((item) => item.type === 'tv'), false);
  }
});

test('air conditioners use a back wall or a front wall with real back-facing art', () => {
  const rooms = createDefaultRooms(false);
  for (const room of rooms) {
    const slots = ROOM_SLOTS[getRoomTemplateId(room)].slots.filter((slot) => slot.type === 'air_conditioner');
    for (const slot of slots) assert.ok(slot.bottom === 0.17 || (slot.bottom === 0.92 && slot.itemFacing === 'back'));
    for (const item of roomItems(MOCK_SIMULATOR_ITEMS, room.id).filter((candidate) => candidate.type === 'air_conditioner')) {
      const slot = ROOM_SLOTS[getRoomTemplateId(room)].slots.find((candidate) => candidate.type === item.type);
      assert.ok(slot && (slot.bottom === 0.17 || (slot.bottom === 0.92 && slot.itemFacing === 'back')), `${item.id} must use its own room slot`);
    }
  }
});

test('special rooms use their persisted room types', () => {
  const rooms = createDefaultRooms(false);
  const laundry = rooms.find((room) => room.id === 'f1-C');
  const work = rooms.find((room) => room.id === 'f2-C');
  assert.deepEqual({ name: laundry.name, type: laundry.type }, { name: 'Laundry Room', type: 'laundry_room' });
  assert.deepEqual({ name: work.name, type: work.type }, { name: 'Work Room', type: 'work_room' });
});

test('every default appliance resolves to a real manifest picture', () => {
  const manifestPath = resolve(FRONTEND_ROOT, 'src/features/simulator/logic/spriteMap.ts');
  const manifest = readFileSync(manifestPath, 'utf8');
  const keys = new Set([...manifest.matchAll(/key: '([^']+)'[\s\S]*?source: require\('([^']+\.png)'\)/g)]
    .filter((match) => existsSync(resolve(dirname(manifestPath), match[2])))
    .map((match) => match[1]));
  keys.add('wifi_router');
  for (const item of MOCK_SIMULATOR_ITEMS.filter((candidate) => candidate.category === 'Appliances')) {
    assert.ok(keys.has(item.spriteKey) || (item.spriteKey === 'router' && keys.has('router')), `${item.id} needs a real picture`);
  }
  assert.ok(existsSync(resolve(FRONTEND_ROOT, 'assets/sprites/appliances/washing_machine.png')));
  assert.ok(existsSync(resolve(FRONTEND_ROOT, 'assets/sprites/appliances/wifi_router.png')));
});

test('Tidy up reproduces room-specific positions and persisted facing', () => {
  const rooms = createDefaultRooms(false);
  const messy = MOCK_SIMULATOR_ITEMS.map((item) => ({ ...item, posX: 0.5, posY: 0.5, rotation: 0 }));
  const floor1 = tidyFloorItems(messy, rooms, 1).items;
  const tidied = tidyFloorItems(floor1, rooms, 2).items;
  for (const expected of MOCK_SIMULATOR_ITEMS) {
    const actual = tidied.find((item) => item.id === expected.id);
    assert.equal(actual.posX, expected.posX, `${expected.id} x`);
    assert.equal(actual.posY, expected.posY, `${expected.id} y`);
  }
  assert.equal(tidied.find((item) => item.id === 'f1-sofa-living').facing, 'back');
});

test('tidy layout moves known items, preserves unknown leftovers, and is stable for 50 shuffled room sets', () => {
  const rooms = createDefaultRooms(false);
  const messy = MOCK_SIMULATOR_ITEMS.map((item) => ({ ...item, posX: 0.5, posY: 0.5 }));
  const unknown = { ...messy[0], id: 'unknown-fixture', type: 'unknown', spriteKey: 'unknown', posX: 0.21, posY: 0.31 };
  const result = tidyFloorItems([...messy, unknown], rooms, 1);
  assert.ok(result.moved.length > 0);
  assert.equal(result.leftovers.some((item) => item.id === unknown.id), true);
  assert.deepEqual(result.items.find((item) => item.id === unknown.id), unknown);
  for (let seed = 0; seed < 50; seed += 1) {
    const picked = MOCK_SIMULATOR_ITEMS.filter((_item, index) => (index * 17 + seed * 13) % 5 !== 0);
    const tidied = tidyFloorItems(picked.map((item) => ({ ...item, posX: 0.5, posY: 0.5 })), rooms, seed % 2 ? 1 : 2);
    assert.equal(tidied.leftovers.length, 0);
  }
});

test('the reel has 7 segments Monday to Sunday', () => {
  const reel = buildWeekReel(DEFAULT_ROUTINE_BLOCKS);
  assert.equal(reel.length, 7);
  assert.deepEqual(reel.map((segment) => segment.day), [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ]);
  assert.deepEqual(reel.map((segment) => segment.dayIndex), [0, 1, 2, 3, 4, 5, 6]);
});

test('the featured block for each weekday follows the mapping and the fallbacks', () => {
  const customBlocks = [
    { id: 'b-sleep', name: 'Sleep', startTime: '00:00', endTime: '06:00', roomId: 'f2-A', iconType: 'sleep', applianceIds: [] },
    { id: 'b-shower', name: 'Morning Shower', startTime: '06:30', endTime: '07:00', roomId: 'f1-C', iconType: 'shower', applianceIds: [] },
    { id: 'b-breakfast', name: 'Breakfast & Prep', startTime: '07:15', endTime: '08:00', roomId: 'f1-B', iconType: 'meal', applianceIds: [] },
    { id: 'b-work', name: 'Workplace Study', startTime: '09:00', endTime: '12:00', roomId: 'f2-B', iconType: 'work', applianceIds: [] },
    { id: 'b-dinner', name: 'Dinner', startTime: '18:30', endTime: '19:30', roomId: 'f1-B', iconType: 'meal', applianceIds: [] },
    { id: 'b-tv', name: 'Watching TV', startTime: '20:00', endTime: '22:00', roomId: 'f1-A', iconType: 'evening', applianceIds: [] },
  ];

  // Monday: shower
  assert.equal(chooseFeaturedBlock('Monday', customBlocks).block.id, 'b-shower');
  // Tuesday: breakfast
  assert.equal(chooseFeaturedBlock('Tuesday', customBlocks).block.id, 'b-breakfast');
  // Wednesday: work
  assert.equal(chooseFeaturedBlock('Wednesday', customBlocks).block.id, 'b-work');
  // Thursday: evening
  assert.equal(chooseFeaturedBlock('Thursday', customBlocks).block.id, 'b-tv');
  // Friday: dinner
  assert.equal(chooseFeaturedBlock('Friday', customBlocks).block.id, 'b-dinner');
  // Saturday: evening
  assert.equal(chooseFeaturedBlock('Saturday', customBlocks).block.id, 'b-tv');
  // Sunday: evening
  assert.equal(chooseFeaturedBlock('Sunday', customBlocks).block.id, 'b-tv');

  // Fallback 1: category missing -> uses first non-away, non-sleep block
  const missingWorkBlocks = [
    { id: 'b-sleep', name: 'Sleep', startTime: '00:00', endTime: '06:00', roomId: 'f2-A', iconType: 'sleep', applianceIds: [] },
    { id: 'b-reading', name: 'Reading in Bed', startTime: '10:00', endTime: '11:00', roomId: 'f1-A', iconType: 'custom', applianceIds: [] },
  ];
  assert.equal(chooseFeaturedBlock('Wednesday', missingWorkBlocks).block.id, 'b-reading');

  // Fallback 2: only sleep exists -> uses sleep
  const onlySleep = [
    { id: 'b-sleep', name: 'Sleep', startTime: '00:00', endTime: '06:00', roomId: 'f2-A', iconType: 'sleep', applianceIds: [] },
  ];
  assert.equal(chooseFeaturedBlock('Monday', onlySleep).block.id, 'b-sleep');
});

test('the savings counter reaches the total at the end of Sunday', () => {
  const totalSavings = 144;
  // Beginning of Monday (day 0, progress 0)
  assert.equal(getReelSavings(totalSavings, 0, 0), 0);
  // Mid-week progress
  assert.equal(getReelSavings(totalSavings, 3, 0.5), Math.round(144 * (3.5 / 7)));
  // End of Sunday (dayIndex 6, progress 1.0)
  assert.equal(getReelSavings(totalSavings, 6, 1.0), totalSavings);
});

test('an all-away weekday gives the Away segment', () => {
  const allAwayBlocks = [
    { id: 'b-away', name: 'Office Day', startTime: '08:00', endTime: '18:00', roomId: 'away', isAway: true, iconType: 'away', applianceIds: [], repeatDays: ['tuesday'] },
  ];
  const segment = chooseFeaturedBlock('Tuesday', allAwayBlocks);
  assert.equal(segment.isAway, true);
  assert.equal(segment.caption, 'Tuesday · Away');
});

test('reduced motion returns the static summary', () => {
  const summary = getReducedMotionSummary(DEFAULT_ROUTINE_BLOCKS, 85);
  assert.equal(summary.segments.length, 7);
  assert.equal(summary.finalSavingsRm, 85);
  assert.equal(summary.segments[0].day, 'Monday');
});

test('the play flow: first tap opens the menu, second tap plays, tap while playing stops, Edit mode disables it', () => {
  let state = { menuOpen: false, isPlaying: false, isEditMode: false };
  // First tap opens the period menu
  state = reducePlayFlow(state, 'tapButton');
  assert.equal(state.menuOpen, true);
  assert.equal(state.isPlaying, false);

  // Second tap plays
  state = reducePlayFlow(state, 'tapButton');
  assert.equal(state.menuOpen, false);
  assert.equal(state.isPlaying, true);

  // Tap while playing stops it
  state = reducePlayFlow(state, 'tapButton');
  assert.equal(state.isPlaying, false);

  // Tap or drag screen while playing stops it
  state = { menuOpen: false, isPlaying: true, isEditMode: false };
  state = reducePlayFlow(state, 'tapOrDragScreen');
  assert.equal(state.isPlaying, false);

  // Edit mode disables playing
  state = { menuOpen: false, isPlaying: false, isEditMode: true };
  state = reducePlayFlow(state, 'tapButton');
  assert.equal(state.menuOpen, false);
  assert.equal(state.isPlaying, false);

  // Toggling edit mode while playing stops playback
  state = { menuOpen: false, isPlaying: true, isEditMode: false };
  state = reducePlayFlow(state, 'toggleEdit');
  assert.equal(state.isEditMode, true);
  assert.equal(state.isPlaying, false);
});

test('f2-A has exactly one stand_fan, at the bottom-left, with no violation', () => {
  const room = createDefaultRooms(false).find((r) => r.id === 'f2-A');
  const items = roomItems(MOCK_SIMULATOR_ITEMS, 'f2-A');
  const fans = items.filter((item) => item.type === 'fan');
  assert.equal(fans.length, 1, 'f2-A must have exactly one stand_fan');
  const fan = fans[0];
  assert.equal(fan.spriteKey, 'fan');
  assert.equal(fan.wattage, 55);

  const slot = ROOM_SLOTS['f2-A'].slots.find((s) => s.type === 'fan');
  assert.ok(slot, 'f2-A must have a fan slot in ROOM_SLOTS');
  assert.equal(slot.x, 0.12);
  assert.equal(slot.y, 0.80);

  const roomRect = getSlotRect(room.slot);
  const fanFp = getItemLocalFootprint(fan, room, PLAN_SIDE, PLAN_SIDE, items);

  // Inside inner floor rectangle (away from walls)
  assert.ok(isFootprintInside(fanFp, INNER_FLOOR_RECT), 'fan must sit inside inner floor rectangle');

  // Away from doorway keep-outs
  const doors = getDoorKeepOuts(room.slot, roomRect.width * PLAN_SIDE, roomRect.height * PLAN_SIDE);
  for (const door of doors) {
    assert.equal(footprintOverlapArea(fanFp, door), 0, 'fan must avoid doorway keep-outs');
  }

  // Away from lanes
  const lanes = ROOM_SLOTS['f2-A'].clearZones;
  for (const lane of lanes) {
    assert.equal(footprintOverlapArea(fanFp, lane), 0, 'fan must avoid clear zones/lanes');
  }

  // Away from stairs
  assert.notEqual(room.slot, 'C', 'f2-A is not stair room');

  // Away from bed and all other items (no overlap)
  const otherItems = items.filter((item) => item.id !== fan.id && getPlacementLayer(item) !== 'ceiling');
  for (const other of otherItems) {
    const otherFp = getItemLocalFootprint(other, room, PLAN_SIDE, PLAN_SIDE, items);
    assert.equal(footprintOverlapArea(fanFp, otherFp), 0, `fan must not overlap ${other.type} (${other.id})`);
  }
});

test('no other item position changed in any room (compare against current values)', () => {
  const expectedPositions = {
    'f1-A': [
      { type: 'air_conditioner', posX: 0.0928, posY: 0.0605 },
      { type: 'tv', posX: 0.2494, posY: 0.1155 },
      { type: 'router', posX: 0.4988, posY: 0.0660 },
      { type: 'table', posX: 0.2784, posY: 0.2970 },
      { type: 'sofa', posX: 0.2784, posY: 0.4345 },
      { type: 'light_bulb', posX: 0.3828, posY: 0.2420 },
      { type: 'fan', posX: 0.0812, posY: 0.4565 },
    ],
    'f1-B': [
      { type: 'refrigerator', posX: 0.6724, posY: 0.0974 },
      { type: 'air_conditioner', posX: 0.9076, posY: 0.0605 },
      { type: 'sink', posX: 0.9204, posY: 0.2404 },
      { type: 'table', posX: 0.7900, posY: 0.2860 },
      { type: 'light_bulb', posX: 0.7900, posY: 0.2310 },
    ],
    'f1-C': [
      { type: 'washing_machine', posX: 0.0904, posY: 0.6434 },
      { type: 'light_bulb', posX: 0.3250, posY: 0.7840 },
    ],
    'f1-D': [
      { type: 'water_heater', posX: 0.6224, posY: 0.6434 },
      { type: 'light_bulb', posX: 0.6872, posY: 0.6850 },
      { type: 'toilet', posX: 0.5792, posY: 0.8965 },
      { type: 'sink', posX: 0.7880, posY: 0.9010 },
    ],
    'f2-A': [
      { type: 'bed', posX: 0.1392, posY: 0.0765 },
      { type: 'lights', posX: 0.2544, posY: 0.0933 },
      { type: 'light_bulb', posX: 0.3132, posY: 0.3740 },
      { type: 'air_conditioner', posX: 0.4756, posY: 0.0605 },
      { type: 'fan', posX: 0.0696, posY: 0.4400 },
    ],
    'f2-B': [
      { type: 'bed', posX: 0.6808, posY: 0.0765 },
      { type: 'lights', posX: 0.7928, posY: 0.0933 },
      { type: 'fan', posX: 0.9412, posY: 0.4235 },
      { type: 'light_bulb', posX: 0.7900, posY: 0.3575 },
    ],
    'f2-C': [
      { type: 'workplace', posX: 0.1250, posY: 0.7030 },
      { type: 'light_bulb', posX: 0.2600, posY: 0.7840 },
      { type: 'air_conditioner', posX: 0.3900, posY: 0.5995 },
    ],
    'f2-D': [
      { type: 'water_heater', posX: 0.6224, posY: 0.6434 },
      { type: 'light_bulb', posX: 0.6980, posY: 0.6850 },
      { type: 'toilet', posX: 0.5936, posY: 0.8965 },
      { type: 'sink', posX: 0.7952, posY: 0.9010 },
    ],
  };

  for (const [roomId, items] of Object.entries(expectedPositions)) {
    const mockItems = roomItems(MOCK_SIMULATOR_ITEMS, roomId);
    assert.equal(mockItems.length, items.length, `${roomId} item count mismatch`);
    for (const expected of items) {
      const match = mockItems.find((item) => item.type === expected.type);
      assert.ok(match, `missing ${roomId} ${expected.type}`);
      assert.ok(Math.abs(match.posX - expected.posX) < 0.001, `${roomId} ${expected.type} posX changed: expected ${expected.posX}, got ${match.posX}`);
      assert.ok(Math.abs(match.posY - expected.posY) < 0.001, `${roomId} ${expected.type} posY changed: expected ${expected.posY}, got ${match.posY}`);
    }
  }
});


