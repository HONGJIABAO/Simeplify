import test from 'node:test';
import assert from 'node:assert/strict';

// Test anomaly detection logic
function detectBillAnomaly(current, previousBills = []) {
  const matchingPrevious = previousBills
    .filter((b) => b.type === current.type && b.billing_month !== current.billingMonth)
    .sort((a, b) => b.billing_month.localeCompare(a.billing_month));

  const prevBill = matchingPrevious[0] || null;

  let momChangePct = 0;
  if (prevBill && prevBill.usage > 0) {
    momChangePct = ((current.usage - prevBill.usage) / prevBill.usage) * 100;
  }

  let isAnomaly = false;
  let anomalyType = 'none';
  let title = 'Normal consumption';
  let message = 'Consumption is steady and matches normal household usage.';
  let promptAction = 'No unusual activity detected.';

  if (current.type === 'water') {
    if (momChangePct >= 25 || (prevBill && current.usage >= 24 && prevBill.usage < 18)) {
      isAnomaly = true;
      anomalyType = 'leak_detected';
      title = 'Unusual water usage detected';
      message = 'Unusual water usage detected. Please check for potential pipe leakages.';
      promptAction = 'Please check your household and verify the anomaly.';
    }
  } else {
    if (momChangePct >= 20 || (prevBill && current.usage >= 400 && prevBill.usage < 320)) {
      isAnomaly = true;
      anomalyType = 'spike_detected';
      title = 'High electricity spike detected';
      message = 'High electricity spike detected. Please check if high-drain appliances or lights were accidentally left on.';
      promptAction = 'Please check your household and verify the anomaly.';
    }
  }

  return {
    isAnomaly,
    anomalyType,
    momChangePct: Math.round(momChangePct),
    title,
    message,
    promptAction,
    previousBill: prevBill,
  };
}

test('detectBillAnomaly detects water leak when MoM >= 25%', () => {
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
  assert.match(res.message, /Unusual water usage detected\. Please check for potential pipe leakages\./);
  assert.match(res.promptAction, /Please check your household and verify the anomaly\./);
  assert.equal(res.momChangePct, 50);
});

test('detectBillAnomaly detects electricity spike when MoM >= 20%', () => {
  const previousBills = [
    { type: 'electricity', billing_month: '2026-09-01', usage: 300, amount: 135 },
  ];
  const current = {
    type: 'electricity',
    usage: 420, // +40%
    amount: 210,
    billingMonth: '2026-10-01',
  };

  const res = detectBillAnomaly(current, previousBills);
  assert.equal(res.isAnomaly, true);
  assert.equal(res.anomalyType, 'spike_detected');
  assert.equal(res.title, 'High electricity spike detected');
  assert.match(res.message, /High electricity spike detected\. Please check if high-drain appliances or lights were accidentally left on\./);
  assert.match(res.promptAction, /Please check your household and verify the anomaly\./);
  assert.equal(res.momChangePct, 40);
});

test('detectBillAnomaly reports normal consumption when within threshold', () => {
  const previousBills = [
    { type: 'electricity', billing_month: '2026-09-01', usage: 350, amount: 155 },
  ];
  const current = {
    type: 'electricity',
    usage: 360, // +2.8%
    amount: 160,
    billingMonth: '2026-10-01',
  };

  const res = detectBillAnomaly(current, previousBills);
  assert.equal(res.isAnomaly, false);
  assert.equal(res.anomalyType, 'none');
  assert.equal(res.title, 'Normal consumption');
});

test('TNB bill extraction maps current_bill_rm over total_payable_rm when credited', () => {
  const geminiParsed = {
    billing_month: '2020-09',
    usage_kwh: 252,
    current_bill_rm: 54.95,
    total_payable_rm: 0.0,
    previous_balance_rm: -54.95,
    bill_type: 'electricity',
    provider: 'TNB',
  };

  let amount = 0;
  if (typeof geminiParsed.current_bill_rm === 'number') {
    amount = geminiParsed.current_bill_rm;
  } else if (typeof geminiParsed.total_payable_rm === 'number') {
    amount = geminiParsed.total_payable_rm;
  }

  assert.equal(amount, 54.95);
  assert.equal(geminiParsed.usage_kwh, 252);
  assert.equal(geminiParsed.billing_month, '2020-09');
});

