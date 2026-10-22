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
  getPlacementLayer,
  getRoomTemplateId,
  INNER_FLOOR_RECT,
  isFootprintInside,
  ROOM_SLOTS,
  tidyFloorItems,
  useSpot,
} from '../src/features/simulator/logic/furnishedLayout.ts';
import { FLOOR_ITEM_SCALE, FLOOR_SPRITE_BASE_SIZE, getFloorSpriteSizes } from '../src/features/simulator/logic/spriteSizing.ts';
import { getPlanItemLabel, PLAN_ITEM_LABEL_DURATION_MS } from '../src/features/simulator/logic/itemLabel.ts';
import { WORKPLACE_DEFAULT_WATTS } from '../src/features/simulator/logic/applianceConstants.ts';
import {
  MOCK_SIMULATOR_ITEMS,
  MOCK_SIMULATOR_ITEMS_ALL,
} from '../src/features/simulator/logic/mockHomeData.ts';
import { createDefaultRooms } from '../src/features/simulator/logic/roomData.ts';
import { resolveAvatarPlacement } from '../src/features/simulator/logic/avatarPlace.ts';
import { DEFAULT_ROUTINE_BLOCKS, WORK_ROUTINE_SUGGESTIONS } from '../src/features/simulator/logic/myDayLogic.ts';
import { shouldFollowAvatarFloor } from '../src/features/simulator/logic/floorFollow.ts';
import { findFloorWalkPath, findHomeWalkRoute, isWalkSegmentValid } from '../src/features/simulator/logic/walkGraph.ts';
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

test('floor-plan item art uses one uniform 2.2x scale while the avatar stays separate', () => {
  const sizes = getFloorSpriteSizes(350);
  assert.equal(FLOOR_ITEM_SCALE, 2.2);
  assert.equal(sizes.item, FLOOR_SPRITE_BASE_SIZE.item * 2.2);
  assert.notEqual(sizes.item, sizes.avatar);
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
  assert.equal(ROOM_SLOTS['f1-A'].slots.find((slot) => slot.type === 'tv').x, 0.45);
  assert.equal(ROOM_SLOTS['f1-A'].slots.filter((slot) => slot.type === 'table').length, 3);
  assert.deepEqual(ROOM_SLOTS['f1-A'].slots.filter((slot) => slot.type === 'table').map((slot) => slot.role),
    ['coffee table', 'side table left', 'side table right']);
  assert.equal(ROOM_SLOTS['f1-B'].slots.find((slot) => slot.type === 'refrigerator').x, 0.21);
  assert.equal(ROOM_SLOTS['f1-C'].slots.find((slot) => slot.type === 'washing_machine').x, 0.25);
  assert.equal(ROOM_SLOTS['f1-D'].slots.find((slot) => slot.type === 'water_heater').x, 0.74);
  assert.equal(ROOM_SLOTS['f2-C'].slots.find((slot) => slot.type === 'workplace').x, 0.26);
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
      assert.ok(isFootprintInside(footprint, INNER_FLOOR_RECT), `${item.id} must be inside the inner floor`);
      assert.equal(doors.some((door) => footprintOverlapArea(footprint, door) > 0), false, `${item.id} blocks a doorway`);
    }
    for (const entry of entries) {
      assert.equal(lanes.some((lane) => footprintOverlapArea(entry.footprint, lane) > 0), false, `${entry.item.id} blocks a standing lane`);
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
  assert.equal(sofa.rotation, 180);
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
    applianceIds: ['f1-tv-living', 'f1-ac-living'], avatarWalks: true,
  }, living, livingItems);
  assert.equal(tv.interactionItemId, 'f1-sofa-living');
  assert.deepEqual(new Set(tv.activeApplianceIds), new Set(['f1-tv-living', 'f1-ac-living']));
  assert.equal(tv.pose, 'stand');

  const bathroom = rooms.find((room) => room.id === 'f1-D');
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

test('room-specific layout uses data and its combined Workplace sprite is the only desk item', () => {
  const room = createDefaultRooms(false).find((candidate) => candidate.id === 'f2-B');
  const items = roomItems(MOCK_SIMULATOR_ITEMS, room.id);
  assert.equal(room.type, 'bedroom');
  assert.equal(getRoomTemplateId(room, items), 'f2-B');
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
  assert.equal(MOCK_SIMULATOR_ITEMS.length, 36);
  assert.equal(MOCK_SIMULATOR_ITEMS_ALL.length, 36);
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

test('all air conditioners use their own room back-wall slot', () => {
  const rooms = createDefaultRooms(false);
  for (const room of rooms) {
    const slots = ROOM_SLOTS[getRoomTemplateId(room)].slots.filter((slot) => slot.type === 'air_conditioner');
    for (const slot of slots) assert.ok(slot.y <= 0.12, `${room.id} air conditioner must be on the back wall`);
    for (const item of roomItems(MOCK_SIMULATOR_ITEMS, room.id).filter((candidate) => candidate.type === 'air_conditioner')) {
      const slot = ROOM_SLOTS[getRoomTemplateId(room)].slots.find((candidate) => candidate.type === item.type);
      assert.ok(slot && slot.y <= 0.12, `${item.id} must use its own room slot`);
    }
  }
});

test('renamed gray rooms keep the bathroom type', () => {
  const rooms = createDefaultRooms(false);
  const laundry = rooms.find((room) => room.id === 'f1-C');
  const work = rooms.find((room) => room.id === 'f2-C');
  assert.deepEqual({ name: laundry.name, type: laundry.type }, { name: 'Laundry Room', type: 'bathroom' });
  assert.deepEqual({ name: work.name, type: work.type }, { name: 'Work Room', type: 'bathroom' });
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

test('Tidy up reproduces the room-specific slot positions and sofa rotation', () => {
  const rooms = createDefaultRooms(false);
  const messy = MOCK_SIMULATOR_ITEMS.map((item) => ({ ...item, posX: 0.5, posY: 0.5, rotation: 0 }));
  const floor1 = tidyFloorItems(messy, rooms, 1).items;
  const tidied = tidyFloorItems(floor1, rooms, 2).items;
  for (const expected of MOCK_SIMULATOR_ITEMS) {
    const actual = tidied.find((item) => item.id === expected.id);
    assert.equal(actual.posX, expected.posX, `${expected.id} x`);
    assert.equal(actual.posY, expected.posY, `${expected.id} y`);
  }
  assert.equal(tidied.find((item) => item.id === 'f1-sofa-living').rotation, 180);
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

