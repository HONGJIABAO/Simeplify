import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  STAIR_RECT,
  getFloorPlanLayout,
  getSlotRect,
} from '../src/features/simulator/logic/roomLayout.ts';
import {
  footprintOverlapArea,
  getDoorKeepOuts,
  getItemLocalFootprint,
  getPlacementLayer,
  getRoomTemplateId,
  INNER_FLOOR_RECT,
  isFootprintInside,
  ROOM_SLOTS,
  useSpot,
} from '../src/features/simulator/logic/furnishedLayout.ts';
import {
  MOCK_SIMULATOR_ITEMS,
  MOCK_SIMULATOR_ITEMS_ALL,
} from '../src/features/simulator/logic/mockHomeData.ts';
import { createDefaultRooms } from '../src/features/simulator/logic/roomData.ts';
import { resolveAvatarPlacement } from '../src/features/simulator/logic/avatarPlace.ts';
import { WORK_ROUTINE_SUGGESTIONS } from '../src/features/simulator/logic/myDayLogic.ts';

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

test('stair geometry remains identical on both floors', () => {
  assert.deepEqual(getFloorPlanLayout(1).stair, STAIR_RECT);
  assert.deepEqual(getFloorPlanLayout(2).stair, STAIR_RECT);
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

  const spriteComponent = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/Sprite.tsx'), 'utf8');
  assert.doesNotMatch(spriteComponent, /ImageOff|crossed-image/i);
});

test('ROOM_SLOTS contains the requested fixed centres, widths, and facing', () => {
  assert.deepEqual(ROOM_SLOTS.living.slots.map(({ type, x, y, w, facing }) => ({ type, x, y, w, facing })), [
    { type: 'tv', x: 0.40, y: 0.14, w: 0.24, facing: 'down' },
    { type: 'air_conditioner', x: 0.80, y: 0.07, w: 0.22, facing: 'down' },
    { type: 'sofa', x: 0.40, y: 0.58, w: 0.40, facing: 'up' },
    { type: 'lights', x: 0.82, y: 0.62, w: 0.08, facing: undefined },
    { type: 'light_bulb', x: 0.50, y: 0.45, w: 0.10, facing: undefined },
  ]);
  assert.equal(ROOM_SLOTS.kitchen.slots.find((slot) => slot.type === 'refrigerator').x, 0.80);
  assert.equal(ROOM_SLOTS.bathroom.slots.find((slot) => slot.type === 'water_heater').spriteKey, 'water_heater');
  assert.equal(ROOM_SLOTS.bedroom.slots.find((slot) => slot.type === 'fan').spriteKey, 'fan');
  assert.equal(ROOM_SLOTS.workplace.slots.find((slot) => slot.type === 'workplace').w, 0.34);
});

test('all default non-ceiling items are inside the inner floor and never overlap', () => {
  const rooms = createDefaultRooms(false);
  for (const room of rooms.filter((candidate) => candidate.isSetUp)) {
    const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
    const entries = items.filter((item) => getPlacementLayer(item) !== 'ceiling').map((item) => ({
      item,
      footprint: getItemLocalFootprint(item, room, PLAN_SIDE, PLAN_SIDE, items),
    }));
    for (const entry of entries) {
      assert.ok(isFootprintInside(entry.footprint, INNER_FLOOR_RECT), `${entry.item.id} must be inside the inner floor`);
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
  const living = ROOM_SLOTS.living;
  const sofa = living.slots.find((slot) => slot.type === 'sofa');
  const tv = living.slots.find((slot) => slot.type === 'tv');
  assert.equal(sofa.facing, 'up');
  assert.ok(sofa.y > tv.y);

  const room = createDefaultRooms(false).find((candidate) => candidate.id === 'f1-A');
  const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
  const lane = { x: INNER_FLOOR_RECT.x, y: INNER_FLOOR_RECT.y + 0.26 * INNER_FLOOR_RECT.height,
    width: INNER_FLOOR_RECT.width, height: 0.19 * INNER_FLOOR_RECT.height };
  for (const item of items.filter((candidate) => getPlacementLayer(candidate) !== 'ceiling'
    && candidate.type !== 'tv' && candidate.type !== 'sofa')) {
    assert.equal(footprintOverlapArea(getItemLocalFootprint(item, room, PLAN_SIDE, PLAN_SIDE, items), lane), 0, `${item.id} blocks the TV lane`);
  }
});

test('useSpot stays inside the inner floor and outside doorway keep-outs', () => {
  const rooms = createDefaultRooms(false);
  const cases = [
    ['f1-A', 'sofa'],
    ['f1-C', 'water_heater'],
    ['f2-B', 'workplace'],
    ['f2-A', 'bed'],
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
  }
});

test('TV, shower, work, charging, and sleep blocks resolve one standing target', () => {
  const rooms = createDefaultRooms(false);
  const living = rooms.find((room) => room.id === 'f1-A');
  const livingItems = roomItems(MOCK_SIMULATOR_ITEMS, living.id);
  const tv = resolveAvatarPlacement({
    name: 'Watching TV', iconType: 'custom',
    applianceIds: ['f1-tv-living', 'f1-lamp-living', 'f1-ac-living'], avatarWalks: true,
  }, living, livingItems);
  assert.equal(tv.interactionItemId, 'f1-sofa-living');
  assert.deepEqual(new Set(tv.activeApplianceIds), new Set(['f1-tv-living', 'f1-lamp-living', 'f1-ac-living']));
  assert.equal(tv.pose, 'stand');

  const bathroom = rooms.find((room) => room.id === 'f1-C');
  const bathroomItems = roomItems(MOCK_SIMULATOR_ITEMS, bathroom.id);
  const shower = resolveAvatarPlacement({
    name: 'Morning Shower', iconType: 'shower', applianceIds: ['f1-shower-bath'], avatarWalks: true,
  }, bathroom, bathroomItems);
  assert.equal(shower.interactionItemId, 'f1-shower-bath');
  assert.equal(shower.pose, 'stand');

  const workplaceRoom = rooms.find((room) => room.id === 'f2-B');
  const workplaceItems = roomItems(MOCK_SIMULATOR_ITEMS, workplaceRoom.id);
  const work = resolveAvatarPlacement({
    name: 'Working', iconType: 'work', applianceIds: ['f2-workplace-study'], avatarWalks: true,
  }, workplaceRoom, workplaceItems);
  assert.equal(work.interactionItemId, 'f2-workplace-study');
  assert.equal(work.pose, 'stand');

  const charging = resolveAvatarPlacement({
    name: 'Charging phone', iconType: 'work', applianceIds: ['f2-workplace-study'], avatarWalks: false,
  }, workplaceRoom, workplaceItems);
  assert.equal(charging.interactionItemId, null);
  assert.deepEqual(charging.activeApplianceIds, ['f2-workplace-study']);

  const bedroom = rooms.find((room) => room.id === 'f2-A');
  const bedroomItems = roomItems(MOCK_SIMULATOR_ITEMS, bedroom.id);
  const sleep = resolveAvatarPlacement({
    name: 'Sleep', iconType: 'sleep', applianceIds: [], avatarWalks: true,
  }, bedroom, bedroomItems);
  assert.equal(sleep.interactionItemId, 'f2-bed-master');
  assert.equal(sleep.pose, 'stand');
});

test('workplace room inference uses data and its combined sprite is the only desk item', () => {
  const room = createDefaultRooms(false).find((candidate) => candidate.id === 'f2-B');
  const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
  assert.equal(room.type, 'bedroom');
  assert.equal(getRoomTemplateId(room, items), 'workplace');
  assert.equal(items.filter((item) => item.type === 'workplace').length, 1);
  assert.equal(items.some((item) => item.category === 'Furniture' && /desk/i.test(item.name)), false);
});

test('1F bottom-middle stays dark and empty', () => {
  const room = createDefaultRooms(false).find((candidate) => candidate.floor === 1 && candidate.slot === 'D');
  assert.equal(room.isSetUp, false);
  assert.equal(roomItems(MOCK_SIMULATOR_ITEMS, room.id).length, 0);
});

test('work suggestion flags remain true, true, false', () => {
  assert.deepEqual(WORK_ROUTINE_SUGGESTIONS.map(({ name, avatarWalks }) => ({ name, avatarWalks })), [
    { name: 'Working', avatarWalks: true },
    { name: 'Studying', avatarWalks: true },
    { name: 'Charging phone', avatarWalks: false },
  ]);
});

test('the avatar implementation has one target and no path or idle roaming code', () => {
  const simulator = readFileSync(resolve(FRONTEND_ROOT, 'src/app/(tabs)/simulator.tsx'), 'utf8');
  const engine = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/logic/SimulationEngine.ts'), 'utf8');
  const floorPlan = readFileSync(resolve(FRONTEND_ROOT, 'src/features/simulator/components/FloorPlan.tsx'), 'utf8');
  const source = `${simulator}\n${engine}\n${floorPlan}`;
  assert.match(simulator, /avatarTargetRef/);
  assert.doesNotMatch(source, /waypoint|walkPath|idle wandering|\bwander\b/i);
});

test('default and expanded fixture counts are stable', () => {
  assert.equal(MOCK_SIMULATOR_ITEMS.length, 25);
  assert.equal(MOCK_SIMULATOR_ITEMS_ALL.length, 29);
});
