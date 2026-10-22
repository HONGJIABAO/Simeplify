import test from 'node:test';
import assert from 'node:assert';
import { classifyWasteWithGemini } from '../src/lib/services/geminiService.ts';

// 1x1 transparent PNG
const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test('Gemini AI Service - Classify Waste Item', async () => {
  const result = await classifyWasteWithGemini(sampleBase64, 'image/png');

  assert.ok(result, 'Result should be defined');
  assert.ok(typeof result.identifiedItem === 'string', 'identifiedItem should be string');
  assert.ok(typeof result.targetBin === 'string', 'targetBin should be string');
  assert.ok(['paper', 'plastic', 'glass_metal', 'general'].includes(result.binType), `binType '${result.binType}' should be valid`);
  assert.ok(typeof result.isRecyclable === 'boolean', 'isRecyclable should be boolean');
  assert.ok(typeof result.confidence === 'number', 'confidence should be number');
  assert.ok(typeof result.material === 'string', 'material should be string');
  assert.ok(typeof result.disposalTip === 'string', 'disposalTip should be string');

  console.log('Classified waste test output:', result);
});
