/**
 * SCN-02 / Appendix B (Feature_Requirements.md)
 * Water bill anomaly & leak detection logic.
 *
 * Rules:
 * - Level is the higher of MoM level and Volume level.
 * - MoM % is rounded to a whole percent first.
 * - Volume thresholds are scaled by (residents / 3).
 * - First bill (no MoM): uses volume check only.
 * - The bill RM amount does not affect the level.
 */

export type WaterAlertLevel = 'normal' | 'minor_drip' | 'leak_detected' | 'major_pipe_burst';

export interface WaterLevelInput {
  volumeM3: number;
  momPercent?: number | null;
  residents?: number;
}

const LEVEL_RANK: Record<WaterAlertLevel, number> = {
  normal: 0,
  minor_drip: 1,
  leak_detected: 2,
  major_pipe_burst: 3,
};

export function getMoMWaterLevel(momPercent: number): WaterAlertLevel {
  const rounded = Math.round(momPercent);
  if (rounded >= 100) return 'major_pipe_burst';
  if (rounded >= 30) return 'leak_detected';
  if (rounded >= 20) return 'minor_drip';
  return 'normal';
}

export function getVolumeWaterLevel(volumeM3: number, residents: number = 3): WaterAlertLevel {
  const scale = residents / 3;
  const minorThreshold = 22 * scale;
  const leakThreshold = 30 * scale;

  if (volumeM3 >= leakThreshold) return 'leak_detected';
  if (volumeM3 > minorThreshold) return 'minor_drip';
  return 'normal';
}

export function calculateWaterAlertLevel(input: WaterLevelInput): WaterAlertLevel {
  const residents = input.residents ?? 3;
  const volumeLevel = getVolumeWaterLevel(input.volumeM3, residents);

  if (input.momPercent === undefined || input.momPercent === null) {
    return volumeLevel;
  }

  const momLevel = getMoMWaterLevel(input.momPercent);

  return LEVEL_RANK[momLevel] >= LEVEL_RANK[volumeLevel] ? momLevel : volumeLevel;
}
