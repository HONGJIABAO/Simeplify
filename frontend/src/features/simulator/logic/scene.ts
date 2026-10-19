import { Appliance, ApplianceType, Room } from '@/lib/mockData';
export type FurnitureType = 'bed' | 'sofa' | 'table' | 'sink';
export type Placement = { roomId: string; posX: number; posY: number };
export type Furniture = Placement & { id: string; type: FurnitureType; name: string };
export type CatalogItem = { key: string; label: string; type: ApplianceType | FurnitureType; category: 'Appliances' | 'Furniture'; wattage: number };
export const CATALOG: CatalogItem[] = [
  { key: 'air_conditioner', label: 'Air cond.', type: 'air_conditioner', category: 'Appliances', wattage: 1200 },
  { key: 'refrigerator', label: 'Fridge', type: 'refrigerator', category: 'Appliances', wattage: 120 },
  { key: 'lights', label: 'Lamp', type: 'lights', category: 'Appliances', wattage: 20 },
  { key: 'tv', label: 'TV', type: 'tv', category: 'Appliances', wattage: 90 },
  { key: 'light_bulb', label: 'Light bulb', type: 'lights', category: 'Appliances', wattage: 10 },
  { key: 'water_heater', label: 'Water heater', type: 'water_heater', category: 'Appliances', wattage: 3500 },
  ...(['bed', 'sofa', 'table', 'sink'] as const).map(type => ({ key: type, label: type[0].toUpperCase() + type.slice(1), type, category: 'Furniture' as const, wattage: 0 })),
];
export function placementAt(rooms: Room[], x: number, y: number, width: number, height: number): Placement | null {
  if (width <= 0 || height <= 0 || x < 0 || y < 0 || x > width || y > height) return null;
  const room = rooms.find(r => x >= r.gridCol * width / 4 && x <= (r.gridCol + r.gridColSpan) * width / 4 && y >= r.gridRow * height / 4 && y <= (r.gridRow + r.gridRowSpan) * height / 4);
  if (!room) return null;
  const w = room.gridColSpan * width / 4, h = room.gridRowSpan * height / 4;
  const mx = Math.min(.45, 26 / w), my = Math.min(.45, 26 / h);
  return { roomId: room.id, posX: Math.max(mx, Math.min(1 - mx, (x - room.gridCol * width / 4) / w)), posY: Math.max(my, Math.min(1 - my, (y - room.gridRow * height / 4) / h)) };
}
export function isApplianceOn(app: Appliance, activeIds: string[], away: boolean) {
  return app.alwaysOn || app.isOn === true || (!away && activeIds.includes(app.id));
}

/** Per-minute union avoids double counting overlapping imported blocks and overnight sleep. */
export function monthlyUsage(appliances: Appliance[], blocks: { startTime: string; endTime: string; applianceIds: string[]; isAway?: boolean }[], configured: boolean): Record<string, number> {
  const result: Record<string, number> = {};
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const includes = (block: typeof blocks[number], minute: number) => {
    const start = minutes(block.startTime), end = minutes(block.endTime);
    return start < end ? minute >= start && minute < end : minute >= start || minute < end;
  };
  for (const appliance of appliances) {
    let activeMinutes = 0;
    if (appliance.alwaysOn || appliance.isOn) activeMinutes = 1440;
    else if (!configured) activeMinutes = 300;
    else for (let m = 0; m < 1440; m++) {
      if (!blocks.some(b => b.isAway && includes(b, m)) && blocks.some(b => !b.isAway && b.applianceIds.includes(appliance.id) && includes(b, m))) activeMinutes++;
    }
    result[appliance.id] = appliance.wattage / 1000 * activeMinutes / 60 * 30;
  }
  return result;
}
