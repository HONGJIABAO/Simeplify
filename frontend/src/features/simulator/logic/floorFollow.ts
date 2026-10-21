/** SIM-06 — pure rule for deciding whether the viewed floor follows the resident. */
import type { FloorNumber } from './roomLayout';

export interface FloorFollowInput {
  viewedFloor: FloorNumber;
  avatarFloorAtWalkStart: FloorNumber;
  isEditMode: boolean;
  userChangedFloorDuringWalk?: boolean;
}

export function shouldFollowAvatarFloor({
  viewedFloor,
  avatarFloorAtWalkStart,
  isEditMode,
  userChangedFloorDuringWalk = false,
}: FloorFollowInput): boolean {
  return !isEditMode
    && !userChangedFloorDuringWalk
    && viewedFloor === avatarFloorAtWalkStart;
}
