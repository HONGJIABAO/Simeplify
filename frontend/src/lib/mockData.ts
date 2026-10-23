/**
 * SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06, SIM-07,
 * BIN-01, BIN-02, COM-01, COM-02, COM-03, SCN-01, SCN-02, SCN-03, SCN-04, PRO-01
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
import { MOCK_SIMULATOR_ITEMS } from '@/features/simulator/logic/mockHomeData';
import { createDefaultRooms } from '@/features/simulator/logic/roomData';
import {
  BIN_CATEGORY_COLORS,
  BIN_ICON_TEXT_COLOR,
  resolveBinVisualCategory,
} from '@/features/bin/logic/binColors';
import type { StoredRoom } from '@/features/simulator/logic/storage';

export const WORKPLACE_DEFAULT_WATTS = 80;
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

export const HOUSEHOLD_PROFILE = {
  name: 'Mei Ling Tan',
  address: '18, Jalan SS 2/6, Petaling Jaya',
  district: 'Petaling Jaya, Selangor',
  residents: 3,
};

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
  { id: 'living', name: 'Living room', type: 'living', gridCol: 0, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'kitchen', name: 'Kitchen', type: 'kitchen', gridCol: 2, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'bedroom', name: 'Bedroom', type: 'bedroom', gridCol: 0, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'bathroom', name: 'Bathroom', type: 'bathroom', gridCol: 2, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 },
];

/** Stage 6/7 two-floor mock: floor 1 is fully set up; floor 2 has two dark rooms. */
export const MOCK_SIMULATOR_ROOMS: StoredRoom[] = createDefaultRooms();

// ---------------------------------------------------------------------------
// Appliances (ONB-03 / SIM-01 / SIM-02)
// ---------------------------------------------------------------------------
export type ApplianceType =
  | 'air_conditioner'
  | 'refrigerator'
  | 'water_heater'
  | 'tv'
  | 'fan'
  | 'lights'
  | 'workplace';

export type Appliance = {
  spriteKey?: string;
  isOn?: boolean;
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

export {
  type RawSpecItem,
  RAW_SPEC_APPLIANCES,
  RAW_SPEC_FURNITURE,
  SKIPPED_ITEM_TYPES,
  MOCK_FLOOR2_EXTRA_ITEMS,
  MOCK_SIMULATOR_ITEMS,
  MOCK_SIMULATOR_ITEMS_ALL,
} from '@/features/simulator/logic/mockHomeData';

export const MOCK_APPLIANCES: Appliance[] = MOCK_SIMULATOR_ITEMS
  .filter((item) => item.category === 'Appliances')
  .map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type as ApplianceType,
    brand: item.brand ?? '',
    wattage: item.wattage ?? 100,
    stars: item.stars ?? 3,
    roomId: item.roomId,
    posX: item.posX,
    posY: item.posY,
    alwaysOn: Boolean(item.alwaysOn),
    color: item.color ?? '#8b9d77',
    spriteKey: item.spriteKey,
  }));

// ---------------------------------------------------------------------------
// Bill mock numbers
// kWh is the source; RM amounts are computed by billCalc.
// Total from current furnished appliances: 773 kWh (max bill: RM 353.32)
// ---------------------------------------------------------------------------
export const MOCK_MONTHLY_KWH = 773;

// Appliance breakdown (kWh/month) — totals to MOCK_MONTHLY_KWH
export const MOCK_APPLIANCE_KWH: Record<string, number> = {
  'f2-ac-master': 276,
  'f1-ac-living': 245,
  'f1-fridge-kitchen': 108,
  'f1-wh-bath': 105,
  'f2-workplace-bed2': 19,
  'f1-tv-living': 11,
  'f1-lamp-living': 2,
  'f1-lamp-kitchen': 2,
  'f2-lamp-master': 2,
  'f1-lamp-bed1': 1,
  'f2-lamp-bed2': 1,
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

export { BIN_CATEGORY_COLORS } from '@/features/bin/logic/binColors';

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
    color: BIN_CATEGORY_COLORS.paper,
    textColor: BIN_ICON_TEXT_COLOR,
    points: 10,
    recyclable: true,
    examples: 'Clean cardboard, envelopes, egg cartons, unlined paper',
  },
  {
    type: 'plastic',
    name: 'Plastic & Metal',
    color: BIN_CATEGORY_COLORS.plasticMetal,
    textColor: BIN_ICON_TEXT_COLOR,
    points: 10,
    recyclable: true,
    examples: 'Bottles, cans, clean jugs, metal lids, rigid tubs',
  },
  {
    type: 'glass_metal',
    name: 'Glass',
    color: BIN_CATEGORY_COLORS.glass,
    textColor: BIN_ICON_TEXT_COLOR,
    points: 10,
    recyclable: true,
    examples: 'Glass jars, glass bottles, clean glass containers',
  },
  {
    type: 'general',
    name: 'General waste',
    color: BIN_CATEGORY_COLORS.general,
    textColor: BIN_ICON_TEXT_COLOR,
    points: 0,
    recyclable: false,
    examples: 'Food scraps, soiled wrapping, non-recyclable items',
  },
];

export function getBinInfo(type: BinType | string): BinInfo {
  return BIN_GUIDE.find((b) => b.type === type) ?? BIN_GUIDE[3];
}

/**
 * Resolve the visual category without changing the legacy persisted bin type.
 * Metal belongs to the orange Plastic & Metal stream; glass remains brown.
 */
export function getBinVisualInfo(
  type: BinType | string,
  material = '',
  itemName = '',
): BinInfo {
  const visualCategory = resolveBinVisualCategory(type, material, itemName);
  const legacyType = visualCategory === 'plastic'
    ? 'plastic'
    : visualCategory === 'glass'
      ? 'glass_metal'
      : visualCategory;
  return getBinInfo(legacyType);
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
// Scanner Types & Data (SCN-01 to SCN-04)
// ---------------------------------------------------------------------------
export interface BillRecord {
  id: string;
  type: 'electricity' | 'water';
  provider: 'TNB' | 'Air Selangor';
  month: string;
  usageValue: number;
  usageUnit: string;
  amount: number;
  status: 'normal' | 'anomaly';
  alertLevel?: 'normal' | 'minor_drip' | 'leak_detected' | 'major_pipe_burst';
  dateUploaded: string;
  aiAnalysis?: string;
}

export interface MonthlyUsageItem {
  month: string;
  label: string;
  electricityKwh: number;
  electricityRm: number;
  waterM3: number;
  waterRm: number;
  totalRm: number;
  waterAlertLevel?: 'normal' | 'minor_drip' | 'leak_detected' | 'major_pipe_burst';
  waterMomPercent?: number;
  electricityMomPercent?: number;
}

// 5 billing cycles (Jun to Oct) matching docs/screenshot/Scanner/Scanner.png
export const MONTHLY_USAGE_DATA: MonthlyUsageItem[] = [
  {
    month: '2026-06',
    label: 'Jun',
    electricityKwh: 510,
    electricityRm: 285,
    waterM3: 15,
    waterRm: 25,
    totalRm: 310,
    waterAlertLevel: 'normal',
    waterMomPercent: 0,
    electricityMomPercent: 0,
  },
  {
    month: '2026-07',
    label: 'Jul',
    electricityKwh: 520,
    electricityRm: 298,
    waterM3: 16,
    waterRm: 27,
    totalRm: 325,
    waterAlertLevel: 'normal',
    waterMomPercent: 6.7,
    electricityMomPercent: 4.5,
  },
  {
    month: '2026-08',
    label: 'Aug',
    electricityKwh: 535,
    electricityRm: 322,
    waterM3: 16.5,
    waterRm: 28,
    totalRm: 350,
    waterAlertLevel: 'normal',
    waterMomPercent: 3.1,
    electricityMomPercent: 8.0,
  },
  {
    month: '2026-09',
    label: 'Sep',
    electricityKwh: 550,
    electricityRm: 350,
    waterM3: 17,
    waterRm: 30,
    totalRm: 380,
    waterAlertLevel: 'normal',
    waterMomPercent: 3.0,
    electricityMomPercent: 8.6,
  },
  {
    month: '2026-10',
    label: 'Oct',
    electricityKwh: 340,
    electricityRm: 340,
    waterM3: 18,
    waterRm: 80,
    totalRm: 420,
    waterAlertLevel: 'leak_detected',
    waterMomPercent: 48,
    electricityMomPercent: 12,
  },
];

export const MOCK_BILL_ARCHIVE: BillRecord[] = [
  {
    id: 'bill-oct-water',
    type: 'water',
    provider: 'Air Selangor',
    month: 'October 2026',
    usageValue: 18,
    usageUnit: 'm³',
    amount: 80,
    status: 'anomaly',
    alertLevel: 'leak_detected',
    dateUploaded: '2026-10-18',
    aiAnalysis: 'Water usage surged 48% vs September. Potential toilet cistern leak detected.',
  },
  {
    id: 'bill-oct-elec',
    type: 'electricity',
    provider: 'TNB',
    month: 'October 2026',
    usageValue: 340,
    usageUnit: 'kWh',
    amount: 340,
    status: 'normal',
    alertLevel: 'normal',
    dateUploaded: '2026-10-17',
    aiAnalysis: 'Electricity consumption steady with a 12% rise vs previous month.',
  },
  {
    id: 'bill-sep-water',
    type: 'water',
    provider: 'Air Selangor',
    month: 'September 2026',
    usageValue: 17,
    usageUnit: 'm³',
    amount: 30,
    status: 'normal',
    alertLevel: 'normal',
    dateUploaded: '2026-09-19',
    aiAnalysis: 'Normal baseline water usage for 3 residents.',
  },
  {
    id: 'bill-sep-elec',
    type: 'electricity',
    provider: 'TNB',
    month: 'September 2026',
    usageValue: 550,
    usageUnit: 'kWh',
    amount: 350,
    status: 'normal',
    alertLevel: 'normal',
    dateUploaded: '2026-09-18',
    aiAnalysis: 'Electricity within typical terrace household benchmark.',
  },
  {
    id: 'bill-aug-elec',
    type: 'electricity',
    provider: 'TNB',
    month: 'August 2026',
    usageValue: 535,
    usageUnit: 'kWh',
    amount: 322,
    status: 'normal',
    alertLevel: 'normal',
    dateUploaded: '2026-08-20',
    aiAnalysis: 'Stable seasonal consumption.',
  },
];

export const MOCK_AI_ANALYSIS = {
  summary:
    'Your baseline electricity is steady at 28 kWh/day. A noticeable surge occurs on weekend afternoons due to air conditioning usage.',
  peakElectricityKwh: 340,
  electricityChangePct: 12,
  baseWaterM3: 18,
  waterChangePct: 48,
  isAnomaly: true,
  actionTips: [
    {
      id: 'tip-1',
      category: 'energy',
      icon: 'leaf',
      title: 'Air conditioner optimization',
      description: 'Set master bedroom AC timer to 26°C with ceiling fan assistance (Save ~RM 35/mo).',
    },
    {
      id: 'tip-2',
      category: 'water',
      icon: 'drop',
      title: 'Silent leak check',
      description: 'Inspect toilet cistern seal in downstairs guest bath for silent leak.',
    },
  ],
  footerDisclaimer:
    'Calculated based on TNB Domestic Tariff Schedule A and Air Selangor residential rates.',
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
