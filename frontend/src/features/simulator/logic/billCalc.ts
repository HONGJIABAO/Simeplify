/**
 * SIM-01
 * Pure bill calculation logic — no UI imports.
 * Source: docs/Feature_Requirements.md Appendix A.
 *
 * Formula:
 *   generation = min(kWh, 1500) × 0.2703 + max(kWh - 1500, 0) × 0.3703
 *   capacity   = kWh × 0.0455
 *   network    = kWh × 0.1285
 *   retail     = 10 if kWh > 600, else 0
 *   afa        = kWh × afa_rate
 *   bill       = generation + capacity + network + retail + afa
 *
 * Not included in v1: Energy Efficiency Incentive, taxes, Time-of-Use.
 */

/** TNB tariff rates — from tariff_rates config (Appendix A). */
const TARIFF = {
  /** Generation charge rate for first 1,500 kWh */
  generationRate1: 0.2703,
  /** Generation charge rate above 1,500 kWh */
  generationRate2: 0.3703,
  /** Capacity charge (all kWh) */
  capacityRate: 0.0455,
  /** Network charge (all kWh) */
  networkRate: 0.1285,
  /** Retail charge (RM/month, only when kWh > 600) */
  retailCharge: 10,
  /** AFA: automatic fuel adjustment (changes monthly, default 0) */
  // TODO(open-item AFA): update monthly from tariff_rates table. Default 0.
  afaRate: 0,
} as const;

/**
 * Calculate monthly electricity bill from total kWh.
 * @param kWh Monthly energy consumption in kWh
 * @param afaRate Optional AFA override (sen/kWh). Default uses TARIFF.afaRate.
 * @returns Bill in RM (rounded to 2 decimal places)
 */
export function calcBillFromKwh(kWh: number, afaRate: number = TARIFF.afaRate): number {
  if (kWh <= 0) return 0;

  const generation =
    Math.min(kWh, 1500) * TARIFF.generationRate1 +
    Math.max(kWh - 1500, 0) * TARIFF.generationRate2;

  const capacity = kWh * TARIFF.capacityRate;
  const network = kWh * TARIFF.networkRate;
  const retail = kWh > 600 ? TARIFF.retailCharge : 0;
  const afa = kWh * afaRate;

  const bill = generation + capacity + network + retail + afa;
  return Math.round(bill * 100) / 100;
}

/**
 * Format an RM amount per design.md rule: "RM 1,500".
 */
export function formatRM(amount: number): string {
  return (
    'RM ' +
    amount.toLocaleString('en-MY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

/**
 * Appliance bill share: given kWh for this appliance and the total bill (RM),
 * returns the appliance's RM share and its percent of the total.
 */
export function applianceShare(
  appKwh: number,
  totalKwh: number,
  totalBillRm: number
): { rm: number; pct: number } {
  if (totalKwh <= 0 || totalBillRm <= 0) return { rm: 0, pct: 0 };
  const pct = Math.round((appKwh / totalKwh) * 100);
  const rm = Math.round((appKwh / totalKwh) * totalBillRm);
  return { rm, pct };
}
