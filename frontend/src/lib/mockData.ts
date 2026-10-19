/**
 * SIM-01, SIM-05, BIN-01, BIN-02, COM-01, COM-02, COM-03, SCN-01, SCN-02, SCN-03, SCN-04, PRO-01
 * Single mock data file for all screens.
 * Source: docs/frontend_Implementation.md §7, docs/page_refined.md §2.
 *
 * RM amounts that follow from kWh come from billCalc, not typed here directly.
 * AI text uses only numbers from this file.
 */

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------
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
// Rooms (ONB-02)
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

// ---------------------------------------------------------------------------
// Appliances (ONB-03)
// ---------------------------------------------------------------------------
export type ApplianceType =
  | 'air_conditioner'
  | 'refrigerator'
  | 'water_heater'
  | 'tv'
  | 'fan'
  | 'lights';

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
// Community / points
// ---------------------------------------------------------------------------
export const MOCK_POINTS = {
  recycling: 200,
  energy: 140,
  total: 340,
};

export const MOCK_DEEDS_TODAY = 1; // Healthy stage

export const MOCK_HOUSEHOLDS_COUNT = 240;
export const MOCK_HOUSEHOLDS_VOTED = 184;
export const MOCK_NEIGHBOURHOOD_POINTS = 42850;

// ---------------------------------------------------------------------------
// Notifications
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
