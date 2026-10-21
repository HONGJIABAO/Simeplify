/** SIM-05 — pure tray ordering and responsive sizing rules. */
export interface TrayCatalogRow {
  id: string;
  in_tray: boolean;
  sort_order: number;
}

export function getInTrayTypeIds(rows: readonly TrayCatalogRow[]): string[] {
  return [...rows]
    .filter((row) => row.in_tray)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((row) => row.id);
}

export function getTrayTileWidth(trayWidth: number): number {
  return Math.max(68, (trayWidth - 32) / 4.4);
}

export function getEditLayoutMetrics(screenWidth: number, screenHeight: number) {
  const trayHeight = Math.min(150, screenHeight * 0.22);
  // The live page reserves 218 px for safe-area, bill/top controls and task row,
  // 64 px for the tab bar, and the tray plus its 8 px gap.
  const planOuterSide = Math.min(screenWidth - 32, screenHeight - 218 - 64 - trayHeight - 8);
  return {
    trayHeight,
    planOuterSide: Math.max(178, planOuterSide),
    planCanvasSide: Math.max(160, planOuterSide - 18),
    hideCurrentTask: planOuterSide - 18 < 280,
  };
}
