import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateLocalRoutineAnalysis,
  analyzeBillRoutineWithGemini,
} from '../src/lib/services/geminiService.ts';
import { getSimulatorRoutineProfile } from '../src/features/simulator/logic/simulatorBridge.ts';

test('AI Routine Analysis - Bridge retrieves Simulator inventory & routine baseline', () => {
  const profile = getSimulatorRoutineProfile('electricity');

  assert.ok(profile, 'Simulator profile should be defined');
  assert.ok(Array.isArray(profile.appliances), 'appliances should be an array');
  assert.ok(profile.appliances.length > 0, 'Should have appliances in inventory');
  assert.ok(profile.estimatedMonthlyCostRm > 0, 'Estimated monthly cost should be > 0');
  assert.ok(Array.isArray(profile.routineBlocks), 'routineBlocks should be an array');
  assert.ok(profile.routineBlocks.length > 0, 'Should have routine blocks');

  // Verify appliances have room assignments and names
  const livingRoomItem = profile.appliances.find((a) => a.roomName.toLowerCase().includes('living'));
  assert.ok(livingRoomItem, 'Should find at least one living room appliance');

  const bedroomAc = profile.appliances.find(
    (a) => a.name.toLowerCase().includes('air conditioner') || a.type.includes('air')
  );
  assert.ok(bedroomAc, 'Should find air conditioner in profile');
});

test('AI Routine Analysis - Electricity Minor Discrepancy (~RM 15 over)', () => {
  const profile = getSimulatorRoutineProfile('electricity');
  const estimatedCost = profile.estimatedMonthlyCostRm;

  // Bill is RM 15 higher than estimate
  const billData = {
    type: 'electricity',
    amount: estimatedCost + 15,
    usage: (profile.estimatedUsage || 300) + 35,
    billingMonth: '2026-10-01',
    provider: 'TNB',
  };

  const result = generateLocalRoutineAnalysis(billData, profile);

  assert.equal(result.discrepancyRm, 15);
  assert.equal(result.severity, 'minor');
  assert.equal(result.discrepancyType, 'minor_over_estimate');

  // Conclude minor appliances might be the cause (lights, fan)
  assert.match(
    result.conclusion,
    /RM 15 higher than your routine estimate/i,
    'Conclusion should state RM 15 discrepancy'
  );
  assert.match(
    result.conclusion,
    /(lights|fan)/i,
    'Conclusion should suggest minor appliances (lights or fan)'
  );

  // Culprit appliances must come from the profile
  assert.ok(result.culpritAppliances.length > 0, 'Should identify culprit appliances');
  for (const culprit of result.culpritAppliances) {
    const exists = profile.appliances.some((a) => a.name.includes(culprit) || culprit.includes(a.name));
    assert.ok(exists, `Culprit "${culprit}" must exist in the user's Simulator profile`);
  }
});

test('AI Routine Analysis - Electricity Major Discrepancy (> RM 30 over)', () => {
  const profile = getSimulatorRoutineProfile('electricity');
  const estimatedCost = profile.estimatedMonthlyCostRm;

  // Bill is RM 85 higher than estimate
  const billData = {
    type: 'electricity',
    amount: estimatedCost + 85,
    usage: (profile.estimatedUsage || 300) + 220,
    billingMonth: '2026-10-01',
    provider: 'TNB',
  };

  const result = generateLocalRoutineAnalysis(billData, profile);

  assert.equal(result.discrepancyRm, 85);
  assert.equal(result.severity, 'major');
  assert.equal(result.discrepancyType, 'major_over_estimate');

  // Conclude high-drain appliances are the likely cause (air conditioner, refrigerator)
  assert.match(
    result.conclusion,
    /(significantly higher|air conditioner|refrigerator|Aircond)/i,
    'Conclusion should mention significant spike and high-drain cooling appliances'
  );

  // Culprit appliances must come from user's profile
  assert.ok(result.culpritAppliances.length > 0, 'Should identify culprit high-drain appliance');
  for (const culprit of result.culpritAppliances) {
    const exists = profile.appliances.some((a) => a.name.includes(culprit) || culprit.includes(a.name));
    assert.ok(exists, `Culprit "${culprit}" must exist in user's Simulator profile`);
  }
});

test('AI Routine Analysis - Water Minor Discrepancy (~RM 10 over)', () => {
  const profile = getSimulatorRoutineProfile('water');
  const estimatedCost = profile.estimatedMonthlyCostRm;

  // Water bill RM 10 higher
  const billData = {
    type: 'water',
    amount: estimatedCost + 10,
    usage: (profile.estimatedUsage || 16) + 7,
    billingMonth: '2026-10-01',
    provider: 'Air Selangor',
  };

  const result = generateLocalRoutineAnalysis(billData, profile);

  assert.equal(result.discrepancyRm, 10);
  assert.equal(result.severity, 'minor');
  assert.equal(result.discrepancyType, 'minor_over_estimate');

  // Suggest minor habits (dripping faucet, tap while brushing teeth, longer shower)
  assert.match(
    result.conclusion,
    /(dripping faucet|brushing teeth|longer shower)/i,
    'Conclusion should suggest minor water habits'
  );
});

test('AI Routine Analysis - Water Major Discrepancy (> RM 20 over)', () => {
  const profile = getSimulatorRoutineProfile('water');
  const estimatedCost = profile.estimatedMonthlyCostRm;

  // Water bill RM 45 higher
  const billData = {
    type: 'water',
    amount: estimatedCost + 45,
    usage: (profile.estimatedUsage || 16) + 32,
    billingMonth: '2026-10-01',
    provider: 'Air Selangor',
  };

  const result = generateLocalRoutineAnalysis(billData, profile);

  assert.equal(result.discrepancyRm, 45);
  assert.equal(result.severity, 'major');
  assert.equal(result.discrepancyType, 'major_over_estimate');

  // Suggest severe issues (concealed pipe leakage, running toilet flapper)
  assert.match(
    result.conclusion,
    /(concealed pipe leakage|toilet flapper)/i,
    'Conclusion should suggest severe plumbing issues'
  );
});

test('AI Routine Analysis - Bill on track / matches estimate', () => {
  const profile = getSimulatorRoutineProfile('electricity');
  const estimatedCost = profile.estimatedMonthlyCostRm;

  const billData = {
    type: 'electricity',
    amount: estimatedCost,
    usage: profile.estimatedUsage || 300,
    billingMonth: '2026-10-01',
    provider: 'TNB',
  };

  const result = generateLocalRoutineAnalysis(billData, profile);

  assert.equal(result.discrepancyRm, 0);
  assert.equal(result.severity, 'normal');
  assert.equal(result.discrepancyType, 'matches_estimate');
  assert.match(result.conclusion, /(matches|aligns|Great job)/i);
});
