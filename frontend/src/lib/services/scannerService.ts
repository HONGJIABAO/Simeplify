/**
 * SCN-01 / SCN-02 / SCN-03 / W5 Scanner Workflow
 * Mock service mirroring Edge Functions for bill scanning, analysis, and energy points.
 * Rule: Screens never write points directly; only services simulate this.
 */

import { MOCK_AI_ANALYSIS } from '../mockData';

export interface ExtractedBillData {
  billType: 'electricity' | 'water';
  provider: 'TNB' | 'Air Selangor';
  billingMonth: string;
  usageValue: number;
  usageUnit: string;
  amount: number;
}

export interface AIAnalysisResult {
  summary: string;
  peakElectricityKwh: number;
  electricityChangePct: number;
  baseWaterM3: number;
  waterChangePct: number;
  isAnomaly: boolean;
  actionTips: {
    id: string;
    category: string;
    icon: string;
    title: string;
    description: string;
  }[];
  footerDisclaimer: string;
}

/**
 * MOCK: Simulates Edge Function read_bill
 */
export async function readBill(fileUri: string): Promise<ExtractedBillData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Default mock extraction: October 2026 Air Selangor bill with leak
  return {
    billType: 'water',
    provider: 'Air Selangor',
    billingMonth: 'October 2026',
    usageValue: 18,
    usageUnit: 'm³',
    amount: 80.0,
  };
}

/**
 * MOCK: Simulates Edge Function analyze_bill
 */
export async function analyzeBill(billId: string): Promise<AIAnalysisResult> {
  // Simulate AI latency
  await new Promise((resolve) => setTimeout(resolve, 900));
  return MOCK_AI_ANALYSIS;
}

/**
 * MOCK: Simulates Edge Function award_energy_points
 * Awards +50 points once per billing month when electricity bill is lower than estimate.
 */
let awardedMonths: Set<string> = new Set();

export async function awardEnergyPoints(
  billingMonth: string,
  actualKwh: number,
  estimatedKwh: number
): Promise<{ awarded: boolean; points: number; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (awardedMonths.has(billingMonth)) {
    return {
      awarded: false,
      points: 0,
      message: 'Energy points already claimed for this month.',
    };
  }

  if (actualKwh < estimatedKwh) {
    awardedMonths.add(billingMonth);
    return {
      awarded: true,
      points: 50,
      message: '+50 energy points earned for beating your estimate!',
    };
  }

  return {
    awarded: false,
    points: 0,
    message: 'Usage did not beat the estimate this month.',
  };
}
