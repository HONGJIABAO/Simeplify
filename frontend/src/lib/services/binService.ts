/**
 * BIN-01, BIN-02
 * Mock service for waste classification and disposal confirmation.
 * Source: docs/Workflow.md W4, docs/frontend_Implementation.md section 7.
 *
 * Screens never write points or deeds (AGENT.md rule 2).
 * Only these service functions change them.
 *
 * Each function is marked // MOCK and returns after a short delay.
 * The real replacement will be Supabase Edge Function calls.
 */

// MOCK
import {
  type BinType,
  type ClassifyWasteResult,
  mockScanResults,
  mockDeedsToday,
  mockEcoProgress,
  getBinInfo,
} from '../mockData';
import { LEAF_DAILY_DEED_CAP } from '../flags';

export interface ConfirmDisposalResult {
  pointsAwarded: number;
  totalPoints: number;
  deedsToday: number;
  dailyLimitReached: boolean;
}

/**
 * classifyWaste - Mock Edge Function call.
 * In production: uploads photo to Storage, calls the classify_waste Edge Function
 * which sends the image to Gemini and returns the classification.
 *
 * @param _photoUri - unused in mock; the photo path
 * @param resultType - which mock result to return (for dev gallery / testing)
 * @returns ClassifyWasteResult after a simulated delay
 */
// MOCK
export async function classifyWaste(
  _photoUri: string,
  resultType: BinType = 'paper'
): Promise<ClassifyWasteResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { ...mockScanResults[resultType] };
}

/**
 * classifyWasteLowConfidence - Mock: returns a low-confidence result.
 * In production: same Edge Function, the confidence field decides the UI.
 */
// MOCK
export async function classifyWasteLowConfidence(
  _photoUri: string
): Promise<ClassifyWasteResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    itemName: 'Unknown Item',
    binType: 'general',
    recyclable: false,
    confidence: 0.35,
    material: 'Unknown',
    tip: 'We could not identify this item clearly.',
  };
}

/**
 * classifyWasteError - Mock: simulates an AI error / timeout.
 */
// MOCK
export async function classifyWasteError(_photoUri: string): Promise<never> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  throw new Error('AI classification failed. Please try again.');
}

/**
 * confirmDisposal - Mock Edge Function call.
 * In production: calls confirm_disposal Edge Function which adds points and
 * records the deed in the database.
 *
 * AGENT.md rule 2: Points and deeds are written only by the database or an
 * Edge Function, never by the app. This mock simulates the server behavior.
 *
 * @param scanId - the scan record ID
 * @param binType - the bin the item was sorted into
 */
// MOCK
export async function confirmDisposal(
  _scanId: string,
  binType: BinType
): Promise<ConfirmDisposalResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const binInfo = getBinInfo(binType);
  const isRecyclable = binInfo.recyclable;
  const isDailyLimitReached = mockDeedsToday.count >= LEAF_DAILY_DEED_CAP;

  let pointsAwarded = 0;
  if (isRecyclable && !isDailyLimitReached) {
    pointsAwarded = 10;
    // Simulate the server-side mutation
    mockDeedsToday.count += 1;
    mockEcoProgress.points += pointsAwarded;
    mockEcoProgress.itemsDiverted += 1;
  } else if (isRecyclable && isDailyLimitReached) {
    // Deed is recorded but with 0 points (COM-03 rule: first 3 deeds give points)
    pointsAwarded = 0;
    mockDeedsToday.count += 1;
    mockEcoProgress.itemsDiverted += 1;
  }
  // General waste: 0 points, no deed

  return {
    pointsAwarded,
    totalPoints: mockEcoProgress.points,
    deedsToday: mockDeedsToday.count,
    dailyLimitReached: mockDeedsToday.count >= LEAF_DAILY_DEED_CAP,
  };
}
