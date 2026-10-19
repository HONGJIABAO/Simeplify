/**
 * BIN-01, BIN-02, COM-03, SIM-01
 * Central mock data for Simeplify / EcoTwin.
 * Source: docs/frontend_Implementation.md section 7, docs/page_refined.md.
 *
 * One set of numbers everywhere. RM amounts that depend on kWh must come from
 * billCalc when it is wired. Until then, the values here are the spec examples.
 *
 * TODO(open-item 1): COMMUNITY_MONTH_TARGET_PTS and HOUSEHOLD_MILESTONE_PTS are mock examples.
 */

import { HOUSEHOLD_MILESTONE_PTS, LEAF_DAILY_DEED_CAP, SHOW_CO2_CARD } from './flags';
export { SHOW_CO2_CARD };

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------
export const mockHousehold = {
  id: 'hh-001',
  name: 'Mei Ling Tan',
  address: '18 Jalan SS 2/6',
  city: 'Petaling Jaya',
  state: 'Selangor',
  residents: 3,
  rooms: [
    { id: 'room-1', type: 'living' as const, name: 'Living room' },
    { id: 'room-2', type: 'kitchen' as const, name: 'Kitchen' },
    { id: 'room-3', type: 'bedroom' as const, name: 'Bedroom 1' },
    { id: 'room-4', type: 'bathroom' as const, name: 'Bathroom' },
  ],
};

// ---------------------------------------------------------------------------
// Bin types and guide
// ---------------------------------------------------------------------------
export type BinType = 'paper' | 'plastic' | 'glass_metal' | 'general';

export interface BinInfo {
  type: BinType;
  name: string;
  color: string;
  textColor: string;
  points: number;
  recyclable: boolean;
  examples: string;
}

export const BIN_GUIDE: BinInfo[] = [
  {
    type: 'paper',
    name: 'Paper',
    color: '#d4a373', // tan-400
    textColor: '#292524', // stone-800
    points: 10,
    recyclable: true,
    examples: 'Clean cardboard, envelopes, egg cartons, unlined paper',
  },
  {
    type: 'plastic',
    name: 'Plastic',
    color: '#a8b896', // sage-300
    textColor: '#292524', // stone-800
    points: 10,
    recyclable: true,
    examples: 'Bottles, clean jugs, rinsed shampoo containers, rigid tubs',
  },
  {
    type: 'glass_metal',
    name: 'Glass & Metal',
    color: '#5c4033', // brown
    textColor: '#fafaf9', // stone-50
    points: 10,
    recyclable: true,
    examples: 'Clean tins, glass jars, metal lids, beverage cans',
  },
  {
    type: 'general',
    name: 'General waste',
    color: '#566549', // sage-600
    textColor: '#fafaf9', // stone-50
    points: 0,
    recyclable: false,
    examples: 'Food scraps, soiled wrapping, non-recyclable items',
  },
];

export function getBinInfo(type: BinType): BinInfo {
  return BIN_GUIDE.find((b) => b.type === type) ?? BIN_GUIDE[3];
}

// ---------------------------------------------------------------------------
// Eco progress (Bin home hero)
// ---------------------------------------------------------------------------
export const mockEcoProgress = {
  points: 340,
  milestoneTarget: HOUSEHOLD_MILESTONE_PTS, // TODO(open-item 1)
  itemsDiverted: 34,
  // TODO(open-item 10): CO2 factor not defined. SHOW_CO2_CARD = false.
  co2Prevented: SHOW_CO2_CARD ? 3.4 : null,
  pointsPerItem: 10,
  milestoneName: 'Community Tree Milestone',
};

// ---------------------------------------------------------------------------
// Recent scans
// ---------------------------------------------------------------------------
export interface RecentScan {
  id: string;
  itemName: string;
  binType: BinType;
  points: number;
  date: string; // display string
}

export const mockRecentScans: RecentScan[] = [
  { id: 'scan-1', itemName: 'Oat Milk Carton', binType: 'paper', points: 10, date: 'Today, 11:30 AM' },
  { id: 'scan-2', itemName: 'Glass Olive Jar', binType: 'glass_metal', points: 10, date: 'Yesterday' },
  { id: 'scan-3', itemName: 'Banana Peel', binType: 'general', points: 0, date: 'Yesterday' },
  { id: 'scan-4', itemName: 'PET Water Bottle', binType: 'plastic', points: 10, date: '2 days ago' },
];

// ---------------------------------------------------------------------------
// Classify waste result (from mock service)
// ---------------------------------------------------------------------------
export interface ClassifyWasteResult {
  itemName: string;
  binType: BinType;
  recyclable: boolean;
  confidence: number; // 0 to 1
  material: string; // short text, e.g. "Paper Carton"
  tip: string; // short separation tip
}

// Pre-built results for each bin type
export const mockScanResults: Record<BinType, ClassifyWasteResult> = {
  paper: {
    itemName: 'Plant-based Beverage Carton',
    binType: 'paper',
    recyclable: true,
    confidence: 0.98,
    material: 'Paper Carton',
    tip: 'Rinse cleanly with cold water and flatten to save bin capacity.',
  },
  plastic: {
    itemName: 'PET Water Bottle',
    binType: 'plastic',
    recyclable: true,
    confidence: 0.95,
    material: 'PET Plastic',
    tip: 'Remove the cap and label. Rinse and crush before recycling.',
  },
  glass_metal: {
    itemName: 'Glass Olive Jar',
    binType: 'glass_metal',
    recyclable: true,
    confidence: 0.97,
    material: 'Glass',
    tip: 'Rinse the jar. Metal lids can go in the same bin.',
  },
  general: {
    itemName: 'Banana Peel',
    binType: 'general',
    recyclable: false,
    confidence: 0.99,
    material: 'Organic Waste',
    tip: 'Food scraps go to general waste. Consider composting at home.',
  },
};

// ---------------------------------------------------------------------------
// Profile (PRO-01)
// ---------------------------------------------------------------------------
export const mockProfileData = {
  /** Display address: street first, fallback to city + state. */
  addressDisplay: mockHousehold.address
    ? `${mockHousehold.address}, ${mockHousehold.city}`
    : `${mockHousehold.city}, ${mockHousehold.state}`,
  /** Total household appliances (mock number from page_refined.md S8). */
  applianceCount: 14,
  /** Summary row values strictly matching docs/screenshot/profile/Profile.png */
  savingsYear: 420,
  ecoPoints: 1840,
  ecoRating: '5.0',
  ecoTier: 'Top Tier',
};

// ---------------------------------------------------------------------------
// Deeds state (for daily limit)
// ---------------------------------------------------------------------------
export const mockDeedsToday = {
  count: 1, // Current deeds today. Update via confirmDisposal mock service.
  cap: LEAF_DAILY_DEED_CAP, // TODO(open-item 17)
};
