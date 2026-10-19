/**
 * SCN-01 / SCN-02 / SCN-03 / SCN-04
 * Standardized mock data for Simeplify / EcoTwin.
 * Source: docs/frontend_Implementation.md Section 7 & docs/page_refined.md
 */

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

export const HOUSEHOLD_PROFILE = {
  name: 'Mei Ling Tan',
  address: '18, Jalan SS 2/6, Petaling Jaya',
  district: 'Petaling Jaya, Selangor',
  residents: 3,
};

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
    // Screenshot: Oct total RM 420 with red spike indicator on water bar
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
