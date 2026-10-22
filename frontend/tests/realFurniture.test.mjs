import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('furniture schema migration is rerunnable and applies forced RLS', () => {
  const sql = read('supabase/migrations/20261023000000_real_furniture_schema.sql');
  assert.match(sql, /drop constraint if exists rooms_type_check/i);
  assert.match(sql, /add column if not exists facing/i);
  assert.match(sql, /create table if not exists public\.furniture_types/i);
  assert.match(sql, /create table if not exists public\.furniture_items/i);
  assert.match(sql, /alter table public\.furniture_items force row level security/i);
  for (const operation of ['select', 'insert', 'update', 'delete']) {
    assert.match(sql, new RegExp(`furniture_items_${operation}_household`, 'i'));
  }
  assert.match(sql, /household_id = \(select private\.current_household_id\(\)\)/i);
  assert.match(sql, /revoke all on public\.furniture_types, public\.furniture_items from anon/i);
});

test('reference migration is idempotent and has the exact tray catalog', () => {
  const sql = read('supabase/migrations/20261023000001_real_furniture_reference_data.sql');
  assert.match(sql, /on conflict \(id\) do update set/gi);
  for (const id of ['bed','sofa','table','toilet','sink']) assert.match(sql, new RegExp(`'${id}'`));
  for (const id of ['router','washing_machine','light_bulb']) assert.match(sql, new RegExp(`'${id}'`));
  assert.match(sql, /'light_bulb'[\s\S]*true, 10, true/);
});

test('furniture service performs RLS-scoped fetch and complete CRUD', () => {
  const service = read('frontend/src/lib/services/furnitureService.ts');
  assert.match(service, /\.from\('furniture_items'\)\.select\('\*'\)\.eq\('household_id', householdId\)/);
  assert.match(service, /\.from\('furniture_types'\)\.select\('\*'\)/);
  assert.match(service, /export async function createFurniture/);
  assert.match(service, /export async function updateFurniturePosition/);
  assert.match(service, /export async function deleteFurniture/);
  const screen = read('frontend/src/app/(tabs)/simulator.tsx');
  assert.match(screen, /setItems\(furnishEmptyRooms\(data\.appliances/);
  assert.match(screen, /updateFurniturePosition/);
  assert.match(screen, /deleteFurniture/);
  assert.match(screen, /furnitureTypes=\{furnitureTypes\}/);
});

test('demo seed contains the exact persisted item counts and custom-name-safe room upsert', () => {
  const seed = read('supabase/seed.sql');
  const applianceSection = seed.slice(seed.indexOf('insert into public.appliances'), seed.indexOf('delete from public.furniture_items'));
  const furnitureSection = seed.slice(seed.indexOf('insert into public.furniture_items'), seed.indexOf('-- 4.8.'));
  assert.equal((applianceSection.match(/d3b00000-0000-0000-0004-/g) ?? []).length, 23);
  assert.equal((furnitureSection.match(/d3b00000-0000-0000-0008-/g) ?? []).length, 9);
  assert.match(seed, /on conflict \(id\) do update set type=excluded\.type, is_set_up=excluded\.is_set_up;/);
  assert.doesNotMatch(seed, /on conflict \(id\) do update set type=excluded\.type, name=excluded\.name/);
});

test('local refurnish script is guarded, dry-runnable, demo-only, and idempotent', () => {
  const script = read('scripts/refurnish_local_demo.mjs');
  assert.match(script, /getTestCredentials/);
  assert.match(script, /--dry-run/);
  assert.match(script, /--apply/);
  assert.match(script, /DEMO_EMAIL = 'meiling\.tan@example\.com'/);
  assert.match(script, /DEMO_HOUSEHOLD_ID = 'd3b00000-0000-0000-0000-000000000002'/);
  assert.match(script, /appliances\?household_id=eq\.\$\{H\}/);
  assert.match(script, /furniture_items\?household_id=eq\.\$\{H\}/);
  assert.match(script, /skippedHouseholds/);
});
