/**
 * SIM-01, SIM-05, BIN-01, BIN-02, COM-01, COM-02, COM-03, SCN-01, SCN-02, SCN-03, PRO-01
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
  { id: 'living', name: 'Living room', type: 'living',   gridCol: 0, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'kitchen', name: 'Kitchen',   type: 'kitchen',  gridCol: 2, gridRow: 0, gridColSpan: 2, gridRowSpan: 2 },
  { id: 'bedroom', name: 'Bedroom',   type: 'bedroom',  gridCol: 0, gridRow: 2, gridColSpan: 2, gridRowSpan: 2 },
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
