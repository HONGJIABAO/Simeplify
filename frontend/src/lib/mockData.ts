/**
 * SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06, SIM-07,
 * BIN-01, BIN-02, COM-01, COM-02, COM-03, SCN-01, SCN-02, SCN-03, PRO-01
 *
 * Central mock data file for all screens and development galleries.
 * Source: docs/frontend_Implementation.md §7, docs/page_refined.md §2.
 *
 * One set of numbers everywhere. RM amounts that follow from kWh come from billCalc.
 * AI text uses only numbers from this file.
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
  email: 'meiling.tan@example.com',
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

export const MOCK_HOUSEHOLD = {
  name: 'Mei Ling Tan',
  email: 'meiling.tan@example.com',
  address: {
    street: '18, Jalan SS 2/6',
    city: 'Petaling Jaya',
    state: 'Selangor',
    display: 'Petaling Jaya, Selangor',
  },
  residents: 3,
  onboardingDone: true,
} as const;

// ---------------------------------------------------------------------------
// Rooms (ONB-02 / SIM-05)
// ---------------------------------------------------------------------------
export type Room = {
  id: string;
  name: string;
  type: 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'corridor';
  /** Grid position (column, row, col-span, row-span) in a 4-col × 4-row grid */
  gridCol: number;
  gridRow: number;
  gridColSpan: number;
  gridRowSpan: number;
};

export const MOCK_ROOMS: Room[] = [
  { id: 'living', name: 'Living room', type: 'living',   gridCol: 0, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'kitchen', name: 'Kitchen',   type: 'kitchen',  gridCol: 2, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'bedroom', name: 'Bedroom',   type: 'bedroom',  gridCol: 0, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'bathroom', name: 'Bathroom', type: 'bathroom', gridCol: 2, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 },
];

// ---------------------------------------------------------------------------
// Appliances (ONB-03 / SIM-01 / SIM-02)
// ---------------------------------------------------------------------------
export type ApplianceType =
  | 'air_conditioner'
  | 'refrigerator'
  | 'water_heater'
  | 'tv'
  | 'fan'
  | 'lights';

export type Appliance = {
  id: string;
  name: string;
  type: ApplianceType;
  brand: string;
  /** Wattage (W) */
  wattage: number;
  /** 1–5; 3 = "Not sure" */
  stars: number;
  roomId: string;
  /** Position inside the floor plan canvas (0–1 normalised) */
  posX: number;
  posY: number;
  /** Runs when nobody is home (fridge, router) */
  alwaysOn: boolean;
  /** Color segment in the bill modal bar */
  color: string;
};

export const MOCK_APPLIANCES: Appliance[] = [
  {
    id: 'ac1',
    name: 'Panasonic Air Conditioner',
    type: 'air_conditioner',
    brand: 'Panasonic',
    wattage: 1200,
    stars: 3,
    roomId: 'bedroom',
    posX: 0.25,
    posY: 0.65,
    alwaysOn: false,
    color: '#d4a373', // tan-400
  },
  {
    id: 'wh1',
    name: 'Water heater',
    type: 'water_heater',
    brand: 'Rheem',
    wattage: 3500,
    stars: 3,
    roomId: 'bathroom',
    posX: 0.7,
    posY: 0.75,
    alwaysOn: false,
    color: '#8b9d77', // sage-400
  },
  {
    id: 'fridge1',
    name: 'Inverter Fridge',
    type: 'refrigerator',
    brand: 'Sharp',
    wattage: 100,
    stars: 4,
    roomId: 'kitchen',
    posX: 0.65,
    posY: 0.25,
    alwaysOn: true,
    color: '#5c4033', // brown
  },
  {
    id: 'fan1',
    name: 'Table Fan',
    type: 'fan',
    brand: 'Panasonic',
    wattage: 50,
    stars: 3,
    roomId: 'bedroom',
    posX: 0.15,
    posY: 0.75,
    alwaysOn: false,
    color: '#a8b896', // sage-300
  },
  {
    id: 'lights1',
    name: 'Philips LED Lights',
    type: 'lights',
    brand: 'Philips',
    wattage: 20,
    stars: 5,
    roomId: 'living',
    posX: 0.2,
    posY: 0.2,
    alwaysOn: false,
    color: '#f6e8d8', // tan-100 (with stone-800 text)
  },
];

// ---------------------------------------------------------------------------
// Bill mock numbers
// kWh is the source; RM amounts are computed by billCalc.
// One set of numbers everywhere (page_refined.md §4).
// ---------------------------------------------------------------------------
export const MOCK_MONTHLY_KWH = 525; // → RM 233 from billCalc (no AFA)

// Appliance breakdown (kWh/month) — totals to MOCK_MONTHLY_KWH
export const MOCK_APPLIANCE_KWH: Record<string, number> = {
  ac1: 284,      // ~54% of bill
  wh1: 105,      // ~20%
  fridge1: 100,  // ~19%
  fan1: 18,      // ~3%
  lights1: 18,   // ~2%  (remaining)
};

// ---------------------------------------------------------------------------
// Historical bills (Jun–Oct)
// ---------------------------------------------------------------------------
export type Bill = {
  month: string;       // e.g. "2026-10"
  label: string;       // e.g. "Oct"
  electricityKwh: number;
  /** m³ */
  waterM3: number;
};

export const MOCK_BILLS: Bill[] = [
  { month: '2026-06', label: 'Jun', electricityKwh: 420, waterM3: 17 },
  { month: '2026-07', label: 'Jul', electricityKwh: 450, waterM3: 16 },
  { month: '2026-08', label: 'Aug', electricityKwh: 480, waterM3: 18 },
  { month: '2026-09', label: 'Sep', electricityKwh: 510, waterM3: 12 }, // base for Oct +48%
  { month: '2026-10', label: 'Oct', electricityKwh: 525, waterM3: 18 }, // +48% MoM → Leak detected
];

// ---------------------------------------------------------------------------
// Bin types and guide (BIN-01, BIN-02)
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
// Community / points (COM-01, COM-02, COM-03)
// ---------------------------------------------------------------------------
export const MOCK_POINTS = {
  recycling: 200,
  energy: 140,
  total: 340,
};

export const MOCK_DEEDS_TODAY = 1; // Healthy stage

export const mockDeedsToday = {
  count: 1, // Current deeds today. Update via confirmDisposal mock service.
  cap: LEAF_DAILY_DEED_CAP, // TODO(open-item 17)
};

export const MOCK_HOUSEHOLDS_COUNT = 240;
export const MOCK_HOUSEHOLDS_VOTED = 184;
export const MOCK_NEIGHBOURHOOD_POINTS = 42850;

// ---------------------------------------------------------------------------
// Notifications (NOT-01)
// ---------------------------------------------------------------------------
export type Notification = {
  id: string;
  type: 'water_anomaly' | 'voting_open' | 'result_ready';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  route: string;
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'water_anomaly',
    title: 'Anomaly detected',
    body: 'Water bill up 48% vs September. Check the toilet cistern seal and outdoor pipes.',
    timestamp: '2026-10-19T10:00:00+08:00',
    read: false,
    route: '/(tabs)/scanner',
  },
  {
    id: 'n2',
    type: 'voting_open',
    title: 'Voting is open',
    body: 'Your monthly community ballot is ready. Cast your household vote now.',
    timestamp: '2026-10-01T09:00:00+08:00',
    read: true,
    route: '/(tabs)/community',
  },
];
