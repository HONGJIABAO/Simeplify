/**
 * Simulator-only presentation targets for the Bill Card.
 *
 * The tariff calculation remains the source of truth for real billing. These
 * values only keep the demo card in the requested range while the local mock
 * household has a small calculated load.
 */
export const SIMULATOR_BILL_CARD_BASELINE_RM = 520;
export const SIMULATOR_SOLAR_REDUCTION_RATE = 0.16;

export function getSimulatorBillCardMonthlyTotal(
  calculatedMonthlyBillRm: number,
  solarApplied: boolean,
): number {
  const calculated = Number.isFinite(calculatedMonthlyBillRm)
    ? Math.max(0, Math.round(calculatedMonthlyBillRm))
    : 0;
  const beforeSolar = Math.max(SIMULATOR_BILL_CARD_BASELINE_RM, calculated);

  return solarApplied
    ? Math.max(400, Math.round(beforeSolar * (1 - SIMULATOR_SOLAR_REDUCTION_RATE)))
    : beforeSolar;
}
