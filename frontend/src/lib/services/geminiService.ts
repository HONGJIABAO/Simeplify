/**
 * SCN-03
 * Pure scanner analysis helpers.
 *
 * Gemini network requests are intentionally not allowed in client services.
 * Bill OCR and waste classification run through authenticated Supabase Edge
 * Functions so credentials never enter the browser or native app bundle.
 */

// @ts-ignore -- explicit extension keeps this module directly importable by Node tests.
import type { AIRoutineAnalysisResult } from '../../features/scanner/logic/scannerCore.ts';
// @ts-ignore -- explicit extension keeps this module directly importable by Node tests.
import type { SimulatorRoutineProfile } from '../../features/simulator/logic/simulatorBridge.ts';

// @ts-ignore -- explicit extension keeps this module directly importable by Node tests.
export type { AIRoutineAnalysisResult } from '../../features/scanner/logic/scannerCore.ts';

export interface BillAnomalyResult {
  isAnomaly: boolean;
  anomalyType: 'none' | 'leak_detected' | 'spike_detected';
  momChangePct: number;
  title: string;
  message: string;
  promptAction: string;
  previousBill: {
    billingMonth: string;
    usage: number;
    amount: number;
  } | null;
}

/**
 * Compares the current bill with previous records without making a network
 * request. This is the offline presentation fallback; bill OCR remains
 * server-only in the analyze-bill Edge Function.
 */
export function detectBillAnomaly(
  current: { type: 'electricity' | 'water'; usage: number; amount: number; billingMonth: string },
  previousBills: { type: 'electricity' | 'water'; billing_month: string; usage: number; amount: number }[] = []
): BillAnomalyResult {
  const matchingPrevious = previousBills
    .filter((bill) => bill.type === current.type && bill.billing_month !== current.billingMonth)
    .sort((a, b) => b.billing_month.localeCompare(a.billing_month));

  const previousBill = matchingPrevious[0] || null;
  const momChangePct = previousBill && previousBill.usage > 0
    ? ((current.usage - previousBill.usage) / previousBill.usage) * 100
    : 0;

  let isAnomaly = false;
  let anomalyType: BillAnomalyResult['anomalyType'] = 'none';
  let title = 'Normal consumption';
  let message = 'Consumption is steady and matches your normal household baseline.';
  let promptAction = 'No unusual activity detected.';

  if (current.type === 'water') {
    if (momChangePct >= 25 || (previousBill && current.usage >= 24 && previousBill.usage < 18)) {
      isAnomaly = true;
      anomalyType = 'leak_detected';
      title = 'Unusual water usage detected';
      message = `Unusual water usage detected (${momChangePct > 0 ? '+' : ''}${Math.round(momChangePct)}% vs previous month). Please check for potential pipe leakages, leaking toilet cisterns, or outdoor taps.`;
      promptAction = 'Please check your household water fixtures and inspect your water meter when all taps are closed to verify for leaks.';
    }
  } else if (momChangePct >= 20 || (previousBill && current.usage >= 400 && previousBill.usage < 320)) {
    isAnomaly = true;
    anomalyType = 'spike_detected';
    title = 'High electricity spike detected';
    message = `High electricity spike detected (${momChangePct > 0 ? '+' : ''}${Math.round(momChangePct)}% vs previous month). Please check if high-drain appliances (such as air conditioning, water heaters) or lights were accidentally left on.`;
    promptAction = 'Please check your household appliances, thermostat settings, and verify if cooling or heating appliances were left running continuously.';
  }

  return {
    isAnomaly,
    anomalyType,
    momChangePct: Math.round(momChangePct),
    title,
    message,
    promptAction,
    previousBill: previousBill
      ? {
          billingMonth: previousBill.billing_month,
          usage: previousBill.usage,
          amount: previousBill.amount,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// AI Routine Analysis: Bridge between Simulator & Bill Scanner
// ---------------------------------------------------------------------------

export interface BillRoutineInput {
  type: 'electricity' | 'water';
  amount: number;
  usage: number;
  billingMonth?: string;
  provider?: string;
}

/**
 * Deterministic local fallback generator that adheres to the exact same rules and output format
 * as the Gemini AI prompt. Ensures 100% reliable insights even in offline dev environments.
 */
export function generateLocalRoutineAnalysis(
  billData: BillRoutineInput,
  routineProfile: SimulatorRoutineProfile
): AIRoutineAnalysisResult {
  const actualCostRm = Math.round(billData.amount * 100) / 100;
  const estimatedCostRm = Math.round(routineProfile.estimatedMonthlyCostRm * 100) / 100;
  const diff = Math.round((actualCostRm - estimatedCostRm) * 100) / 100;
  const pct = estimatedCostRm > 0 ? Math.round((diff / estimatedCostRm) * 100) : 0;

  if (billData.type === 'electricity') {
    // Electricity analysis
    if (diff <= 5) {
      return {
        discrepancyRm: diff,
        discrepancyPct: pct,
        discrepancyType: diff < -5 ? 'under_estimate' : 'matches_estimate',
        conclusion: `Great job! Your bill of RM ${Math.round(actualCostRm)} matches your routine estimate of RM ${Math.round(estimatedCostRm)}. Your household is adhering well to your simulated schedule!`,
        culpritAppliances: [],
        culpritHabits: [],
        actionRecommendation: 'Keep maintaining your daily schedule in the Simulator.',
        severity: 'normal',
        estimatedCostRm,
        actualCostRm,
        utilityType: 'electricity',
      };
    }

    if (diff <= 25) {
      // Minor Discrepancy (~RM 10 to RM 20 over estimate): minor appliances (lights, fan)
      const light = routineProfile.appliances.find(
        (a) => a.type.includes('light') || a.name.toLowerCase().includes('light') || a.name.toLowerCase().includes('lamp')
      );
      const fan = routineProfile.appliances.find(
        (a) => a.type.includes('fan') || a.name.toLowerCase().includes('fan')
      );

      const culpritApp = light || fan || routineProfile.appliances[0];
      const culpritName = culpritApp
        ? `${culpritApp.name}${culpritApp.roomName ? ` in ${culpritApp.roomName}` : ''}`
        : 'living room lights';

      const culpritShort = light
        ? `${light.roomName ? `${light.roomName.toLowerCase()} ` : ''}lights`
        : fan
        ? `${fan.name} in ${fan.roomName}`
        : 'minor appliances';

      return {
        discrepancyRm: diff,
        discrepancyPct: pct,
        discrepancyType: 'minor_over_estimate',
        conclusion: `Your bill is RM ${Math.round(diff)} higher than your routine estimate. Based on your profile, you might have left the ${culpritShort} on overnight a few times. Please check!`,
        culpritAppliances: culpritApp ? [culpritApp.name] : ['Living room light'],
        culpritHabits: ['Leaving lights or fans running overnight'],
        actionRecommendation: `Check switch timers before sleeping and verify if ${culpritName} is turned off when leaving the room.`,
        severity: 'minor',
        estimatedCostRm,
        actualCostRm,
        utilityType: 'electricity',
      };
    }

    // Major Discrepancy (> RM 25 over estimate): high-drain appliances (air conditioner, refrigerator)
    const ac = routineProfile.appliances.find(
      (a) => a.type.includes('air') || a.name.toLowerCase().includes('air') || a.name.toLowerCase().includes('ac')
    );
    const fridge = routineProfile.appliances.find(
      (a) => a.type.includes('fridge') || a.type.includes('refrigerator') || a.name.toLowerCase().includes('refrigerator')
    );

    const culpritApp = ac || fridge || routineProfile.appliances.find((a) => a.isHighDrain) || routineProfile.appliances[0];
    const culpritLabel = culpritApp ? `${culpritApp.name}${culpritApp.roomName ? ` (${culpritApp.roomName})` : ''}` : 'Bedroom Aircond';

    let conclusionText = '';
    if (ac) {
      conclusionText = `Your bill is significantly higher (+RM ${Math.round(diff)} vs estimate). Since you rely heavily on your ${ac.name}${ac.roomName ? ` in ${ac.roomName}` : ''}, check if it was left running while you were out or set to an excessively low temperature.`;
    } else if (fridge) {
      conclusionText = `Your bill is significantly higher (+RM ${Math.round(diff)} vs estimate). Since your ${fridge.name} runs 24/7, check if the door gasket is leaking cold air or if cooling appliances were left on longer than scheduled.`;
    } else {
      conclusionText = `Your bill is significantly higher (+RM ${Math.round(diff)} vs estimate). High-drain appliances from your profile (${culpritLabel}) may have operated for extra hours outside your scheduled routine.`;
    }

    return {
      discrepancyRm: diff,
      discrepancyPct: pct,
      discrepancyType: 'major_over_estimate',
      conclusion: conclusionText,
      culpritAppliances: culpritApp ? [culpritApp.name] : ['Air Conditioner'],
      culpritHabits: ['Leaving cooling appliances active while away', 'Running air conditioning below 24°C'],
      actionRecommendation: `Review your away schedule in the Simulator and ensure air conditioners use a 1-hour sleep timer.`,
      severity: 'major',
      estimatedCostRm,
      actualCostRm,
      utilityType: 'electricity',
    };
  }

  // Water analysis
  if (diff <= 4) {
    return {
      discrepancyRm: diff,
      discrepancyPct: pct,
      discrepancyType: diff < -4 ? 'under_estimate' : 'matches_estimate',
      conclusion: `Your water bill of RM ${actualCostRm.toFixed(2)} aligns nicely with your routine estimate of RM ${estimatedCostRm.toFixed(2)}. Great water conservation habits!`,
      culpritAppliances: [],
      culpritHabits: [],
      actionRecommendation: 'Maintain your current daily shower routine.',
      severity: 'normal',
      estimatedCostRm,
      actualCostRm,
      utilityType: 'water',
    };
  }

  if (diff <= 16) {
    // Water minor (~RM 5 to RM 15 over estimate): minor habits (longer shower, dripping faucet, running tap)
    const showerBlock = routineProfile.routineBlocks.find(
      (b) => b.iconType === 'shower' || b.name.toLowerCase().includes('shower')
    );
    const minShower = showerBlock?.minutesPerShower || 8;

    return {
      discrepancyRm: diff,
      discrepancyPct: pct,
      discrepancyType: 'minor_over_estimate',
      conclusion: `Your bill is RM ${Math.round(diff)} higher than your routine estimate. Based on your profile, minor habits like a dripping faucet, leaving the tap running while brushing teeth, or a slightly longer shower than your scheduled ${minShower}-minute routine might be the cause.`,
      culpritAppliances: ['Bathroom Sink / Tap', 'Water Heater Shower'],
      culpritHabits: ['Longer showers than scheduled', 'Running tap while brushing teeth', 'Slow faucet drip'],
      actionRecommendation: `Inspect bathroom and kitchen tap aerators for minor drips and aim to keep showers within ${minShower} minutes.`,
      severity: 'minor',
      estimatedCostRm,
      actualCostRm,
      utilityType: 'water',
    };
  }

  // Water major (> RM 16 over estimate): severe issues (concealed pipe leakage, running toilet flapper)
  return {
    discrepancyRm: diff,
    discrepancyPct: pct,
    discrepancyType: 'major_over_estimate',
    conclusion: `Your bill is significantly higher (+RM ${Math.round(diff)} vs estimate). This large discrepancy strongly suggests severe issues like a concealed pipe leakage or a continuously running toilet flapper in your bathroom fixtures.`,
    culpritAppliances: ['Toilet Cistern & Flapper', 'Concealed Water Piping'],
    culpritHabits: ['Undetected plumbing leakages'],
    actionRecommendation: 'Perform a water meter leak test: close all taps and observe if your water meter continues spinning.',
    severity: 'major',
    estimatedCostRm,
    actualCostRm,
    utilityType: 'water',
  };
}

/**
 * Produces the client-side offline fallback for routine analysis. Gemini-backed
 * bill analysis is performed by the authenticated analyze-bill Edge Function;
 * this client module must never read an API key or call Gemini directly.
 */
export async function analyzeBillRoutineWithGemini(
  billData: BillRoutineInput,
  routineProfile: SimulatorRoutineProfile
): Promise<AIRoutineAnalysisResult> {
  return generateLocalRoutineAnalysis(billData, routineProfile);
}
