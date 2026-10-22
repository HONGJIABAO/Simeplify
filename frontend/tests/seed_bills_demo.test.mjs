import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Seed Bills: Exactly 3 sample bills for demo household with repeatable idempotence', () => {
  const seedPath = path.resolve(__dirname, '../../supabase/seed.sql');
  assert.ok(fs.existsSync(seedPath), 'seed.sql must exist at supabase/seed.sql');

  const content = fs.readFileSync(seedPath, 'utf8');

  // 1. Locate section 4.9 Bills History
  const billsSectionMatch = content.match(/-- 4\.9\. Bills History[\s\S]*?insert into public\.bills[\s\S]*?on conflict \((id|household_id[\s\S]*?)\) do update set[\s\S]*?;/i);
  assert.ok(billsSectionMatch, 'Expected section 4.9 inserting into public.bills with ON CONFLICT');

  const billsBlock = billsSectionMatch[0];

  // 2. Household verification: must target the demo household
  const DEMO_HOUSEHOLD_ID = 'd3b00000-0000-0000-0000-000000000002';
  const householdMatches = billsBlock.match(new RegExp(DEMO_HOUSEHOLD_ID, 'g'));
  assert.ok(householdMatches && householdMatches.length >= 3, 'Bills must be attached to the demo household');

  // 3. Count exact sample bill value tuples in the INSERT statement
  const valuesMatch = billsBlock.match(/values\s*([\s\S]*?)\s*on conflict/i);
  assert.ok(valuesMatch, 'Expected values clause in bills insert');
  const valuesText = valuesMatch[1];
  const billUuidMatches = valuesText.match(/'d3b00000-0000-0000-0006-[0-9a-f]{12}'/gi);
  assert.ok(billUuidMatches, 'Expected fixed UUIDs for demo bills');
  assert.equal(billUuidMatches.length, 3, `Expected exactly 3 sample bills in seed, found ${billUuidMatches.length}`);

  // 4. Consecutive months: 2026-08-01, 2026-09-01, 2026-10-01
  assert.ok(billsBlock.includes('2026-08-01'), 'Expected August 2026 bill');
  assert.ok(billsBlock.includes('2026-09-01'), 'Expected September 2026 bill');
  assert.ok(billsBlock.includes('2026-10-01'), 'Expected October 2026 bill');

  // 5. Types: Electricity (TNB) and Water (Air Selangor)
  assert.ok(billsBlock.includes("'electricity'"), 'Expected electricity bill type');
  assert.ok(billsBlock.includes("'water'"), 'Expected water bill type');

  // 6. File path: blank string, no fabricated files
  const emptyFilePathMatches = billsBlock.match(/,\s*'',\s*'(electricity|water)'/g);
  assert.ok(emptyFilePathMatches && emptyFilePathMatches.length === 3, 'All 3 bills must have blank file_path without fabricated files');

  // 7. Idempotence & Conflict handling:
  // Must use ON CONFLICT so running the seed repeatedly does NOT turn 3 bills into 6
  assert.ok(
    /on conflict \((id|household_id[^\)]*)\) do update set/i.test(billsBlock),
    'Expected ON CONFLICT DO UPDATE clause to ensure repeated seed execution is idempotent'
  );

  // 8. Simulator estimate calibration check
  // October bill must have estimate_kwh of 380 and usage of 350 to display "Actual is 30 kWh lower"
  assert.ok(billsBlock.includes('"estimate_kwh":380'), 'October bill must calibrate against 380 kWh estimate');
  assert.ok(billsBlock.includes('350'), 'October bill actual usage must be 350 kWh');
  assert.ok(billsBlock.includes('"mom_change_pct":-7.9'), 'October bill must record -7.9% MoM change');
});
