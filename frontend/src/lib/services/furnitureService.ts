/** SIM-05 — RLS-scoped persisted furniture access. */
import { supabase } from '../supabase';
import type { Database } from '@/types/database';

export type FurnitureTypeRow = Database['public']['Tables']['furniture_types']['Row'];
export type FurnitureItemRow = Database['public']['Tables']['furniture_items']['Row'];
export type ItemFacing = FurnitureItemRow['facing'];

export interface FurnitureState {
  items: FurnitureItemRow[];
  types: FurnitureTypeRow[];
}

export async function fetchFurnitureState(householdId: string): Promise<FurnitureState> {
  const [itemsResult, typesResult] = await Promise.all([
    supabase.from('furniture_items').select('*').eq('household_id', householdId),
    supabase.from('furniture_types').select('*').eq('active', true).order('sort_order'),
  ]);
  if (itemsResult.error) throw itemsResult.error;
  if (typesResult.error) throw typesResult.error;
  return { items: itemsResult.data ?? [], types: typesResult.data ?? [] };
}

export async function createFurniture(
  householdId: string,
  item: Pick<FurnitureItemRow, 'room_id' | 'type' | 'position_x' | 'position_y'> &
    Partial<Pick<FurnitureItemRow, 'role' | 'facing'>>
): Promise<FurnitureItemRow> {
  const { data, error } = await supabase.from('furniture_items').insert({
    household_id: householdId,
    room_id: item.room_id,
    type: item.type,
    role: item.role ?? null,
    facing: item.facing ?? 'front',
    position_x: Number(item.position_x.toFixed(4)),
    position_y: Number(item.position_y.toFixed(4)),
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateFurniturePosition(
  id: string,
  updates: Partial<Pick<FurnitureItemRow, 'room_id' | 'position_x' | 'position_y' | 'facing' | 'role'>>
): Promise<void> {
  const payload: Database['public']['Tables']['furniture_items']['Update'] = { ...updates };
  if (updates.position_x !== undefined) payload.position_x = Number(updates.position_x.toFixed(4));
  if (updates.position_y !== undefined) payload.position_y = Number(updates.position_y.toFixed(4));
  const { error } = await supabase.from('furniture_items').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteFurniture(id: string): Promise<void> {
  const { error } = await supabase.from('furniture_items').delete().eq('id', id);
  if (error) throw error;
}
