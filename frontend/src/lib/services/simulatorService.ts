/**
 * SIM-01, SIM-05, SIM-06, SIM-07
 * Simulator Service: Real Supabase integration for rooms, appliances,
 * equipment catalog, away schedules, My Day routine blocks, notifications,
 * and live TNB Domestic Tariff bill calculation.
 */

import { supabase } from '../supabase';
import type { Database, RoomType } from '@/types/database';
import type { StoredRoom, StoredPlacedItem } from '@/features/simulator/logic/storage';
import type { RoutineBlock } from '@/features/simulator/logic/myDayLogic';
import { STAR_EFFICIENCY_FACTORS, USAGE_THRESHOLDS } from '@/features/simulator/logic/routineConfig';
import { fetchFurnitureState, type FurnitureTypeRow } from './furnitureService';
import { SPRITE_MAP } from '@/features/simulator/logic/spriteMap';

export type RoomRow = Database['public']['Tables']['rooms']['Row'];
export type ApplianceRow = Database['public']['Tables']['appliances']['Row'];
export type ApplianceTypeRow = Database['public']['Tables']['appliance_types']['Row'];
export type ScheduleRow = Database['public']['Tables']['schedules']['Row'];
export type DayBlockRow = Database['public']['Tables']['day_blocks']['Row'];
export type TariffRateRow = Database['public']['Tables']['tariff_rates']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export interface SimulatorData {
  rooms: StoredRoom[];
  appliances: StoredPlacedItem[];
  applianceTypes: ApplianceTypeRow[];
  furnitureTypes: FurnitureTypeRow[];
  schedules: ScheduleRow[];
  routineBlocks: RoutineBlock[];
  tariff: TariffRateRow | null;
  unreadNotificationsCount: number;
}

/**
 * Convert DB room type ('living_room' | 'kitchen' | 'bedroom' | 'bathroom')
 * to simulator UI room type ('living' | 'kitchen' | 'bedroom' | 'bathroom').
 */
export function dbTypeToSimType(dbType: string | null): StoredRoom['type'] {
  if (dbType === 'living_room' || dbType === 'living') return 'living';
  if (dbType === 'kitchen') return 'kitchen';
  if (dbType === 'bathroom') return 'bathroom';
  if (dbType === 'laundry_room') return 'laundry_room';
  if (dbType === 'work_room') return 'work_room';
  return 'bedroom';
}

/**
 * Convert simulator UI room type to DB room type.
 */
export function simTypeToDbType(simType: string): RoomType {
  if (simType === 'living' || simType === 'living_room') return 'living_room';
  if (simType === 'kitchen') return 'kitchen';
  if (simType === 'bathroom') return 'bathroom';
  if (simType === 'laundry_room') return 'laundry_room';
  if (simType === 'work_room') return 'work_room';
  return 'bedroom';
}

/**
 * Fetch all simulator state for a household.
 */
export async function fetchSimulatorState(householdId: string): Promise<SimulatorData> {
  const [
    roomsRes,
    appliancesRes,
    typesRes,
    schedulesRes,
    dayBlocksRes,
    tariffRes,
    unreadNotifsRes,
    furnitureState,
  ] = await Promise.all([
    supabase
      .from('rooms')
      .select('*')
      .eq('household_id', householdId)
      .order('floor', { ascending: true })
      .order('slot', { ascending: true }),
    supabase.from('appliances').select('*').eq('household_id', householdId),
    supabase.from('appliance_types').select('*').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('schedules').select('*').eq('household_id', householdId),
    supabase.from('day_blocks').select('*').eq('household_id', householdId).order('start_time', { ascending: true }),
    supabase
      .from('tariff_rates')
      .select('*')
      .eq('type', 'domestic')
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('is_read', false),
    fetchFurnitureState(householdId),
  ]);

  const rawRooms: RoomRow[] = roomsRes.data || [];
  const rawAppliances: ApplianceRow[] = appliancesRes.data || [];
  const rawTypes: ApplianceTypeRow[] = typesRes.data || [];
  const rawSchedules: ScheduleRow[] = schedulesRes.data || [];
  const rawBlocks: DayBlockRow[] = dayBlocksRes.data || [];
  const tariff: TariffRateRow | null = tariffRes.data;
  const unreadCount = unreadNotifsRes.count ?? 0;

  // Map DB rooms to StoredRoom interface
  const mappedRooms: StoredRoom[] = rawRooms.map((r) => ({
    id: r.id,
    name: r.name || (r.slot === 'A' && r.floor === 1 ? 'Living Room' : ''),
    type: dbTypeToSimType(r.type),
    floor: r.floor as 1 | 2,
    slot: r.slot as 'A' | 'B' | 'C' | 'D',
    isSetUp: Boolean(r.is_set_up),
  }));

  // Map DB appliances to StoredPlacedItem interface
  const typeMap = new Map(rawTypes.map((t) => [t.id, t]));
  const mappedAppliances: StoredPlacedItem[] = rawAppliances.map((app) => {
    const t = typeMap.get(app.type);
    const spriteKey = t?.sprite_key || app.type;
    return {
      id: app.id,
      category: 'Appliances',
      type: app.type,
      spriteKey,
      name: t?.name || app.type,
      roomId: app.room_id,
      posX: app.position_x !== null ? Number(app.position_x) : 0.5,
      posY: app.position_y !== null ? Number(app.position_y) : 0.5,
      brand: app.brand || '',
      model: app.model || '',
      quantity: app.quantity || 1,
      wattage: app.wattage || 100,
      stars: app.star_rating !== null ? app.star_rating : 3,
      facing: app.facing,
      alwaysOn: Boolean(t?.always_on),
      hoursPerDay: t?.always_on ? 24 : SPRITE_MAP[spriteKey]?.defaultHours,
      isOn: false,
    };
  });

  // Map DB day_blocks to RoutineBlock interface
  const mappedBlocks: RoutineBlock[] = rawBlocks.map((b) => {
    let applianceIds: string[] = [];
    if (Array.isArray(b.appliances_on)) {
      applianceIds = (b.appliances_on as any[]).map(String);
    }

    const isAway = b.type === 'away' || !b.room_id;
    return {
      id: b.id,
      name: b.title,
      startTime: b.start_time.substring(0, 5),
      endTime: b.end_time.substring(0, 5),
      roomId: isAway ? 'away' : b.room_id || 'away',
      isAway,
      isLocked: isAway,
      applianceIds,
      iconType: (b.type as any) || 'custom',
      avatarWalks: !b.title.toLowerCase().includes('charging phone'),
    };
  });

  const furnitureTypeMap = new Map(furnitureState.types.map((type) => [type.id, type]));
  const mappedFurniture: StoredPlacedItem[] = furnitureState.items.map((item) => {
    const type = furnitureTypeMap.get(item.type);
    return {
      id: item.id,
      category: 'Furniture',
      type: item.type,
      spriteKey: type?.sprite_key ?? item.type,
      name: type?.name ?? item.type,
      roomId: item.room_id,
      posX: Number(item.position_x),
      posY: Number(item.position_y),
      role: item.role ?? undefined,
      facing: item.facing,
    };
  });

  return {
    rooms: mappedRooms,
    appliances: [...mappedAppliances, ...mappedFurniture],
    applianceTypes: rawTypes,
    furnitureTypes: furnitureState.types,
    schedules: rawSchedules,
    routineBlocks: mappedBlocks,
    tariff,
    unreadNotificationsCount: unreadCount,
  };
}

/**
 * Save / Update room in Supabase.
 */
export async function saveRoom(
  roomId: string,
  name: string,
  type: string,
  isSetUp: boolean = true,
  householdId?: string | null
): Promise<void> {
  const dbType = simTypeToDbType(type);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

  if (isUuid) {
    const { error } = await supabase
      .from('rooms')
      .update({
        name: name.trim(),
        type: dbType,
        is_set_up: isSetUp,
      })
      .eq('id', roomId);

    if (error) {
      console.warn('Failed to update room in Supabase:', error);
      throw error;
    }
  } else if (householdId) {
    const parts = roomId.split('_');
    const floor = (parseInt(parts[1], 10) as 1 | 2) || 1;
    const slot = (parts[2] || 'A') as 'A' | 'B' | 'C' | 'D';
    const { error } = await supabase
      .from('rooms')
      .update({
        name: name.trim(),
        type: dbType,
        is_set_up: isSetUp,
      })
      .eq('household_id', householdId)
      .eq('floor', floor)
      .eq('slot', slot);

    if (error) {
      console.warn('Failed to update room in Supabase by slot:', error);
      throw error;
    }
  }
}

/**
 * Insert new appliance into Supabase.
 */
export async function createAppliance(
  householdId: string,
  item: {
    roomId: string;
    type: string;
    brand?: string;
    model?: string;
    wattage: number;
    starRating?: number | null;
    quantity?: number;
    posX?: number;
    posY?: number;
    facing?: 'front' | 'back';
  }
): Promise<string> {
  const { data, error } = await supabase
    .from('appliances')
    .insert({
      household_id: householdId,
      room_id: item.roomId,
      type: item.type,
      brand: item.brand?.trim() || null,
      model: item.model?.trim() || null,
      wattage: Math.max(1, item.wattage),
      star_rating: item.starRating === undefined ? 3 : item.starRating,
      quantity: Math.max(1, item.quantity ?? 1),
      position_x: item.posX !== undefined ? Number(item.posX.toFixed(4)) : null,
      position_y: item.posY !== undefined ? Number(item.posY.toFixed(4)) : null,
      facing: item.facing ?? 'front',
    })
    .select('id')
    .single();

  if (error) {
    console.warn('Failed to create appliance in Supabase:', error);
    throw error;
  }

  return data.id;
}

/**
 * Update existing appliance in Supabase.
 */
export async function updateAppliance(
  applianceId: string,
  updates: {
    roomId?: string;
    brand?: string;
    model?: string;
    wattage?: number;
    starRating?: number | null;
    quantity?: number;
    posX?: number;
    posY?: number;
    facing?: 'front' | 'back';
  }
): Promise<void> {
  const payload: Database['public']['Tables']['appliances']['Update'] = {};

  if (updates.roomId !== undefined) payload.room_id = updates.roomId;
  if (updates.brand !== undefined) payload.brand = updates.brand.trim() || null;
  if (updates.model !== undefined) payload.model = updates.model.trim() || null;
  if (updates.wattage !== undefined) payload.wattage = Math.max(1, updates.wattage);
  if (updates.starRating !== undefined) payload.star_rating = updates.starRating;
  if (updates.quantity !== undefined) payload.quantity = Math.max(1, updates.quantity);
  if (updates.posX !== undefined) payload.position_x = Number(updates.posX.toFixed(4));
  if (updates.posY !== undefined) payload.position_y = Number(updates.posY.toFixed(4));
  if (updates.facing !== undefined) payload.facing = updates.facing;

  const { error } = await supabase.from('appliances').update(payload).eq('id', applianceId);

  if (error) {
    console.warn('Failed to update appliance in Supabase:', error);
    throw error;
  }
}

/**
 * Delete appliance from Supabase.
 */
export async function deleteAppliance(applianceId: string): Promise<void> {
  const { error } = await supabase.from('appliances').delete().eq('id', applianceId);
  if (error) {
    console.warn('Failed to delete appliance from Supabase:', error);
    throw error;
  }
}

/**
 * Save Routine Blocks (day_blocks) to Supabase.
 */
export async function saveRoutineBlocksToDb(
  householdId: string,
  blocks: RoutineBlock[]
): Promise<void> {
  // Delete previous blocks for household
  await supabase.from('day_blocks').delete().eq('household_id', householdId);

  if (blocks.length === 0) return;

  const validTypes = ['sleep', 'meal', 'evening', 'shower', 'work', 'other', 'away'];

  const rows = blocks.map((b) => {
    let blockType: 'sleep' | 'meal' | 'evening' | 'shower' | 'work' | 'other' | 'away' = 'other';
    if (b.isAway || b.roomId === 'away') {
      blockType = 'away';
    } else if (validTypes.includes(b.iconType)) {
      blockType = b.iconType as any;
    }

    const roomId = b.roomId === 'away' || !b.roomId ? null : b.roomId;

    return {
      household_id: householdId,
      type: blockType,
      title: b.name,
      room_id: roomId,
      start_time: `${b.startTime}:00`,
      end_time: `${b.endTime}:00`,
      appliances_on: b.applianceIds || [],
    };
  });

  const { error } = await supabase.from('day_blocks').insert(rows);
  if (error) {
    console.warn('Failed to save day_blocks in Supabase:', error);
    throw error;
  }

  // Sync away block to schedules if present
  const awayBlock = blocks.find((b) => (b.isAway || b.roomId === 'away') && b.endTime > b.startTime);
  if (awayBlock) {
    const { data: existingSchedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('household_id', householdId)
      .eq('day_type', 'weekday')
      .limit(1);

    if (existingSchedules && existingSchedules.length > 0) {
      await supabase
        .from('schedules')
        .update({
          start_time: `${awayBlock.startTime}:00`,
          end_time: `${awayBlock.endTime}:00`,
        })
        .eq('id', existingSchedules[0].id);
    }
  }
}

/**
 * Save / Update schedules directly to Supabase.
 */
export async function saveSchedulesToDb(
  householdId: string,
  schedules: { day_type: 'weekday' | 'weekend'; start_time: string; end_time: string }[]
): Promise<void> {
  await supabase.from('schedules').delete().eq('household_id', householdId);
  if (schedules.length === 0) return;
  const rows = schedules.map((s) => ({
    household_id: householdId,
    day_type: s.day_type,
    start_time: s.start_time.includes(':') && s.start_time.split(':').length === 2 ? `${s.start_time}:00` : s.start_time,
    end_time: s.end_time.includes(':') && s.end_time.split(':').length === 2 ? `${s.end_time}:00` : s.end_time,
  }));
  const { error } = await supabase.from('schedules').insert(rows);
  if (error) {
    console.warn('Failed to save schedules in Supabase:', error);
    throw error;
  }
}

/**
 * Fetch all notifications for a household.
 */
export async function fetchNotifications(householdId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Failed to fetch notifications:', error);
    return [];
  }
  return data || [];
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.warn('Failed to mark notification as read:', error);
  }
}

/**
 * Mark all notifications as read for a household.
 */
export async function markAllNotificationsAsRead(householdId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('household_id', householdId)
    .eq('is_read', false);

  if (error) {
    console.warn('Failed to mark all notifications as read:', error);
  }
}

/**
 * TNB Appendix A Live Estimated Bill Calculation (SIM-01)
 * Incorporates:
 * - 48 30-minute slots per day
 * - Appliance wattage, quantity, star efficiency
 * - Always-on vs needs-person rules
 * - User presence from schedules & My Day active blocks
 * - Water heater showers calculation (showers_per_person * residents_count * minutes)
 * - Live tariff_rates row (generation, capacity, network, retail, afa)
 */
export function calculateLiveTnbBill(params: {
  appliances: StoredPlacedItem[];
  applianceTypes: ApplianceTypeRow[];
  schedules?: ScheduleRow[];
  dayBlocks?: RoutineBlock[];
  residentsCount?: number;
  showersPerPerson?: number;
  minutesPerShower?: number;
  tariff?: TariffRateRow | null;
}): {
  totalKwh: number;
  monthlyBillRm: number;
  usageBadge: 'Low Usage' | 'Normal Usage' | 'High Usage';
} {
  const {
    appliances,
    applianceTypes,
    schedules = [],
    dayBlocks = [],
    residentsCount = 3,
    showersPerPerson = 2,
    minutesPerShower = 10,
    tariff,
  } = params;

  const appList = appliances.filter((item) => item.category === 'Appliances');
  if (appList.length === 0) {
    return {
      totalKwh: 0,
      monthlyBillRm: 0,
      usageBadge: 'Low Usage',
    };
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
      const dailyKwh = (showersPerDay * minutes / 60) * (wattage / 1000) * quantity;
      totalMonthlyKwh += dailyKwh * 30 * starFactor;
    }
  }

  // 2. Parse schedules for away ranges
  const parseTimeToMinutes = (tStr: string): number => {
    const parts = tStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const weekdayAway = schedules.filter((s) => s.day_type === 'weekday');
  const weekendAway = schedules.filter((s) => s.day_type === 'weekend');

  const isAwayInSlot = (slotMin: number, awayList: ScheduleRow[]): boolean => {
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
  };

  // 48 slots of 30 minutes each (0 to 1410)
  const calculateDailyKwhForSchedule = (awayList: ScheduleRow[]): number => {
    let dayKwh = 0;

    for (let slot = 0; slot < 48; slot++) {
      const slotMin = slot * 30;
      const isAway = isAwayInSlot(slotMin, awayList);

      const activeBlock = dayBlocks.length > 0
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
          dayKwh += (wattage * 0.5 / 1000) * quantity * starFactor;
        }
      }
    }

    return dayKwh;
  };

  const weekdayDailyKwh = calculateDailyKwhForSchedule(weekdayAway);
  const weekendDailyKwh = calculateDailyKwhForSchedule(weekendAway);

  // Month = 30 days (5/7 weekdays, 2/7 weekends) (SIM-01 rule 8)
  totalMonthlyKwh += (weekdayDailyKwh * (5 / 7) * 30) + (weekendDailyKwh * (2 / 7) * 30);

  // Calculate bill from TNB formula (Appendix A)
  const genLow = tariff ? Number(tariff.generation_rate_low) : 0.2703;
  const genHigh = tariff ? Number(tariff.generation_rate_high) : 0.3703;
  const threshold = tariff ? Number(tariff.generation_threshold_kwh) : 1500;
  const capRate = tariff ? Number(tariff.capacity_rate) : 0.0455;
  const netRate = tariff ? Number(tariff.network_rate) : 0.1285;
  const retailCharge = tariff ? Number(tariff.retail_charge) : 10.0;
  const retailFreeLimit = tariff ? Number(tariff.retail_free_limit_kwh) : 600;
  const afaRate = tariff ? Number(tariff.afa_rate) : 0.0;

  const kwh = totalMonthlyKwh;
  const generation = Math.min(kwh, threshold) * genLow + Math.max(kwh - threshold, 0) * genHigh;
  const capacity = kwh * capRate;
  const network = kwh * netRate;
  const retail = kwh > retailFreeLimit ? retailCharge : 0;
  const afa = kwh * afaRate;

  const totalBillRm = generation + capacity + network + retail + afa;

  let usageBadge: 'Low Usage' | 'Normal Usage' | 'High Usage' = 'Normal Usage';
  if (totalBillRm < USAGE_THRESHOLDS.LOW_RM) {
    usageBadge = 'Low Usage';
  } else if (totalBillRm > USAGE_THRESHOLDS.HIGH_RM) {
    usageBadge = 'High Usage';
  }

  return {
    totalKwh: Math.round(totalMonthlyKwh),
    monthlyBillRm: Math.round(totalBillRm),
    usageBadge,
  };
}
