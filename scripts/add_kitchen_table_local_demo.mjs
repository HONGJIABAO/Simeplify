#!/usr/bin/env node
/** Add the explicitly requested kitchen table to the local demo household. */
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

const profileRows = await rest(`profiles?email=eq.${encodeURIComponent(DEMO_EMAIL)}&select=email,household_id`);
if (profileRows.length !== 1 || profileRows[0].household_id !== DEMO_HOUSEHOLD_ID) {
  throw new Error('Demo household identity did not match; no data was changed.');
}

const rooms = await rest(`rooms?household_id=eq.${DEMO_HOUSEHOLD_ID}&floor=eq.1&slot=eq.B&select=id,name,floor,slot`);
if (rooms.length !== 1) throw new Error('First-floor kitchen was not found; no data was changed.');
const room = rooms[0];
const existingRows = await rest(
  `furniture_items?household_id=eq.${DEMO_HOUSEHOLD_ID}&room_id=eq.${room.id}&type=eq.table&role=eq.kitchen%20table&select=id,room_id,type,role,position_x,position_y,facing`
);
if (existingRows.length > 1) throw new Error('More than one kitchen table exists; no data was changed.');

// f1-B slot: local x=.50, bottom=.60 -> global (0.79, 0.286).
const desired = { room_id: room.id, type: 'table', role: 'kitchen table', facing: 'front', position_x: 0.79, position_y: 0.286 };
const before = existingRows[0] ?? null;
const needsUpdate = Boolean(before && (
  Number(before.position_x) !== desired.position_x
  || Number(before.position_y) !== desired.position_y
  || before.facing !== desired.facing
));
console.log(JSON.stringify({
  mode: isDryRun ? 'dry-run' : 'apply', database: apiUrl, demo: DEMO_EMAIL,
  item: { before, after: before ? { ...before, ...desired } : desired, inserted: !before, changed: !before || needsUpdate },
}, null, 2));

if (isDryRun) process.exit(0);

if (before && needsUpdate) {
  await rest(`furniture_items?id=eq.${before.id}&household_id=eq.${DEMO_HOUSEHOLD_ID}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ position_x: desired.position_x, position_y: desired.position_y, facing: desired.facing }),
  });
} else if (!before) {
  await rest('furniture_items', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ household_id: DEMO_HOUSEHOLD_ID, ...desired }),
  });
}
const afterRows = await rest(
  `furniture_items?household_id=eq.${DEMO_HOUSEHOLD_ID}&room_id=eq.${room.id}&type=eq.table&role=eq.kitchen%20table&select=id,position_x,position_y,facing`
);
if (afterRows.length !== 1) throw new Error('Kitchen table insert did not produce exactly one row.');
if (Number(afterRows[0].position_x) !== desired.position_x || Number(afterRows[0].position_y) !== desired.position_y) {
  throw new Error('Kitchen table position did not match the requested layout.');
}
console.log(JSON.stringify({ applied: true, furnitureCount: (await rest(`furniture_items?household_id=eq.${DEMO_HOUSEHOLD_ID}&select=id`)).length }, null, 2));
