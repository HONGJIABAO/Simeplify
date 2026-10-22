#!/usr/bin/env node
/** SIM-05/SIM-06 — safely replace only the local Mei Ling demo layout. */
import { getTestCredentials } from '../supabase/tests/testSafety.mjs';

const DEMO_EMAIL = 'meiling.tan@example.com';
const DEMO_HOUSEHOLD_ID = 'd3b00000-0000-0000-0000-000000000002';
const isDryRun = process.argv.includes('--dry-run');
const isApply = process.argv.includes('--apply');
if (isDryRun === isApply) {
  throw new Error('Choose exactly one mode: --dry-run or --apply');
}

const { apiUrl, serviceRoleKey } = getTestCredentials();
const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
};

async function rest(path, options = {}) {
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, { headers: { ...headers, ...options.headers }, ...options });
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

let profiles;
try {
  profiles = await rest(`profiles?email=eq.${encodeURIComponent(DEMO_EMAIL)}&select=name,email,household_id`);
} catch (error) {
  if (!isDryRun) throw error;
  console.log(JSON.stringify({
    mode: 'dry-run',
    noChangesApplied: true,
    database: 'local Supabase unavailable',
    demo: DEMO_EMAIL,
    householdId: DEMO_HOUSEHOLD_ID,
    planned: { appliances: 23, furniture: 9 },
    roomTypeChanges: { '1C': 'laundry_room', '2C': 'work_room', '1D': 'bathroom', '2D': 'bathroom' },
    note: 'Start local Supabase to compare existing rows and run --apply.',
  }, null, 2));
  process.exit(0);
}
if (profiles.length !== 1 || profiles[0].household_id !== DEMO_HOUSEHOLD_ID) {
  throw new Error('Demo household identity did not match; no data was changed.');
}

const rooms = await rest(`rooms?household_id=eq.${DEMO_HOUSEHOLD_ID}&select=id,floor,slot,name,type,is_set_up&order=floor,slot`);
const roomByKey = new Map(rooms.map((room) => [`${room.floor}${room.slot}`, room]));
for (const key of ['1A','1B','1C','1D','2A','2B','2C','2D']) {
  if (!roomByKey.has(key)) throw new Error(`Demo room ${key} is missing; no data was changed.`);
}

const roomTypes = { '1A':'living_room','1B':'kitchen','1C':'laundry_room','1D':'bathroom',
  '2A':'bedroom','2B':'bedroom','2C':'work_room','2D':'bathroom' };
const rid = (key) => roomByKey.get(key).id;
const H = DEMO_HOUSEHOLD_ID;
const appliance = (n, room, type, brand, model, wattage, stars, x, y, facing='front') => ({
  id:`d3b00000-0000-0000-0004-${String(n).padStart(12,'0')}`, household_id:H, room_id:rid(room),
  type, brand, model, wattage, star_rating:stars, quantity:1, position_x:x, position_y:y, facing,
});
const furniture = (n, room, type, role, x, y, facing='front') => ({
  id:`d3b00000-0000-0000-0008-${String(n).padStart(12,'0')}`, household_id:H, room_id:rid(room),
  type, role, position_x:x, position_y:y, facing,
});

const appliances = [
  appliance(1,'1A','air_conditioner','Daikin','Inverter FTKV25N',1000,5,.0928,.0605),
  appliance(2,'1A','tv','Sony','Bravia 4K 55',90,5,.2494,.1155),
  appliance(3,'1A','router','TP-Link','Archer AX55 Wi-Fi 6',15,null,.4988,.0660),
  appliance(4,'1A','light_bulb','Philips','Ceiling LED',9,5,.2900,.4840),
  appliance(5,'1A','fan','KDK','Standing Fan',55,4,.0812,.4565),
  appliance(6,'1B','refrigerator','Hitachi','Inverter Big2',150,5,.6724,.1705),
  appliance(7,'1B','light_bulb','Philips','Downlight LED',9,5,.7900,.3630),
  appliance(8,'1B','air_conditioner','Daikin','Back Wall AC',1000,5,.9076,.0605),
  appliance(9,'1C','washing_machine','Panasonic','Top Load',500,4,.1200,.6895),
  appliance(10,'1C','light_bulb','Philips','Ceiling LED',9,5,.3250,.7840),
  appliance(11,'1D','water_heater','Joven','Instant Rainshower',3500,4,.7700,.5748),
  appliance(12,'1D','light_bulb','Philips','Ceiling LED',9,5,.6872,.6850),
  appliance(13,'2A','lights','Philips','Bedside Lamp',9,5,.2494,.1980),
  appliance(14,'2A','light_bulb','Philips','Ceiling LED',9,5,.3132,.3740),
  appliance(15,'2A','air_conditioner','Panasonic','Back Wall AC',1000,5,.4756,.0605),
  appliance(16,'2B','lights','Philips','Bedside Lamp',9,5,.8068,.2255),
  appliance(17,'2B','fan','KDK','Standing Fan',55,4,.9412,.4235),
  appliance(18,'2B','light_bulb','Philips','Ceiling LED',9,5,.7900,.3575),
  appliance(19,'2C','workplace','Dell','Laptop & phone',80,null,.1250,.7030),
  appliance(20,'2C','light_bulb','Philips','Ceiling LED',9,5,.2600,.7840),
  appliance(21,'2C','air_conditioner','Daikin','Back Wall AC',1000,5,.3900,.5995),
  appliance(22,'2D','water_heater','Panasonic','Home Shower',3500,5,.6440,.5748),
  appliance(23,'2D','light_bulb','Philips','Ceiling LED',9,5,.6980,.6850),
];

const furnitureItems = [
  furniture(1,'1A','table','coffee table',.2784,.2695), furniture(2,'1A','sofa',null,.2784,.4015,'back'),
  furniture(3,'1B','sink','kitchen sink',.7900,.2475), furniture(4,'1D','toilet',null,.5792,.8965),
  furniture(5,'1D','sink',null,.7880,.9010), furniture(6,'2A','bed',null,.1392,.1870),
  furniture(7,'2B','bed',null,.7312,.2090), furniture(8,'2D','toilet',null,.5936,.8965),
  furniture(9,'2D','sink',null,.7952,.9010),
];

const [currentAppliances, currentFurniture, allProfiles] = await Promise.all([
  rest(`appliances?household_id=eq.${H}&select=id,type,room_id,position_x,position_y,facing`),
  rest(`furniture_items?household_id=eq.${H}&select=id,type,room_id,position_x,position_y,facing`),
  rest('profiles?select=email,household_id'),
]);
console.log(JSON.stringify({ mode:isDryRun?'dry-run':'apply', demo:DEMO_EMAIL, householdId:H,
  preserveRoomNames:rooms.map(({floor,slot,name})=>({floor,slot,name})),
  current:{appliances:currentAppliances.length,furniture:currentFurniture.length},
  planned:{appliances:appliances.length,furniture:furnitureItems.length},
  skippedHouseholds:allProfiles.filter((profile)=>profile.household_id && profile.household_id!==H).length }, null, 2));

if (isDryRun) process.exit(0);

for (const [key, type] of Object.entries(roomTypes)) {
  await rest(`rooms?id=eq.${rid(key)}&household_id=eq.${H}`, { method:'PATCH', body:JSON.stringify({type,is_set_up:true}) });
}
await rest(`appliances?household_id=eq.${H}`, { method:'DELETE' });
await rest('appliances', { method:'POST', headers:{Prefer:'return=minimal'}, body:JSON.stringify(appliances) });
await rest(`furniture_items?household_id=eq.${H}`, { method:'DELETE' });
await rest('furniture_items', { method:'POST', headers:{Prefer:'return=minimal'}, body:JSON.stringify(furnitureItems) });
console.log(`Applied ${appliances.length} appliances and ${furnitureItems.length} furniture items to ${DEMO_EMAIL}; other households were skipped.`);
