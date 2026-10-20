// frontend/scripts/sync-shared.mjs
// Copies canonical shared modules from supabase/functions/_shared to frontend/src/lib/shared

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');
const srcFile = path.resolve(rootDir, 'supabase/functions/_shared/billCalc.ts');
const destFile = path.resolve(rootDir, 'frontend/src/lib/shared/billCalc.ts');

if (!fs.existsSync(srcFile)) {
  console.error(`Source file not found: ${srcFile}`);
  process.exit(1);
}

const content = fs.readFileSync(srcFile, 'utf8');
fs.mkdirSync(path.dirname(destFile), { recursive: true });
fs.writeFileSync(destFile, content, 'utf8');
console.log(`Synced: ${srcFile} -> ${destFile}`);
