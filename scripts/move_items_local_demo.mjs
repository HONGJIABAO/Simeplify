#!/usr/bin/env node
/**
 * Move only the explicitly requested local demo items.
 *
 * This script never inserts or deletes rows. It matches by room + type, and
 * by furniture role where a role is available. The shared safety helper
 * refuses every non-local Supabase URL before any request is made.
 */
import { getTestCredentials } from '../supabase/tests/testSafety.mjs';

const DEMO_EMAIL = 'meiling.tan@example.com';
const DEMO_HOUSEHOLD_ID = 'd3b00000-0000-0000-0000-000000000002';
const isDryRun = process.argv.includes('--dry-run');
const isApply = process.argv.includes('--apply');
if (isDryRun === isApply) throw new Error('Choose exactly one mode: --dry-run or --apply');

const { apiUrl, serviceRoleKey } = getTestCredentials();
const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
};

async function rest(path, options = {}) {
  const { headers: optionHeaders, ...requestOptions } = options;
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
    ...requestOptions,
    headers: { ...headers, ...optionHeaders },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const ROOM_RECTS = {
  A: { x: 0, y: 0, width: 0.58, height: 0.55 },
  B: { x: 0.58, y: 0, width: 0.42, height: 0.55 },
  C: { x: 0, y: 0.55, width: 0.50, height: 0.45 },
  D: { x: 0.50, y: 0.55, width: 0.36, height: 0.45 },
};

const INNER = { x: 0.06, y: 0.20, width: 0.88, height: 0.72 };
const PLAN = 390;
const FLOOR_ITEM_SIZE = 24 * 2.2 * Math.min(1.25, PLAN / 350);
const CONTENT = {
  refrigerator: [162, 279], washing_machine: [205, 256], water_heater: [202, 235],
  bed: [227, 164], lights: [150, 201], sink: [133, 200],
};
const visible = (type) => {
  const [width, height] = CONTENT[type];
  const picture = FLOOR_ITEM_SIZE * (type === 'lights' ? 0.5 : 1);
  const scale = Math.min(picture / width, picture / height);
  return { picture, width: width * scale, height: height * scale };
};
const globalRoom = (slot) => ROOM_RECTS[slot];
const leanBack = (slot, requestedX, type) => {
  const rect = globalRoom(slot); const size = visible(type);
  const left = (rect.x + INNER.x * rect.width) * PLAN;
  const right = (rect.x + (INNER.x + INNER.width) * rect.width) * PLAN;
  const wall = (rect.y + INNER.y * rect.height) * PLAN;
  const gap = rect.height * PLAN * 0.01;
  const centerX = Math.max(left + size.width / 2, Math.min(right - size.width / 2, (rect.x + requestedX * rect.width) * PLAN));
  return { x: centerX / PLAN, y: (wall + gap + size.height / 2) / PLAN };
};
const hangBack = (slot, requestedX, type) => {
  const rect = globalRoom(slot); const size = visible(type);
  const left = (rect.x + INNER.x * rect.width) * PLAN;
  const right = (rect.x + (INNER.x + INNER.width) * rect.width) * PLAN;
  const wall = (rect.y + INNER.y * rect.height) * PLAN;
  const bottom = (rect.y + (INNER.y + INNER.height) * rect.height) * PLAN;
  const gap = rect.height * PLAN * 0.01;
  const scale = Math.max(0.8, Math.min(1, (bottom - wall - gap) / size.height));
  const defaultCenter = Math.max(left + size.width * scale / 2, Math.min(right - size.width * scale / 2, (rect.x + requestedX * rect.width) * PLAN));
  // Both D rooms have a left-side doorway through the middle; keep the wall
  // heater's painted box just to its right while moving it the least amount.
  const doorwaySafe = slot === 'D'
    ? (rect.x + (0.16 + (size.width * scale / (rect.width * PLAN)) / 2) * rect.width) * PLAN
    : defaultCenter;
  const centerX = Math.max(defaultCenter, doorwaySafe);
  return { x: centerX / PLAN, y: (wall + gap + size.height * scale / 2) / PLAN };
};
const leanRight = (slot, top, type) => {
  const rect = globalRoom(slot); const size = visible(type);
  const right = (rect.x + (INNER.x + INNER.width) * rect.width) * PLAN;
  const gap = rect.width * PLAN * 0.01;
  return { x: (right - gap - size.width / 2) / PLAN, y: ((rect.y + top * rect.height) * PLAN + size.height / 2) / PLAN };
};
const bedside = (slot, occurrence) => {
  const rect = globalRoom(slot); const bed = visible('bed'); const lamp = visible('lights');
  const bedPoint = leanBack(slot, 0.24, 'bed'); const bedX = bedPoint.x * PLAN;
  const right = (rect.x + (INNER.x + INNER.width) * rect.width) * PLAN;
  const left = (rect.x + INNER.x * rect.width) * PLAN;
  const gap = rect.width * PLAN * 0.02;
  const rightCenter = bedX + bed.width / 2 + gap + lamp.width / 2 + occurrence * (lamp.width + gap);
  const leftCenter = bedX - bed.width / 2 - gap - lamp.width / 2 - occurrence * (lamp.width + gap);
  const centerX = rightCenter + lamp.width / 2 <= right ? rightCenter : leftCenter;
  const bedBottom = bedPoint.y * PLAN + bed.height / 2;
  return { x: centerX / PLAN, y: (bedBottom - lamp.height / 2) / PLAN };
};

const targets = [
  { floor: 1, slot: 'B', table: 'appliances', type: 'refrigerator', x: 0.22, kind: 'lean_back', facing: 'front' },
  { floor: 1, slot: 'B', table: 'furniture', type: 'sink', role: 'kitchen sink', top: 0.30, kind: 'lean_right', facing: 'front' },
  { floor: 1, slot: 'C', table: 'appliances', type: 'washing_machine', x: 0.18, kind: 'lean_back', facing: 'front' },
  { floor: 1, slot: 'D', table: 'appliances', type: 'water_heater', x: 0.20, kind: 'hang_back', facing: 'front' },
  { floor: 2, slot: 'A', table: 'furniture', type: 'bed', x: 0.24, kind: 'lean_back', facing: 'front' },
  { floor: 2, slot: 'A', table: 'appliances', type: 'lights', ordinal: 0, kind: 'bedside', facing: 'front' },
  { floor: 2, slot: 'B', table: 'furniture', type: 'bed', x: 0.24, kind: 'lean_back', facing: 'front' },
  { floor: 2, slot: 'B', table: 'appliances', type: 'lights', ordinal: 0, kind: 'bedside', facing: 'front' },
  { floor: 2, slot: 'D', table: 'appliances', type: 'water_heater', x: 0.20, kind: 'hang_back', facing: 'front' },
];

const profileRows = await rest(`profiles?email=eq.${encodeURIComponent(DEMO_EMAIL)}&select=email,household_id`);
if (profileRows.length !== 1 || profileRows[0].household_id !== DEMO_HOUSEHOLD_ID) {
  throw new Error('Demo household identity did not match; no data was changed.');
}

const rooms = await rest(`rooms?household_id=eq.${DEMO_HOUSEHOLD_ID}&select=id,floor,slot,name,is_set_up&order=floor,slot`);
const roomByKey = new Map(rooms.map((room) => [`${room.floor}${room.slot}`, room]));
for (const target of targets) {
  const room = roomByKey.get(`${target.floor}${target.slot}`);
  if (!room) throw new Error(`Room ${target.floor}${target.slot} is missing; no data was changed.`);
}

const [appliances, furniture] = await Promise.all([
  rest(`appliances?household_id=eq.${DEMO_HOUSEHOLD_ID}&select=id,room_id,type,position_x,position_y,facing`),
  rest(`furniture_items?household_id=eq.${DEMO_HOUSEHOLD_ID}&select=id,room_id,type,role,position_x,position_y,facing`),
]);

function findMatch(target) {
  const room = roomByKey.get(`${target.floor}${target.slot}`);
  const rows = (target.table === 'furniture' ? furniture : appliances)
    .filter((row) => row.room_id === room.id && row.type === target.type)
    .filter((row) => target.table !== 'furniture' || (row.role ?? null) === (target.role ?? null))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const ordinal = target.ordinal ?? 0;
  if (!rows[ordinal]) throw new Error(`Could not match ${target.floor}${target.slot} ${target.table} ${target.type}${target.role ? ` (${target.role})` : ''}; no data was changed.`);
  return rows[ordinal];
}

const plan = targets.map((target) => {
  const row = findMatch(target);
  const next = target.kind === 'lean_back' ? leanBack(target.slot, target.x, target.type)
    : target.kind === 'hang_back' ? hangBack(target.slot, target.x, target.type)
      : target.kind === 'lean_right' ? leanRight(target.slot, target.top, target.type)
        : bedside(target.slot, target.ordinal ?? 0);
  next.x = Number(next.x.toFixed(4));
  next.y = Number(next.y.toFixed(4));
  return {
    target,
    row,
    next,
    changed: Number(row.position_x) !== next.x || Number(row.position_y) !== next.y,
  };
});

console.log(JSON.stringify({
  mode: isDryRun ? 'dry-run' : 'apply',
  database: apiUrl,
  demo: DEMO_EMAIL,
  counts: { appliances: appliances.length, furniture: furniture.length },
  items: plan.map(({ target, row, next, changed }) => ({
    room: `${target.floor}${target.slot}`,
    table: target.table,
    type: target.type,
    role: target.role ?? null,
    before: { x: Number(row.position_x), y: Number(row.position_y), facing: row.facing },
    after: { x: next.x, y: next.y, facing: row.facing },
    changed,
  })),
}, null, 2));

if (isDryRun) process.exit(0);

for (const { target, row, next } of plan) {
  const table = target.table;
  const path = table === 'furniture'
    ? `furniture_items?id=eq.${row.id}&household_id=eq.${DEMO_HOUSEHOLD_ID}`
    : `appliances?id=eq.${row.id}&household_id=eq.${DEMO_HOUSEHOLD_ID}`;
  await rest(path, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ position_x: next.x, position_y: next.y }),
  });
}

const [afterAppliances, afterFurniture] = await Promise.all([
  rest(`appliances?household_id=eq.${DEMO_HOUSEHOLD_ID}&select=id`),
  rest(`furniture_items?household_id=eq.${DEMO_HOUSEHOLD_ID}&select=id`),
]);
if (afterAppliances.length !== appliances.length || afterFurniture.length !== furniture.length) {
  throw new Error('Item counts changed unexpectedly after the position-only update.');
}
console.log(JSON.stringify({ applied: true, counts: { appliances: afterAppliances.length, furniture: afterFurniture.length } }, null, 2));
