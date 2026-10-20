// frontend/src/lib/shared/billCalc.ts
// Pure bill calculation logic shared between backend and frontend (SIM-01, Appendix A).
// Canonical source: supabase/functions/_shared/billCalc.ts
// Kept in sync via scripts/sync-shared.mjs and tested via tests/shared_billCalc.test.mjs.

export interface StoredApplianceItem {
  id?: string;
  type: string;
  wattage?: number;
  quantity?: number;
  stars?: number;
  alwaysOn?: boolean;
  category?: string;
  spriteKey?: string;
}

export interface ApplianceCatalogType {
  id: string;
  always_on?: boolean;
}

export interface ScheduleItem {
  day_type: 'weekday' | 'weekend';
  start_time: string;
  end_time: string;
}

export interface DayRoutineBlock {
  type?: string;
  title?: string;
  startTime: string;
  endTime: string;
  isAway?: boolean;
  roomId?: string;
  applianceIds?: string[];
}

export interface TariffRateConfig {
  generation_rate_low?: number;
  generation_rate_high?: number;
  generation_threshold_kwh?: number;
  capacity_rate?: number;
  network_rate?: number;
  retail_charge?: number;
  retail_free_limit_kwh?: number;
  afa_rate?: number;
}

export const STAR_EFFICIENCY_FACTORS: Record<number, number> = {
  1: 1.25,
  2: 1.15,
  3: 1.0,
  4: 0.88,
  5: 0.75,
};

export function parseTimeToMinutes(tStr: string): number {
  const parts = tStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export function isAwayInSlot(slotMin: number, awayList: ScheduleItem[]): boolean {
  for (const s of awayList) {
    const start = parseTimeToMinutes(s.start_time);
    const end = parseTimeToMinutes(s.end_time);
    if (end > start) {
      if (slotMin >= start && slotMin < end) return true;
    } else {
      if (slotMin >= start || slotMin < end) return true;
    }
  }
  return false;
}

export function computeHouseholdEstimateKwh(params: {
  appliances: StoredApplianceItem[];
  applianceTypes?: ApplianceCatalogType[];
  schedules?: ScheduleItem[];
  dayBlocks?: DayRoutineBlock[];
  residentsCount?: number;
  showersPerPerson?: number;
  minutesPerShower?: number;
}): {
  totalMonthlyKwh: number;
} {
  const {
    appliances,
    applianceTypes = [],
    schedules = [],
    dayBlocks = [],
    residentsCount = 3,
    showersPerPerson = 2,
    minutesPerShower = 10,
  } = params;

  const appList = appliances.filter((item) => (item.category ? item.category === 'Appliances' : true));
  if (appList.length === 0) {
    return { totalMonthlyKwh: 0 };
  }

  const typeMap = new Map(applianceTypes.map((t) => [t.id, t]));
  let totalMonthlyKwh = 0;

  // 1. Water Heater: not slot-based, calculated via showers formula (SIM-01 rule 7)
  for (const app of appList) {
    if (app.type === 'water_heater') {
      const wattage = app.wattage || 100;
      const quantity = Math.max(1, app.quantity || 1);
      const starRating = app.stars || 3;
      const starFactor = STAR_EFFICIENCY_FACTORS[starRating] || 1.0;
      const showersPerDay = Math.max(0, showersPerPerson) * Math.max(1, residentsCount);
      const minutes = Math.max(5, minutesPerShower);
      const dailyKwh = ((showersPerDay * minutes) / 60) * (wattage / 1000) * quantity;
      totalMonthlyKwh += dailyKwh * 30 * starFactor;
    }
  }

  const weekdayAway = schedules.filter((s) => s.day_type === 'weekday');
  const weekendAway = schedules.filter((s) => s.day_type === 'weekend');

  // 48 slots of 30 minutes each (0 to 1410)
  const calculateDailyKwhForSchedule = (awayList: ScheduleItem[]): number => {
    let dayKwh = 0;

    for (let slot = 0; slot < 48; slot++) {
      const slotMin = slot * 30;
      const isAway = isAwayInSlot(slotMin, awayList);

      const activeBlock =
        dayBlocks.length > 0
          ? dayBlocks.find((b) => {
              const start = parseTimeToMinutes(b.startTime);
              const end = parseTimeToMinutes(b.endTime);
              if (end > start) return slotMin >= start && slotMin < end;
              return slotMin >= start || slotMin < end;
            })
          : null;

      for (const app of appList) {
        if (app.type === 'water_heater') continue;

        const typeDef = typeMap.get(app.type);
        const wattage = app.wattage || 100;
        const quantity = Math.max(1, app.quantity || 1);
        const starRating = app.stars || 3;
        const starFactor = STAR_EFFICIENCY_FACTORS[starRating] || 1.0;
        const isAlwaysOn = Boolean(typeDef?.always_on || app.alwaysOn);

        let isOn = false;

        if (isAlwaysOn) {
          // Always-on devices run 24/7 (SIM-01 rule 4)
          isOn = true;
        } else if (isAway) {
          // Nobody home: needs_person appliances are OFF (SIM-01 rule 3)
          isOn = false;
        } else if (dayBlocks.length === 0) {
          // Before My Day configured: all appliances on during home slots (SIM-01 rule 5)
          isOn = true;
        } else if (activeBlock) {
          if (activeBlock.isAway || activeBlock.roomId === 'away') {
            isOn = false;
          } else {
            const inBlock = activeBlock.applianceIds?.some(
              (id) => id === app.id || id === app.type || id === app.spriteKey
            );
            isOn = Boolean(inBlock);
          }
        } else {
          // Slot with no block: living room lights on when dark (19:00 - 07:00) (SIM-01 rule 6)
          const isDark = slotMin >= 19 * 60 || slotMin < 7 * 60;
          if (isDark && (app.type === 'lights' || app.type === 'light_bulb')) {
            isOn = true;
          }
        }

        if (isOn) {
          dayKwh += ((wattage * 0.5) / 1000) * quantity * starFactor;
        }
      }
    }

    return dayKwh;
  };

  const weekdayDailyKwh = calculateDailyKwhForSchedule(weekdayAway);
  const weekendDailyKwh = calculateDailyKwhForSchedule(weekendAway);

  // Month = 30 days (5/7 weekdays, 2/7 weekends) (SIM-01 rule 8)
  totalMonthlyKwh += weekdayDailyKwh * (5 / 7) * 30 + weekendDailyKwh * (2 / 7) * 30;

  return {
    totalMonthlyKwh: Number(totalMonthlyKwh.toFixed(2)),
  };
}
