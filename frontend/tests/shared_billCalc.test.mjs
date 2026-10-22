// frontend/tests/shared_billCalc.test.mjs
// Fails if supabase/functions/_shared/billCalc.ts and frontend/src/lib/shared/billCalc.ts differ.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('canonical and frontend billCalc.ts must be identical', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const backendFile = path.resolve(rootDir, 'supabase/functions/_shared/billCalc.ts');
  const frontendFile = path.resolve(rootDir, 'frontend/src/lib/shared/billCalc.ts');

  assert.ok(fs.existsSync(backendFile), `Backend file missing: ${backendFile}`);
  assert.ok(fs.existsSync(frontendFile), `Frontend file missing: ${frontendFile}`);

  const backendContent = fs.readFileSync(backendFile, 'utf8').trim();
  const frontendContent = fs.readFileSync(frontendFile, 'utf8').trim();

  // Remove comment headers (first 4 lines) before comparing core code
  const stripHeader = (str) =>
    str
      .split('\n')
      .filter((line) => !line.startsWith('//'))
      .join('\n')
      .trim();

  assert.equal(
    stripHeader(backendContent),
    stripHeader(frontendContent),
    'supabase/functions/_shared/billCalc.ts and frontend/src/lib/shared/billCalc.ts differ! Run node frontend/scripts/sync-shared.mjs'
  );
});
