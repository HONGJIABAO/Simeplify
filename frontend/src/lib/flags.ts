/**
 * SIM-01 / SIM-02 / SIM-04 / COM-01 / SCN-01 / PRO-01
 * Feature flags and open decision constants.
 * Source: docs/frontend_Implementation.md Section 9 and docs/Workflow.md Section 5.
 *
 * Each constant has a default value and a TODO comment. Do not invent product behavior.
 */

// TODO(open-item 1 / page_refined §5 item 1): Google sign-in drawn on auth screens but AUTH-01 requires email & password.
export const ENABLE_GOOGLE_AUTH: boolean = false;

// TODO(open-item 3 / page_refined §5 item 3): Screenshots show flat top-down; SIM-05 specifies 2.5D isometric.
export const FLOOR_PLAN_STYLE: 'flat' | 'isometric' = 'flat';

// TODO(open-item 4 / page_refined §5 item 4): Edit Block controls (Temperature, Timer, Fan speed, cost preview) have no calculation rules.
export const ENABLE_EDIT_BLOCK_EXTRA_CONTROLS: boolean = false;

// TODO(open-item 5 / page_refined §5 item 5): Furniture tab is drawn in edit mode tray but has no defined product requirement.
export const ENABLE_FURNITURE_TAB: boolean = false;

// TODO(open-item 7 / page_refined §5 item 7): "High usage" badge on Bill card has no threshold rule yet.
export const HIGH_USAGE_THRESHOLD_RM: number | null = null;

// TODO(open-item 9 / page_refined §5 item 9): "Full Home LED" lights swap suggestion rule until lighting star rating rule exists.
export const ENABLE_LIGHTS_SWAP: boolean = false;

// TODO(open-item 10 / page_refined §5 item 10): CO2 card on Bin home has no requirement or conversion factor (0.1 kg/item implied).
export const SHOW_CO2_CARD: boolean = false;

// TODO(open-item 12 / page_refined §5 item 12): Voting window close date. Default mock date for end-of-month window.
export const VOTE_CLOSES_AT: string = '2026-10-28T23:59:59+08:00';

// TODO(open-item 12 / page_refined §5 item 12): Month result announcement time. Default mock date.
export const RESULT_AT: string = '2026-10-29T09:00:00+08:00';

// TODO(open-item 10 / Workflow item 10): Solar "See how" route is undefined in v1. Button triggers "coming soon" toast.
export const SOLAR_SEE_HOW_ROUTE: string | null = null;

// TODO(open-item 17 / page_refined §5 item 17): Leaf dial shows deeds / 3. Lush starts at 2+, but COM-03 caps daily points at 3.
export const LEAF_DAILY_DEED_CAP: number = 3;

// TODO(open-item 1 / Workflow item 1): Monthly neighborhood points target to unlock community reward (mock example).
export const COMMUNITY_MONTH_TARGET_PTS: number = 50000;

// TODO(open-item 1 / Workflow item 1): Household contribution milestone points (mock example).
export const HOUSEHOLD_MILESTONE_PTS: number = 500;

// TODO(open-item 3 / Workflow item 3): Neighborhood sector name from mock data.
export const NEIGHBOURHOOD_NAME: string = 'Oakridge Commons • Sector 4B';
