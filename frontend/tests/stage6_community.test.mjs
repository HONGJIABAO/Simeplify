/**
 * Stage 6 (Part 5): Community Tab Backend Integration Tests
 *
 * Verifies:
 * 1. Seeded rewards for current Malaysia month exist in public.rewards
 * 2. Initial state via fetchCommunityStateWithClient (0 points, 0 deeds, no vote)
 * 3. Casting a valid vote via castHouseholdVoteWithClient
 * 4. Duplicate vote rejection with code 23505 (uq_votes_household_month)
 * 5. Direct UPDATE / DELETE on public.votes rejected by PostgreSQL permissions / RLS
 * 6. Direct INSERT on public.points and public.deeds rejected from authenticated client
 * 7. Service-role points and deeds aggregation accurately reflected in community state
 * 8. Cross-household RLS isolation (Household B cannot see Household A's vote, deeds, or points)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { getTestCredentials } from './testSafety.mjs';

import {
  getCommunityDateAnchors,
  fetchCommunityStateWithClient,
  castHouseholdVoteWithClient,
  CommunityServiceError,
} from '../src/lib/services/communityCore.ts';

const { supabaseUrl: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY } = getTestCredentials();

test('Stage 6 Part 5: Community Tab Backend Integration Tests', async () => {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const timestamp = Date.now();
  const emailA = `stage6_comm_a_${timestamp}@example.com`;
  const emailB = `stage6_comm_b_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  // =========================================================================
  // 1. Verify Seeded Rewards for Current Malaysia Month
  // =========================================================================
  const anchors = getCommunityDateAnchors();
  const { data: seededRewards, error: rewardsError } = await adminClient
    .from('rewards')
    .select('*')
    .eq('voting_month', anchors.currentVotingMonth)
    .order('created_at', { ascending: true });

  assert.equal(rewardsError, null, `Failed to query seeded rewards: ${rewardsError?.message}`);
  assert.ok(seededRewards && seededRewards.length >= 3, `Expected at least 3 seeded rewards for ${anchors.currentVotingMonth}, got ${seededRewards?.length}`);

  const titles = seededRewards.map((r) => r.title);
  assert.ok(titles.some((t) => t.includes('Plant a tree')), 'Expected "Plant a tree" seeded reward');
  assert.ok(titles.some((t) => t.includes('organic food')), 'Expected "organic food" seeded reward');
  assert.ok(titles.some((t) => t.includes('tool & seed library')), 'Expected "tool & seed library" seeded reward');

  // Verify deterministic seed rewards from seed.sql
  const primarySeedIds = [
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000103',
  ];
  for (const seedId of primarySeedIds) {
    const seed = seededRewards.find((r) => r.id === seedId);
    assert.ok(seed, `Expected seed reward ${seedId} to exist`);
    assert.equal(seed.is_unlocked, false, `Seed reward ${seedId} should be locked`);
    assert.equal(seed.voting_month, anchors.currentVotingMonth, `Seed reward ${seedId} month should match anchor`);
  }

  // =========================================================================
  // 2. Setup Authenticated Household A
  // =========================================================================
  const { data: signUpA, error: signUpAError } = await clientA.auth.signUp({
    email: emailA,
    password: testPassword,
    options: {
      data: {
        name: 'Community Tester A',
        gender: 'girl',
        state: 'Selangor',
        city: 'Subang Jaya',
        street: '10, Jalan USJ 1',
      },
    },
  });
  assert.equal(signUpAError, null, `Sign up A failed: ${signUpAError?.message}`);

  const { data: signInA, error: signInAError } = await clientA.auth.signInWithPassword({
    email: emailA,
    password: testPassword,
  });
  assert.equal(signInAError, null, `Sign in A failed: ${signInAError?.message}`);
  assert.ok(signInA.session, 'Expected session for Household A');

  const { data: householdAId, error: rpcAError } = await clientA.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Subang Jaya',
    p_street: '10, Jalan USJ 1',
  });
  assert.equal(rpcAError, null, `create_household A failed: ${rpcAError?.message}`);
  assert.ok(householdAId, 'Expected valid household A ID');

  // Verify Initial Community State for Household A
  const initialStateA = await fetchCommunityStateWithClient(clientA, householdAId);
  assert.ok(initialStateA.rewards.length >= 3, 'Should load current voting month rewards');
  assert.equal(initialStateA.vote, null, 'Household A should have no initial vote');
  assert.equal(initialStateA.selectedReward, null, 'Household A should have no initial selected reward');
  assert.equal(initialStateA.points.allTime, 0, 'Household A points should start at 0');
  assert.equal(initialStateA.deeds.completedToday, 0, 'Household A deeds should start at 0');
  assert.equal(initialStateA.deeds.recycledToday, false);
  assert.equal(initialStateA.deeds.uploadedLowerBillThisMonth, false);

  // =========================================================================
  // 3. Cast a Valid Vote
  // =========================================================================
  const targetReward = initialStateA.rewards[0];
  const voteResult = await castHouseholdVoteWithClient(
    clientA,
    householdAId,
    targetReward.id,
    initialStateA.currentVotingMonth
  );

  assert.ok(voteResult.id, 'Expected generated vote ID');
  assert.equal(voteResult.household_id, householdAId);
  assert.equal(voteResult.reward_id, targetReward.id);
  assert.equal(voteResult.voting_month, initialStateA.currentVotingMonth);

  // Verify updated state reflects cast vote
  const votedStateA = await fetchCommunityStateWithClient(clientA, householdAId);
  assert.ok(votedStateA.vote, 'Expected vote to be populated');
  assert.equal(votedStateA.vote.reward_id, targetReward.id);
  assert.equal(votedStateA.selectedReward?.id, targetReward.id);
  assert.ok(votedStateA.visibleVoteCounts[targetReward.id] >= 1, 'Vote count should be incremented');

  // =========================================================================
  // 4. Duplicate Vote Rejection (23505 uq_votes_household_month)
  // =========================================================================
  const secondReward = initialStateA.rewards[1] || initialStateA.rewards[0];
  let duplicateThrew = false;
  try {
    await castHouseholdVoteWithClient(
      clientA,
      householdAId,
      secondReward.id,
      initialStateA.currentVotingMonth
    );
  } catch (err) {
    duplicateThrew = true;
    assert.ok(err instanceof CommunityServiceError, 'Expected CommunityServiceError');
    assert.equal(err.kind, 'already-voted', `Expected 'already-voted', got ${err.kind}`);
    assert.equal(err.code, '23505', `Expected Postgres error code 23505, got ${err.code}`);
    assert.ok(err.message.includes('already voted'), `Expected calm message, got: ${err.message}`);
  }
  assert.equal(duplicateThrew, true, 'Duplicate vote must be rejected');

  // =========================================================================
  // 5. UPDATE and DELETE on public.votes Must Be Rejected
  // =========================================================================
  // Attempt direct UPDATE on votes table
  const { error: updateVoteError } = await clientA
    .from('votes')
    .update({ reward_id: secondReward.id })
    .eq('id', voteResult.id);
  assert.ok(updateVoteError, 'Client UPDATE on public.votes must fail');

  // Attempt direct DELETE on votes table
  const { error: deleteVoteError } = await clientA
    .from('votes')
    .delete()
    .eq('id', voteResult.id);
  assert.ok(deleteVoteError, 'Client DELETE on public.votes must fail');

  // =========================================================================
  // 6. Direct Client INSERT on public.points and public.deeds Must Be Rejected
  // =========================================================================
  const { error: insertPointsError } = await clientA
    .from('points')
    .insert({
      household_id: householdAId,
      source: 'recycling',
      amount: 100,
    });
  assert.ok(insertPointsError, 'Direct client INSERT into public.points must be rejected');

  const { error: insertDeedsError } = await clientA
    .from('deeds')
    .insert({
      household_id: householdAId,
      task_type: 'recycle',
      deed_date: anchors.todayMyt,
    });
  assert.ok(insertDeedsError, 'Direct client INSERT into public.deeds must be rejected');

  // =========================================================================
  // 7. Service-Role Points & Deeds Aggregation
  // =========================================================================
  // Insert 1 recycling deed + 10 points via service role (simulating confirm-disposal)
  const { data: deedRecycle, error: adminDeedError } = await adminClient
    .from('deeds')
    .insert({
      household_id: householdAId,
      task_type: 'recycle',
      deed_date: anchors.todayMyt,
    })
    .select('*')
    .single();
  assert.equal(adminDeedError, null, `Service role deed insert failed: ${adminDeedError?.message}`);

  const { error: adminPointsError } = await adminClient
    .from('points')
    .insert({
      household_id: householdAId,
      source: 'recycling',
      amount: 10,
      deed_id: deedRecycle.id,
    });
  assert.equal(adminPointsError, null, `Service role points insert failed: ${adminPointsError?.message}`);

  // Insert 1 energy deed + 50 points via service role (simulating analyze-bill)
  const { data: deedEnergy } = await adminClient
    .from('deeds')
    .insert({
      household_id: householdAId,
      task_type: 'upload_lower_bill',
      deed_date: anchors.todayMyt,
    })
    .select('*')
    .single();

  await adminClient
    .from('points')
    .insert({
      household_id: householdAId,
      source: 'energy',
      amount: 50,
      deed_id: deedEnergy.id,
      billing_month: anchors.currentVotingMonth,
    });

  // Re-fetch community state as Household A and verify aggregation
  const aggregatedStateA = await fetchCommunityStateWithClient(clientA, householdAId);
  assert.equal(aggregatedStateA.points.allTime, 60, 'Total points should be 10 + 50 = 60');
  assert.equal(aggregatedStateA.points.currentMonth, 60, 'Monthly points should be 60');
  assert.equal(aggregatedStateA.points.recycling, 10, 'Recycling points should be 10');
  assert.equal(aggregatedStateA.points.energy, 50, 'Energy points should be 50');
  assert.equal(aggregatedStateA.deeds.completedToday, 2, 'Two deeds completed today');
  assert.equal(aggregatedStateA.deeds.recycledToday, true, 'Recycled today should be true');
  assert.equal(aggregatedStateA.deeds.uploadedLowerBillThisMonth, true, 'Uploaded lower bill this month should be true');

  // =========================================================================
  // 8. Cross-Household RLS Isolation
  // =========================================================================
  // Setup Household B
  const { data: signUpB, error: signUpBError } = await clientB.auth.signUp({
    email: emailB,
    password: testPassword,
    options: {
      data: {
        name: 'Community Tester B',
        gender: 'boy',
        state: 'Selangor',
        city: 'Subang Jaya',
        street: '12, Jalan USJ 1',
      },
    },
  });
  assert.equal(signUpBError, null, `Sign up B failed: ${signUpBError?.message}`);

  await clientB.auth.signInWithPassword({
    email: emailB,
    password: testPassword,
  });

  const { data: householdBId, error: rpcBError } = await clientB.rpc('create_household', {
    p_state: 'Selangor',
    p_city: 'Subang Jaya',
    p_street: '12, Jalan USJ 1',
  });
  assert.equal(rpcBError, null, `create_household B failed: ${rpcBError?.message}`);

  // Household B querying Household A's vote should return nothing
  const { data: votesQueryAByB, error: votesQueryError } = await clientB
    .from('votes')
    .select('*')
    .eq('household_id', householdAId);
  assert.equal(votesQueryError, null);
  assert.equal(votesQueryAByB.length, 0, 'Household B must not see Household A vote');

  // Household B querying Household A's deeds should return nothing
  const { data: deedsQueryAByB } = await clientB
    .from('deeds')
    .select('*')
    .eq('household_id', householdAId);
  assert.equal(deedsQueryAByB.length, 0, 'Household B must not see Household A deeds');

  // Household B querying Household A's points should return nothing
  const { data: pointsQueryAByB } = await clientB
    .from('points')
    .select('*')
    .eq('household_id', householdAId);
  assert.equal(pointsQueryAByB.length, 0, 'Household B must not see Household A points');

  // Household B's own initial community state
  const stateB = await fetchCommunityStateWithClient(clientB, householdBId);
  assert.equal(stateB.vote, null, 'Household B has not voted yet');
  assert.equal(stateB.points.allTime, 0, 'Household B starts with 0 points');
  assert.equal(stateB.deeds.completedToday, 0, 'Household B starts with 0 deeds');

  // Household B can cast their own vote independently
  const voteBResult = await castHouseholdVoteWithClient(
    clientB,
    householdBId,
    secondReward.id,
    stateB.currentVotingMonth
  );
  assert.ok(voteBResult.id, 'Household B vote successfully cast');
  assert.equal(voteBResult.household_id, householdBId);
  assert.equal(voteBResult.reward_id, secondReward.id);

  const updatedStateB = await fetchCommunityStateWithClient(clientB, householdBId);
  assert.equal(updatedStateB.vote?.reward_id, secondReward.id, 'Household B vote reflected');
  assert.equal(updatedStateB.selectedReward?.id, secondReward.id);

  // Household A's vote remains unchanged
  const finalStateA = await fetchCommunityStateWithClient(clientA, householdAId);
  assert.equal(finalStateA.vote?.reward_id, targetReward.id, 'Household A vote preserved');

  // Cleanup test artifacts
  await adminClient.from('points').delete().in('household_id', [householdAId, householdBId]);
  await adminClient.from('deeds').delete().in('household_id', [householdAId, householdBId]);
  await adminClient.from('votes').delete().in('household_id', [householdAId, householdBId]);
  await adminClient.from('households').delete().in('id', [householdAId, householdBId]);
  await adminClient.auth.admin.deleteUser(signUpA.user.id);
  await adminClient.auth.admin.deleteUser(signUpB.user.id);
});
