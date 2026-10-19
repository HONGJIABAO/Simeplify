/**
 * SCN-01 / SIM-01
 * Formatter utilities for Simeplify.
 * Rules:
 * - Money format: RM 1,500 (thousands separator, no decimals unless needed)
 */

export function formatMoney(amount: number, showDecimals: boolean = false): string {
  if (showDecimals) {
    return `RM ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `RM ${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatUsage(value: number, type: 'electricity' | 'water'): string {
  if (type === 'electricity') {
    return `${Math.round(value)} kWh`;
  }
  return `${value} m³`;
}
