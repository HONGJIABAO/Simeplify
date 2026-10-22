// frontend/src/features/simulator/logic/billCalcCore.ts
// Pure bill calculation logic shared between backend and frontend (SIM-01, Appendix A).
// Canonical source: supabase/functions/_shared/billCalc.ts
// Frontend copy: frontend/src/lib/shared/billCalc.ts

export {
  STAR_EFFICIENCY_FACTORS,
  parseTimeToMinutes,
  isAwayInSlot,
  computeHouseholdEstimateKwh,
  type StoredApplianceItem,
  type ApplianceCatalogType,
  type ScheduleItem,
  type DayRoutineBlock,
  type TariffRateConfig,
} from '@/lib/shared/billCalc';
