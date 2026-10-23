/** SIM-06 — doorway-constrained resident routing for the two-floor plan. */
import type { StoredRoom } from './storage';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { getSlotRect, STAIR_CENTER, STAIR_RECT, type FloorNumber, type FractionRect, type RoomSlot } from './roomLayout.ts';
// @ts-expect-error Node's built-in TypeScript test runner requires the source extension.
import { ROOM_DOOR_RATIOS } from './furnishedLayout.ts';
type Point = { x: number; y: number };

export const DOOR_INSET_RATIO = 0.12;
const DOOR_WALL_DEPTH = 0.012;
const DEFAULT_PLAN_SIDE = 340;

type RegionId = string | 'stair';
type DoorPair = { a: RoomSlot | 'stair'; b: RoomSlot | 'stair'; aSide: 'top' | 'right' | 'bottom' | 'left' };

const DOOR_PAIRS: readonly DoorPair[] = [
  { a: 'A', b: 'B', aSide: 'right' },
  { a: 'A', b: 'C', aSide: 'bottom' },
  { a: 'C', b: 'D', aSide: 'right' },
  { a: 'D', b: 'stair', aSide: 'right' },
  { a: 'B', b: 'stair', aSide: 'bottom' },
];

export interface WalkDoor {
  id: string;
  regionA: RegionId;
  regionB: RegionId;
  center: Point;
  rect: FractionRect;
  insideA: Point;
  insideB: Point;
}

export interface WalkNode {
  id: string;
  point: Point;
  region: RegionId | `door:${string}`;
}

export interface WalkEdge { from: string; to: string; cost: number }
export interface WalkGraph {
  floor: FloorNumber;
  nodes: WalkNode[];
  edges: WalkEdge[];
  doors: WalkDoor[];
  regions: Map<RegionId, FractionRect>;
}

export interface FloorWalkPathInput {
  floor: FloorNumber;
  rooms: readonly StoredRoom[];
  start: Point;
  startRoomId: string | null;
  end: Point;
  endRoomId: string | null;
}

export interface FloorWalkPathResult {
  floor: FloorNumber;
  points: Point[];
  reachedTarget: boolean;
  fallbackPoint?: Point;
}

export interface HomeWalkRouteInput extends Omit<FloorWalkPathInput, 'floor' | 'end' | 'endRoomId'> {
  startFloor: FloorNumber;
  endFloor: FloorNumber;
  end: Point;
  endRoomId: string | null;
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInRect(point: Point, rect: FractionRect, epsilon = 0.0001) {
  return point.x >= rect.x - epsilon && point.x <= rect.x + rect.width + epsilon
    && point.y >= rect.y - epsilon && point.y <= rect.y + rect.height + epsilon;
}

function slotRegionId(slot: RoomSlot, rooms: readonly StoredRoom[]): string | null {
  return rooms.find((room) => room.slot === slot && room.isSetUp)?.id ?? null;
}

function getRegionRect(region: RoomSlot | 'stair'): FractionRect {
  return region === 'stair' ? STAIR_RECT : getSlotRect(region);
}

function doorCenter(pair: DoorPair): Point {
  if (pair.a === 'stair') return STAIR_CENTER;
  const rect = getSlotRect(pair.a);
  const ratio = ROOM_DOOR_RATIOS[pair.a][pair.aSide] ?? 0.5;
  if (pair.aSide === 'left') return { x: rect.x, y: rect.y + rect.height * ratio };
  if (pair.aSide === 'right') return { x: rect.x + rect.width, y: rect.y + rect.height * ratio };
  if (pair.aSide === 'top') return { x: rect.x + rect.width * ratio, y: rect.y };
  return { x: rect.x + rect.width * ratio, y: rect.y + rect.height };
}

function visualDoorHalfLength(slot: RoomSlot, side: DoorPair['aSide'], planSide = DEFAULT_PLAN_SIDE) {
  const rect = getSlotRect(slot);
  const roomWidth = rect.width * planSide;
  const roomHeight = rect.height * planSide;
  const gapPx = Math.max(24, Math.min(38, Math.min(roomWidth, roomHeight) * 0.24));
  return gapPx / planSide / 2;
}

function insideDoorPoint(center: Point, rect: FractionRect, side: DoorPair['aSide']): Point {
  if (side === 'left') return { x: center.x + rect.width * DOOR_INSET_RATIO, y: center.y };
  if (side === 'right') return { x: center.x - rect.width * DOOR_INSET_RATIO, y: center.y };
  if (side === 'top') return { x: center.x, y: center.y + rect.height * DOOR_INSET_RATIO };
  return { x: center.x, y: center.y - rect.height * DOOR_INSET_RATIO };
}

function oppositeSide(side: DoorPair['aSide']): DoorPair['aSide'] {
  return side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'top' ? 'bottom' : 'top';
}

function addUndirectedEdge(edges: WalkEdge[], from: WalkNode, to: WalkNode) {
  const cost = distance(from.point, to.point);
  edges.push({ from: from.id, to: to.id, cost }, { from: to.id, to: from.id, cost });
}

export function getFloorDoors(floor: FloorNumber, allRooms: readonly StoredRoom[]): WalkDoor[] {
  const rooms = allRooms.filter((room) => room.floor === floor);
  return DOOR_PAIRS.flatMap((pair) => {
    const regionA = pair.a === 'stair' ? 'stair' : slotRegionId(pair.a, rooms);
    const regionB = pair.b === 'stair' ? 'stair' : slotRegionId(pair.b, rooms);
    if (!regionA || !regionB) return [];
    const center = doorCenter(pair);
    const rectA = getRegionRect(pair.a);
    const rectB = getRegionRect(pair.b);
    const half = pair.a === 'stair' ? 0.04 : visualDoorHalfLength(pair.a, pair.aSide);
    const vertical = pair.aSide === 'left' || pair.aSide === 'right';
    const id = `${pair.a}-${pair.b}`;
    return [{
      id,
      regionA,
      regionB,
      center,
      rect: vertical
        ? { x: center.x - DOOR_WALL_DEPTH, y: center.y - half, width: DOOR_WALL_DEPTH * 2, height: half * 2 }
        : { x: center.x - half, y: center.y - DOOR_WALL_DEPTH, width: half * 2, height: DOOR_WALL_DEPTH * 2 },
      insideA: insideDoorPoint(center, rectA, pair.aSide),
      insideB: insideDoorPoint(center, rectB, oppositeSide(pair.aSide)),
    }];
  });
}

export function buildFloorWalkGraph(floor: FloorNumber, allRooms: readonly StoredRoom[]): WalkGraph {
  const rooms = allRooms.filter((room) => room.floor === floor && room.isSetUp);
  const regions = new Map<RegionId, FractionRect>([['stair', STAIR_RECT]]);
  rooms.forEach((room) => regions.set(room.id, getSlotRect(room.slot)));
  const doors = getFloorDoors(floor, rooms);
  const nodes: WalkNode[] = [];
  const edges: WalkEdge[] = [];
  const regionNodes = new Map<RegionId, WalkNode[]>();
  const addRegionNode = (region: RegionId, node: WalkNode) => {
    nodes.push(node);
    regionNodes.set(region, [...(regionNodes.get(region) ?? []), node]);
  };

  doors.forEach((door) => {
    const center: WalkNode = { id: `${door.id}:door`, point: door.center, region: `door:${door.id}` };
    const a: WalkNode = { id: `${door.id}:a`, point: door.insideA, region: door.regionA };
    const b: WalkNode = { id: `${door.id}:b`, point: door.insideB, region: door.regionB };
    nodes.push(center);
    addRegionNode(door.regionA, a);
    addRegionNode(door.regionB, b);
    addUndirectedEdge(edges, a, center);
    addUndirectedEdge(edges, center, b);
  });

  const stairNode: WalkNode = { id: 'stair:center', point: STAIR_CENTER, region: 'stair' };
  addRegionNode('stair', stairNode);

  regionNodes.forEach((sameRegionNodes) => {
    for (let index = 0; index < sameRegionNodes.length; index += 1) {
      for (let other = index + 1; other < sameRegionNodes.length; other += 1) {
        addUndirectedEdge(edges, sameRegionNodes[index], sameRegionNodes[other]);
      }
    }
  });

  return { floor, nodes, edges, doors, regions };
}

function addTargetNode(graph: WalkGraph, id: string, point: Point, region: RegionId | null): WalkNode | null {
  if (!region || !graph.regions.has(region)) return null;
  const node: WalkNode = { id, point, region };
  const peers = graph.nodes.filter((candidate) => candidate.region === region);
  graph.nodes.push(node);
  peers.forEach((peer) => addUndirectedEdge(graph.edges, node, peer));
  return node;
}

function shortestNodeIds(graph: WalkGraph, startId: string, endId: string): string[] | null {
  const unvisited = new Set(graph.nodes.map((node) => node.id));
  const scores = new Map(graph.nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<string, string>();
  scores.set(startId, 0);
  while (unvisited.size) {
    let current: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    unvisited.forEach((id) => {
      const score = scores.get(id) ?? Number.POSITIVE_INFINITY;
      if (score < best) { best = score; current = id; }
    });
    if (!current || best === Number.POSITIVE_INFINITY) break;
    unvisited.delete(current);
    if (current === endId) break;
    graph.edges.filter((edge) => edge.from === current && unvisited.has(edge.to)).forEach((edge) => {
      const next = best + edge.cost;
      if (next < (scores.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        scores.set(edge.to, next);
        previous.set(edge.to, current!);
      }
    });
  }
  if (!Number.isFinite(scores.get(endId) ?? Number.POSITIVE_INFINITY)) return null;
  const ids = [endId];
  while (ids[0] !== startId) {
    const before = previous.get(ids[0]);
    if (!before) return null;
    ids.unshift(before);
  }
  return ids;
}

export function findFloorWalkPath(input: FloorWalkPathInput): FloorWalkPathResult {
  const graph = buildFloorWalkGraph(input.floor, input.rooms);
  const startRegion = pointInRect(input.start, STAIR_RECT) ? 'stair' : input.startRoomId;
  const endRegion = pointInRect(input.end, STAIR_RECT) ? 'stair' : input.endRoomId;
  const start = addTargetNode(graph, 'route:start', input.start, startRegion);
  const end = addTargetNode(graph, 'route:end', input.end, endRegion);
  if (!start) return { floor: input.floor, points: [input.start], reachedTarget: false, fallbackPoint: input.start };
  if (!end) {
    const candidates = graph.nodes.filter((node) => node.id !== start.id);
    const nearest = candidates.sort((a, b) => distance(a.point, input.end) - distance(b.point, input.end))[0];
    if (!nearest) return { floor: input.floor, points: [input.start], reachedTarget: false, fallbackPoint: input.start };
    const ids = shortestNodeIds(graph, start.id, nearest.id) ?? [start.id];
    const points = ids.map((id) => graph.nodes.find((node) => node.id === id)!.point);
    return { floor: input.floor, points, reachedTarget: false, fallbackPoint: points.at(-1) };
  }
  const ids = shortestNodeIds(graph, start.id, end.id);
  if (!ids) return { floor: input.floor, points: [input.start], reachedTarget: false, fallbackPoint: input.start };
  return { floor: input.floor, points: ids.map((id) => graph.nodes.find((node) => node.id === id)!.point), reachedTarget: true };
}

export function findHomeWalkRoute(input: HomeWalkRouteInput): FloorWalkPathResult[] {
  if (input.startFloor === input.endFloor) {
    return [findFloorWalkPath({ ...input, floor: input.startFloor })];
  }
  return [
    findFloorWalkPath({
      floor: input.startFloor, rooms: input.rooms, start: input.start,
      startRoomId: input.startRoomId, end: STAIR_CENTER, endRoomId: null,
    }),
    findFloorWalkPath({
      floor: input.endFloor, rooms: input.rooms, start: STAIR_CENTER,
      startRoomId: null, end: input.end, endRoomId: input.endRoomId,
    }),
  ];
}

export function isWalkSegmentValid(
  floor: FloorNumber,
  rooms: readonly StoredRoom[],
  from: Point,
  to: Point
): boolean {
  const regionRects = [
    ...rooms.filter((room) => room.floor === floor && room.isSetUp).map((room) => getSlotRect(room.slot)),
    STAIR_RECT,
  ];
  if (regionRects.some((rect) => pointInRect(from, rect) && pointInRect(to, rect))) return true;
  return getFloorDoors(floor, rooms).some((door) => {
    const crossesDoor = pointInRect(door.center, door.rect);
    if (!crossesDoor) return false;
    const samples = Array.from({ length: 21 }, (_, index) => ({
      x: from.x + (to.x - from.x) * index / 20,
      y: from.y + (to.y - from.y) * index / 20,
    }));
    return samples.every((point) => regionRects.some((rect) => pointInRect(point, rect)) || pointInRect(point, door.rect));
  });
}
