import assert from 'node:assert/strict';
import test from 'node:test';
import { canRoomHoldItems, getFloorPlanLayout, rectanglesOverlap } from '../src/features/simulator/logic/roomLayout.ts';

test('room rectangles and the stair block do not overlap', () => {
  for (const floor of [1, 2]) {
    const layout = getFloorPlanLayout(floor);
    const regions = [...layout.rooms, layout.stair];
    for (let index = 0; index < regions.length; index += 1) {
      for (let other = index + 1; other < regions.length; other += 1) {
        assert.equal(rectanglesOverlap(regions[index], regions[other]), false);
      }
    }
  }
});

test('top and bottom vertical dividers do not line up', () => {
  const layout = getFloorPlanLayout(1);
  const topDivider = layout.rooms.find((room) => room.slot === 'A').width;
  const lowerDividers = [
    layout.rooms.find((room) => room.slot === 'C').width,
    layout.rooms.find((room) => room.slot === 'D').x + layout.rooms.find((room) => room.slot === 'D').width,
  ];
  assert.equal(topDivider, 0.58);
  assert.deepEqual(lowerDividers, [0.5, 0.86]);
  assert.ok(lowerDividers.every((divider) => divider !== topDivider));
});

test('the stair block is identical on both floors', () => {
  assert.deepEqual(getFloorPlanLayout(1).stair, getFloorPlanLayout(2).stair);
});

test('dark rooms reject items and set-up rooms accept them', () => {
  assert.equal(canRoomHoldItems({ isSetUp: false }), false);
  assert.equal(canRoomHoldItems({ isSetUp: true }), true);
});
