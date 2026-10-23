/**
 * SCN-03
 * Pure scanner analysis helpers.
 *
 * Gemini network requests are intentionally not allowed in client services.
 * Bill OCR and waste classification run through authenticated Supabase Edge
 * Functions so credentials never enter the browser or native app bundle.
 */

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
