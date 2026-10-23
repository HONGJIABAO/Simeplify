import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAnalyzeBill, detectBillAnomaly } from '../netlify/functions/analyze-bill.ts';

test('Netlify Function: detectBillAnomaly detects water leak when MoM >= 25%', () => {
  const previousBills = [
    { type: 'water', billing_month: '2026-09-01', usage: 16, amount: 28 },
  ];
  const current = {
    type: 'water',
    usage: 24, // +50%
    amount: 52,
    billingMonth: '2026-10-01',
  };

  const res = detectBillAnomaly(current, previousBills);
  assert.equal(res.isAnomaly, true);
  assert.equal(res.anomalyType, 'leak_detected');
  assert.equal(res.title, 'Unusual water usage detected');
  assert.equal(res.momChangePct, 50);
});

test('Netlify Function: handleAnalyzeBill rejects non-POST methods with 405', async () => {
  const req = new Request('http://localhost/.netlify/functions/analyze-bill', {
    method: 'GET',
  });
  const res = await handleAnalyzeBill(req);
  assert.equal(res.status, 405);
  const data = await res.json();
  assert.match(data.error, /Method not allowed/);
});

test('Netlify Function: handleAnalyzeBill responds to OPTIONS preflight with 200', async () => {
  const req = new Request('http://localhost/.netlify/functions/analyze-bill', {
    method: 'OPTIONS',
  });
  const res = await handleAnalyzeBill(req);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
});

test('Netlify Function: handleAnalyzeBill validates missing fileBase64 with 400', async () => {
  process.env.GEMINI_API_KEY = 'test_key';
  const req = new Request('http://localhost/.netlify/functions/analyze-bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const res = await handleAnalyzeBill(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Missing fileBase64/);
});
