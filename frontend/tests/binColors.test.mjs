import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  BIN_CATEGORY_COLORS,
  BIN_ICON_TEXT_COLOR,
  resolveBinVisualCategory,
} from '../src/features/bin/logic/binColors.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('sorting guide uses the Malaysian blue, orange, brown and olive palette', () => {
  assert.deepEqual(BIN_CATEGORY_COLORS, {
    paper: '#8BA4B5', plasticMetal: '#D89C76', glass: '#96745F', general: '#6B7F67',
  });
  assert.equal(BIN_ICON_TEXT_COLOR, '#333333');
  const mockData = readFileSync(resolve(ROOT, 'src/lib/mockData.ts'), 'utf8');
  assert.match(mockData, /name: 'Plastic & Metal'/);
  assert.match(mockData, /name: 'Glass'/);
  assert.match(mockData, /color: BIN_CATEGORY_COLORS\.paper/);
  assert.match(mockData, /color: BIN_CATEGORY_COLORS\.plasticMetal/);
  assert.match(mockData, /color: BIN_CATEGORY_COLORS\.glass/);
  assert.match(mockData, /color: BIN_CATEGORY_COLORS\.general/);
});

test('scan-result visual mapping sends material categories to the matching guide color', () => {
  assert.equal(resolveBinVisualCategory('paper', 'Cardboard / Paperboard'), 'paper');
  assert.equal(resolveBinVisualCategory('plastic', 'PET Plastic'), 'plastic');
  assert.equal(resolveBinVisualCategory('glass_metal', 'Glass', 'Glass Olive Jar'), 'glass');
  assert.equal(resolveBinVisualCategory('glass_metal', 'Aluminium', 'Aluminium Can'), 'plastic');
  assert.equal(resolveBinVisualCategory('metal', 'Aluminium'), 'plastic');
  assert.equal(resolveBinVisualCategory('glass', 'Glass'), 'glass');
  assert.equal(resolveBinVisualCategory('general', 'Organic Waste'), 'general');
});

test('scan-result cards use the same dynamic visual mapping and merged labels', () => {
  const resultScreen = readFileSync(resolve(ROOT, 'src/features/bin/BinScanResultScreen.tsx'), 'utf8');
  const cameraScreen = readFileSync(resolve(ROOT, 'src/features/bin/BinScannerScreen.tsx'), 'utf8');
  const homeScreen = readFileSync(resolve(ROOT, 'src/features/bin/BinHomeScreen.tsx'), 'utf8');
  assert.match(resultScreen, /getBinVisualInfo\(result\.binType, result\.material, result\.itemName\)/);
  assert.match(cameraScreen, /getBinVisualInfo\(result\.binType, result\.material, result\.itemName\)/);
  assert.match(resultScreen, /\{binInfo\.name\}/);
  assert.match(cameraScreen, /\{binInfo\.name\}/);
  assert.match(homeScreen, /backgroundColor: bin\.color/);
});
