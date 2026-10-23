import assert from 'node:assert/strict';
import test from 'node:test';

function downgradeLeafStage(stage) {
  if (stage === 'lush') return 'healthy';
  if (stage === 'healthy') return 'dry';
  return 'dry';
}

test('Leaf stage downgrade logic: Lush -> Healthy -> Dry -> Dry', () => {
  assert.equal(downgradeLeafStage('lush'), 'healthy', 'Lush stage should downgrade to healthy');
  assert.equal(downgradeLeafStage('healthy'), 'dry', 'Healthy stage should downgrade to dry');
  assert.equal(downgradeLeafStage('dry'), 'dry', 'Dry stage should remain dry');
});

test('Community Day Rollover Rule: When leaf status is locked and user has no action all day, next day downgrades 1 status and enters unlocked state', () => {
  // Household starts at Lush stage
  let household = {
    monthlyDeeds: 20,
    leafStage: 'lush',
    penaltyDeedsLost: 0,
    recyclingPts: 800,
  };
  let isLeafLocked = true;
  let deedsOnDay = 0;

  // Day 1: User is locked, does 0 actions all day
  // Day rollover executes:
  const wasLockedWithoutAction = isLeafLocked && deedsOnDay === 0;
  assert.equal(wasLockedWithoutAction, true, 'User was locked without action');

  if (wasLockedWithoutAction) {
    household.monthlyDeeds = Math.max(0, household.monthlyDeeds - 1);
    household.leafStage = downgradeLeafStage(household.leafStage);
    household.penaltyDeedsLost += 1;
    // Recycling points remain 100% safe
    // Leaf unlocks on next day!
    isLeafLocked = false;
  }

  assert.equal(household.leafStage, 'healthy', 'Lush downgraded by 1 stage to Healthy');
  assert.equal(household.monthlyDeeds, 19, 'Monthly deeds penalized by 1');
  assert.equal(household.penaltyDeedsLost, 1);
  assert.equal(household.recyclingPts, 800, 'Recycling points unaffected');
  assert.equal(isLeafLocked, false, 'Next day enters UNLOCKED state');

  // Day 2: Leaf is unlocked. User still does 0 actions all day.
  const wasLockedDay2 = isLeafLocked && deedsOnDay === 0;
  assert.equal(wasLockedDay2, false, 'Was not locked during Day 2');
  // Transition to Day 3: leaf enters locked state
  isLeafLocked = true;
  assert.equal(isLeafLocked, true, 'Enters locked state on Day 3');

  // Day 3: Leaf is locked, user again does 0 actions all day.
  const wasLockedDay3 = isLeafLocked && deedsOnDay === 0;
  assert.equal(wasLockedDay3, true);
  if (wasLockedDay3) {
    household.monthlyDeeds = Math.max(0, household.monthlyDeeds - 1);
    household.leafStage = downgradeLeafStage(household.leafStage);
    household.penaltyDeedsLost += 1;
    isLeafLocked = false;
  }

  assert.equal(household.leafStage, 'dry', 'Healthy downgraded by 1 stage to Dry');
  assert.equal(household.monthlyDeeds, 18);
  assert.equal(household.penaltyDeedsLost, 2);
  assert.equal(isLeafLocked, false, 'Next day enters UNLOCKED state');

  // Day 4: If locked again and does nothing, dry stays at dry and unlocks
  isLeafLocked = true;
  if (isLeafLocked && deedsOnDay === 0) {
    household.monthlyDeeds = Math.max(0, household.monthlyDeeds - 1);
    household.leafStage = downgradeLeafStage(household.leafStage);
    household.penaltyDeedsLost += 1;
    isLeafLocked = false;
  }
  assert.equal(household.leafStage, 'dry', 'Dry cannot downgrade further, remains Dry');
  assert.equal(household.monthlyDeeds, 17);
  assert.equal(household.penaltyDeedsLost, 3);
  assert.equal(isLeafLocked, false, 'Leaf is unlocked');
});

test('When user does perform an action while locked, leaf unlocks immediately and upgrades/maintains stage', () => {
  let isLeafLocked = true;
  let deedsToday = 0;
  let leafStage = 'dry';

  // Perform 1 deed action
  deedsToday += 1;
  isLeafLocked = false;
  leafStage = deedsToday === 1 ? 'healthy' : 'lush';

  assert.equal(isLeafLocked, false, 'Action immediately unlocked the leaf');
  assert.equal(leafStage, 'healthy', 'Stage upgraded to Healthy');

  // Perform 2nd deed action
  deedsToday += 1;
  leafStage = deedsToday === 1 ? 'healthy' : 'lush';
  assert.equal(leafStage, 'lush', 'Stage upgraded to Lush');
});
