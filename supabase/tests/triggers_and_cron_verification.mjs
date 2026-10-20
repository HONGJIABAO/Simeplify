// supabase/tests/triggers_and_cron_verification.mjs
// Verification tests for Stage 4: Database Triggers & pg_cron Monthly Jobs

import { execSync } from 'child_process';
import { getTestCredentials } from './testSafety.mjs';

const { apiUrl, serviceRoleKey } = getTestCredentials();

async function queryRest(endpoint, options = {}) {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${apiUrl}/rest/v1/${endpoint}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function queryRpc(funcName, body = {}) {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${apiUrl}/rest/v1/rpc/${funcName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  const results = [];
  function record(name, expected, actual, passed) {
    results.push({ name, expected, actual, passed });
  }

  const runId = Date.now();
  let householdId, billId;

  console.log('--- Setting up Stage 4 Test Fixtures ---');
  try {
    // 1. Create a test household
    const hhRes = await queryRest('households', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        address_state: 'Selangor',
        address_city: 'Subang Jaya',
        address_street: `Stage 4 Test St ${runId}`,
        residents_count: 3,
      }),
    });
    householdId = hhRes.data[0].id;

    // 2. Create a water bill to attach alerts
    const billRes = await queryRest('bills', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        household_id: householdId,
        type: 'water',
        file_path: `bills/${householdId}/water_bill_${runId}.png`,
        billing_month: '2026-10-01',
        usage: 18.5,
        amount: 32.50,
      }),
    });
    billId = billRes.data[0].id;

    // ========================================================================
    // TEST 1: Alert level 'normal' -> Should NOT create notification
    // ========================================================================
    {
      await queryRest('alerts', {
        method: 'POST',
        body: JSON.stringify({
          household_id: householdId,
          bill_id: billId,
          level: 'normal',
          message: 'Water usage is within normal range.',
        }),
      });

      const notifs = await queryRest(`notifications?household_id=eq.${householdId}&type=eq.bill_alert`);
      const passed = Array.isArray(notifs.data) && notifs.data.length === 0;
      record('Normal alert insert', '0 notifications created', `${notifs.data?.length || 0} notifications`, passed);
    }

    // ========================================================================
    // TEST 2: Alert level 'minor_drip' -> Should NOT create notification
    // ========================================================================
    {
      await queryRest('alerts', {
        method: 'POST',
        body: JSON.stringify({
          household_id: householdId,
          bill_id: billId,
          level: 'minor_drip',
          message: 'Minor drip detected: check aerators.',
        }),
      });

      const notifs = await queryRest(`notifications?household_id=eq.${householdId}&type=eq.bill_alert`);
      const passed = Array.isArray(notifs.data) && notifs.data.length === 0;
      record('Minor drip alert insert', '0 notifications created', `${notifs.data?.length || 0} notifications`, passed);
    }

    // ========================================================================
    // TEST 3: Alert level 'leak_detected' -> Should create notification
    // ========================================================================
    {
      await queryRest('alerts', {
        method: 'POST',
        body: JSON.stringify({
          household_id: householdId,
          bill_id: billId,
          level: 'leak_detected',
          message: 'Unusual usage: check toilet cistern and outdoor pipes.',
        }),
      });

      const notifs = await queryRest(`notifications?household_id=eq.${householdId}&type=eq.bill_alert&order=created_at.desc&limit=1`);
      const notif = notifs.data?.[0];
      const passed =
        notif &&
        notif.type === 'bill_alert' &&
        notif.title === 'Water Leak Detected' &&
        notif.is_read === false &&
        notif.linked_path === '/(tabs)/scanner';
      record(
        'Leak detected alert trigger',
        'Notification created: type=bill_alert, title="Water Leak Detected"',
        notif ? `type=${notif.type}, title="${notif.title}", linked_path=${notif.linked_path}` : 'None created',
        passed
      );
    }

    // ========================================================================
    // TEST 4: Alert level 'major_pipe_burst' -> Should create notification
    // ========================================================================
    {
      await queryRest('alerts', {
        method: 'POST',
        body: JSON.stringify({
          household_id: householdId,
          bill_id: billId,
          level: 'major_pipe_burst',
          message: 'Critical anomaly: consider closing main valve immediately.',
        }),
      });

      const notifs = await queryRest(`notifications?household_id=eq.${householdId}&type=eq.bill_alert&order=created_at.desc&limit=1`);
      const notif = notifs.data?.[0];
      const passed =
        notif &&
        notif.type === 'bill_alert' &&
        notif.title === 'Major Pipe Burst Detected' &&
        notif.is_read === false &&
        notif.linked_path === '/(tabs)/scanner';
      record(
        'Major pipe burst alert trigger',
        'Notification created: type=bill_alert, title="Major Pipe Burst Detected"',
        notif ? `type=${notif.type}, title="${notif.title}", linked_path=${notif.linked_path}` : 'None created',
        passed
      );
    }

    // ========================================================================
    // TEST 5: Verify pg_cron jobs registration
    // ========================================================================
    {
      const cmdOut = execSync('npx supabase db query "select jobname, schedule, active from cron.job order by jobid;"', { encoding: 'utf-8' });
      const hasJob1 = cmdOut.includes('monthly_community_voting_resolution');
      const hasJob2 = cmdOut.includes('monthly_energy_points_bill_check');
      record('pg_cron registered jobs', 'Both monthly jobs active in cron.job', `Job 1: ${hasJob1}, Job 2: ${hasJob2}`, hasJob1 && hasJob2);
    }

    // ========================================================================
    // TEST 6: Monthly Voting Resolution function (COM-01 / COM-02)
    // ========================================================================
    {
      const testMonth = '2026-10-01';
      // Seed a reward for testMonth
      const rRes = await queryRest('rewards', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          voting_month: testMonth,
          title: `Solar Garden Lights ${runId}`,
          description: 'Community solar lights for walking path',
          target_points: 50,
          is_unlocked: false,
        }),
      });
      const rewardId = rRes.data[0].id;

      // Seed a vote from household
      await queryRest('votes', {
        method: 'POST',
        body: JSON.stringify({
          household_id: householdId,
          reward_id: rewardId,
          voting_month: testMonth,
        }),
      });

      // Seed 100 community points in testMonth
      await queryRest('points', {
        method: 'POST',
        body: JSON.stringify({
          household_id: householdId,
          source: 'recycling',
          amount: 100,
        }),
      });

      // Execute resolution as of 2026-11-01
      const res = await queryRpc('resolve_monthly_community_voting', { p_as_of_date: '2026-11-01' });

      // Check updated reward is_unlocked
      const updatedReward = await queryRest(`rewards?id=eq.${rewardId}`);
      const isUnlocked = updatedReward.data?.[0]?.is_unlocked === true;

      // Check notifications generated
      const monthResultNotif = await queryRest(`notifications?household_id=eq.${householdId}&type=eq.month_result`);
      const votingOpenNotif = await queryRest(`notifications?household_id=eq.${householdId}&type=eq.voting_open`);

      const passed =
        res.ok &&
        isUnlocked &&
        monthResultNotif.data?.length > 0 &&
        votingOpenNotif.data?.length > 0;

      record(
        'Community voting resolution job',
        'Reward unlocked, month_result & voting_open notifications delivered',
        `Unlocked=${isUnlocked}, MonthResultCount=${monthResultNotif.data?.length}, VotingOpenCount=${votingOpenNotif.data?.length}`,
        passed
      );
    }

    // ========================================================================
    // TEST 7: Monthly Energy Points / Bill Check function (COM-02 / SCN-01)
    // ========================================================================
    {
      const elecMonth = '2026-10-01';
      // Seed electricity bill with lower_than_estimate in analysis
      const elecBillRes = await queryRest('bills', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          household_id: householdId,
          type: 'electricity',
          file_path: `bills/${householdId}/elec_${runId}.png`,
          billing_month: elecMonth,
          usage: 280,
          amount: 75.00,
          analysis: { lower_than_estimate: true, estimate_kwh: 350 },
        }),
      });

      // Execute energy bill check
      const res = await queryRpc('check_monthly_energy_bills', { p_as_of_date: '2026-11-01' });

      // Check points awarded
      const pointsRes = await queryRest(`points?household_id=eq.${householdId}&source=eq.energy&billing_month=eq.${elecMonth}`);
      const deedsRes = await queryRest(`deeds?household_id=eq.${householdId}&task_type=eq.upload_lower_bill`);

      const passed =
        res.ok &&
        pointsRes.data?.length === 1 &&
        pointsRes.data[0].amount === 50 &&
        deedsRes.data?.length > 0;

      record(
        'Monthly energy bill check job',
        '+50 points awarded with upload_lower_bill deed',
        `Points=${pointsRes.data?.[0]?.amount}, Deed=${deedsRes.data?.[0]?.task_type}`,
        passed
      );
    }
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    console.log('\n--- Cleaning up Test Fixtures ---');
    try {
      if (householdId) {
        await queryRest(`households?id=eq.${householdId}`, { method: 'DELETE' });
      }
      console.log('Cleanup completed.');
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr);
    }
  }

  console.log('\n================================================================================');
  console.log('STAGE 4 VERIFICATION RESULTS');
  console.log('================================================================================\n');
  console.table(
    results.map((r, i) => ({
      '#': i + 1,
      Test: r.name,
      Expected: r.expected,
      Actual: r.actual,
      Result: r.passed ? 'PASSED' : 'FAILED',
    }))
  );
}

runTests();
