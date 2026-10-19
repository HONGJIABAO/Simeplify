# Frontend Implementation Prompt: Simeplify / EcoTwin

Paste this whole file into your AI coding agent. The agent works in the repo, so it can read the docs itself.

---

## 0. Before coding: read these, in this order

Look in `frontend/docs/` (or `docs/`). File names may be upper case.

1. `AGENT.md` (project rules)
2. `Feature_Requirements.md` (feature IDs, tariff in Appendix A, water levels in Appendix B)
3. `Workflow.md` (flows, points rules, Open Items in section 5)
4. `page_refined.md` (this is `frontend/docs/SCREEN_SPEC.md`, the final page-by-page spec, screens S1 to S9)
5. `design.md` (this is `DESIGN.md`, all visual rules)
6. `UI_REQUIREMENT_PROMPT.md` (this is `UI_REQUIREMENTS.md`, build order and screen list)
7. `Environment_Setup.md` (packages, fonts, NativeWind)
8. `screen_spec.md` (older text, lowest priority, see section 1)

Screenshots are in the repo. `page_refined.md` already records what each screenshot shows and what to change. Do not re-read the screenshots to override it.

## 1. Which file wins

| Question | Winner |
|---|---|
| What a feature must do, rules, numbers | `Feature_Requirements.md`, then `Workflow.md` |
| Layout, content, copy, and states of a screen | `page_refined.md` |
| Colors, fonts, radius, spacing, motion, Forbidden list | `design.md` |
| Build order, tech, output format | `UI_REQUIREMENTS.md` |
| Anything the above leave open | `screen_spec.md`, only for screens that `page_refined.md` lists as "not seen yet" (onboarding, My day timeline, Scanner check and correct, Bill detail, Notifications) |

Do not silently resolve a conflict by inventing product behavior. If something is undefined, use a named constant with a `TODO(open-item N)` comment (see section 9), build only what is safely supported, and list the gap in your final report.

## 2. Task

Build the UI of all screens S1 to S9 in `page_refined.md`, for React Native (Expo). **UI only, with mock data.** Do not connect Supabase or Gemini yet.

Every screen and every state named in `page_refined.md` must exist and be openable (see the dev gallery in section 5).

## 3. Known conflicts between the docs (follow this table, do not re-decide)

| Topic | Old text | Follow |
|---|---|---|
| Title bar | `design.md` Unit 9 and `UI_REQUIREMENTS.md` say a title on the left on every screen | `page_refined.md` 1.1: no title bar on Simulator, Bin, Community, Profile (bell pill top right only). Scanner has a title block under the bell row. Sub-pages have a back arrow and title. |
| Simulator layout | `design.md` Unit 12 | `page_refined.md` S4: bill card left, stack on the right (bell, My day, fast-forward), "Edit" row, floor plan. The screen does not scroll. Nothing sits on top of the floor plan. The fast-forward panel pushes the plan down. |
| Onboarding steps | `design.md` and `UI_REQUIREMENTS.md` list four | Three steps: Schedule, House layout (with residents), Appliances (`Workflow.md` W2) |
| Living Leaf dial | Screenshot says "1 / 2 deeds" | `Feature_Requirements.md` COM-03: "deeds today / 3", Dry 0, Healthy 1, Lush 2 to 3. Use `LEAF_DAILY_DEED_CAP = 3`, `TODO(open-item 17)`. |
| Profile | Screenshot draws a summary row and a status pill on the hero | PRO-01: no summary row, and the status pill lives in the Resident sheet only |
| Floor plan | SIM-05 and `design.md`: 2.5D isometric. Screenshots: flat top-down. | `FLOOR_PLAN_STYLE: 'flat' \| 'isometric' = 'flat'`, `TODO(page_refined §5 item 3)`. Keep the room layout as data (rectangles on a grid) so the drawing can change without touching logic. |
| Colors in `screen_spec.md` | Hex values | `design.md` tokens (`page_refined.md` 1.2) |
| Uppercase small labels | Screenshots | Sentence case |
| Card radius 24 or 28 | Screenshots | 32 (`rounded-[2rem]`) |
| Google sign-in | Drawn on both auth screens | Behind `ENABLE_GOOGLE_AUTH = false` |
| Bin names | Mixed in screenshots | Paper, Plastic, Glass & Metal, General waste |
| Nested cards | Old rule: none | Allowed one level, mini card style only |

## 4. Scope

**In scope**
- All screens S1 to S9 with their states, in React Native.
- Shared components, theme tokens, navigation, a dev screen gallery.
- Mock data in one `mockData.ts`, and mock service functions for the Edge Functions (section 7).
- Pure logic modules with no UI imports (section 6), because the screens need correct numbers and `AGENT.md` section 8 asks for them to be tested first.

**Out of scope** (do not build)
- Supabase client calls, Auth, Storage, RLS, migrations, pg_cron.
- Gemini or any AI call. The app never calls Gemini (`AGENT.md` rule 1).
- Push notifications (version 1 is an in-app list only).
- Anything `page_refined.md` marks "Not in v1": Claim reward, plaque name, certificate, kWh saved, committee signature, notification preferences, "Tariff Band A", "12% lower than similar homes", Edit Block temperature, timer, fan speed, and cost preview, "Repeat on" and "Away" in Add block, the Profile summary row.
- Any new library not in section 8.

## 5. Folder layout and navigation

Inspect the repo first and adjust to what exists. Default:

```
frontend/
  app/                  Expo Router: (auth)/login, sign-up · (onboarding)/schedule, layout, appliances
                        (tabs)/simulator, bin, community, scanner, profile · notifications
                        _dev/index.tsx  dev screen gallery (only when __DEV__)
  components/           Button, Card, MiniCard, Input, Badge, BottomSheet, Toast, Slider,
                        ProgressBar, ListItem, EmptyState, Skeleton, TabBar, Header
  features/
    simulator/          floorplan, avatar, billCalc, myDay, fastForward
    bin/
    community/          livingLeaf, voting, dailyTasks
    scanner/            billUpload, anomaly, aiAnalysis
    profile/
  lib/                  theme.ts, formatters (money, dates), mockData.ts, flags.ts, services/
  docs/                 the md spec files
```

- The tab bar has 5 fixed tabs in this order: Simulator, Bin, Community, Scanner, Profile. Icons: `home`, `recycle`, `sprout`, `receipt-text`, `user`. Hidden on auth, onboarding, and the full-screen camera.
- Sheets and modals open on top of their tab and cover the tab bar.
- `Header` has variants: bell only (tabs), page title block (Scanner), back arrow and title (sub-pages), none (auth, onboarding).
- The dev gallery lists every screen and every state, so each can be opened without playing through the app. It must not appear in release builds or in the tab bar.

## 6. Pure logic (plain TypeScript, no UI imports)

Write these first. `frontend_test.md` lists the test cases.

| Module | Rules from |
|---|---|
| `billCalc` | `Feature_Requirements.md` Appendix A (tariff) and SIM-01. 30-minute slots, presence wins over My day, max bill before any My day answer, water heater formula, 30-day month (5/7 weekdays, 2/7 weekend days). AFA and tariff values come from a config object, not constants in code (`AGENT.md` rule 15). |
| `swap` | SIM-02: only higher stars, "Not sure" counts as 3, 5-star gives no suggestion, air conditioner suggestion is Inverter, saving = old bill minus new bill. |
| `fastForward` | SIM-04: months 1, 6, 12. Savings = monthly saving × months. RM 0 with no swap and no solar. The animation never changes the number. |
| `waterLevel` | Appendix B: higher of the MoM level and the volume level, volume limits scaled by residents ÷ 3, MoM rounded to a whole percent first, first bill uses volume only, RM does not decide. |
| `deeds` | COM-03: first 3 deeds per day give points, the 4th gives 0. Leaf stage by count. Day boundary is midnight in Asia/Kuala_Lumpur. |
| `energyPoints` | +50 once per billing month, even if the same month is saved again. |
| `avatarPlace` | W3d: shower block, then the active block's room, then living room. Away means outside. |
| `blocks` | SIM-07: no overlap, overnight only for Sleep, a block inside away time is ignored with a note. |

Money format is `RM 1,500` (thousands separator). Put it in `lib/formatters`.

## 7. Mock data and mock services

- All sample data lives in **one** `lib/mockData.ts`. One set of numbers everywhere (the old screenshots disagree: `RM 233` and `RM 248 / RM 348 est.`; use one set).
- Household: Mei Ling Tan, 18 Jalan SS 2/6, Petaling Jaya, Selangor, 3 residents.
- The estimated bill `RM 233` for `525 kWh` matches Appendix A, so keep it. **Compute RM from kWh with `billCalc`. Do not hand-type an RM amount that must follow from kWh.** Where the spec examples disagree (for example `RM 420` for October next to `340 kWh`), keep the value `UI_REQUIREMENTS.md` section 7 gives for the chart, add a `TODO`, and list it in your report. Do not fix it silently.
- October water: `18 m³`, `+48%` vs September, level Leak detected. Build all four water levels in the mock data.
- Points example `340 / 500` and community `240 households`, `184 / 240` voted. The targets are examples only (`TODO(open-item 1)`).
- The Living Leaf must show all three stages (Dry, Healthy, Lush) in the mock data.
- Mock services mirror the Edge Functions in `Workflow.md`, so the real calls replace them later: `classifyWaste`, `confirmDisposal`, `readBill`, `analyzeBill`, `awardEnergyPoints`. Each returns after a short delay, is marked `// MOCK`, and lives in `lib/services/`. **Screens never write points or deeds.** Only these service functions change them (`AGENT.md` rule 2).
- "Try swap" lives in memory only and is never saved (`AGENT.md` rule 5).
- AI text in the mock data may only contain numbers that come from the mock numbers. Do not invent RM amounts or percents.

## 8. Tech and libraries

React Native (Expo), TypeScript, Expo Router, NativeWind, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `lucide-react-native` (stroke 1.5), `expo-font` with Lora and Source Sans 3, `expo-camera`, `expo-image-picker`, `expo-document-picker`. Follow `Environment_Setup.md` (use `npx expo install` for Expo packages). No 3D engine.

**Ask before adding** a time-wheel picker, a bottom-sheet library, a chart library, an image-loading library, or a location library. Build the `BottomSheet` yourself with Reanimated and Gesture Handler. Draw charts with `react-native-svg`. Build a simple in-house time picker. "Use my location" stays behind a flag until decided.

## 9. Open items to wire as named constants

Put them in `lib/flags.ts` or the feature's constants file. Each has a `TODO(open-item N)` comment. Do not pick a value silently.

| Item | Constant | Default |
|---|---|---|
| Google sign-in (`page_refined` §5 item 1) | `ENABLE_GOOGLE_AUTH` | `false` |
| Floor plan style (item 3) | `FLOOR_PLAN_STYLE` | `'flat'` |
| Edit Block controls (item 4) | `ENABLE_EDIT_BLOCK_EXTRA_CONTROLS` | `false` |
| Furniture tab (item 5) | `ENABLE_FURNITURE_TAB` | `false` |
| "High usage" badge (item 7) | `HIGH_USAGE_THRESHOLD_RM` | `null` (badge hidden) |
| Lights swap rule (item 9) | `ENABLE_LIGHTS_SWAP` | `false` until a rule exists |
| CO₂ card (item 10) | `SHOW_CO2_CARD` | `false` |
| Voting window (item 12) | `VOTE_CLOSES_AT`, `RESULT_AT` | mock dates, `TODO` |
| Claim reward (item 13) | none, not built | |
| Solar "See how" (Workflow item 10) | `SOLAR_SEE_HOW_ROUTE` | `null`, button shows a "coming soon" toast |
| Leaf dial (item 17) | `LEAF_DAILY_DEED_CAP` | `3` |
| Monthly points target, household milestone (Workflow item 1) | `COMMUNITY_MONTH_TARGET_PTS`, `HOUSEHOLD_MILESTONE_PTS` | mock example |
| Simulator deed (Workflow item 2) | none | the "energy-saving action" task card exists, but nothing awards points for it |
| Neighbourhood sector (Workflow item 3, item 2) | `NEIGHBOURHOOD_NAME` from mock data | |
| Deed limit text for the Bin | from `LEAF_DAILY_DEED_CAP` | |

## 10. Design rules in short (`design.md` is the full list and wins)

- Mood: Natural Organic. Warm, earthy, calm. Slow, soft motion, 300 to 700 ms ease-in-out. No bounce.
- Screen background `#faf6f1` (the Simulator uses `sage-50` as in the screenshots). `px-6`, section gap `gap-8`, item gap `gap-4`. Scroll screens use `pb-28`.
- Card: `bg-[#faf6f1] rounded-[2rem] border border-stone-200 p-6`. Mini card (one level only): `bg-white rounded-[1.25rem] border border-stone-200 p-4`, no shadow.
- Buttons and inputs `rounded-full`. Primary `bg-stone-800 text-stone-50`. Accent `bg-[#8b9d77] text-stone-800`. Disabled `bg-stone-200 text-stone-400`.
- Headings and numbers in Lora. Body in Source Sans 3. Text 12 px or more.
- Water data `sage-500`. Electricity data `tan-400`. Status colors are earthy (success `sage-100`, warning `amber-50`, error `#fbece8` with `#a8442f`).
- Every status has an icon and text, never color alone.
- Web classes need a native version: focus ring via `onFocus` and `onBlur` state, `placeholderTextColor`, the brown `shadow-sm` style object (`elevation: 1`), Reanimated for press scale and color transitions. No hover.
- **Never use:** blue, purple, or cyan as a main color, `#000000`, gradients, neon, glow, glassmorphism, `rounded-none`, `shadow-lg` or bigger, bounce, tiny uppercase tracked labels, side-stripe accent borders, cards nested two levels, gray text on colored backgrounds.
- Accessibility: contrast 4.5:1, touch targets 48 × 48, font scaling to 130% without clipped text, `accessibilityLabel` and `accessibilityRole="button"` on every icon-only button, `AccessibilityInfo.isReduceMotionEnabled` respected everywhere there is motion.
- Wrap screens in `SafeAreaView`. Wrap forms in `KeyboardAvoidingView`. Camera and file pickers need permission texts in `app.json` and a "permission denied" state.
- Screens use only the shared components. Build them before any screen.

## 11. Screens to build

States come from `page_refined.md` section 2 and `UI_REQUIREMENTS.md` section 6. Use `page_refined.md` for copy, and build every state listed.

| Screen | Spec | Features | States to build |
|---|---|---|---|
| S1 Login | S1 | AUTH-01 | default, wrong password, loading, no internet (toast and retry) |
| S2 Sign up | S2 | AUTH-01 | empty (disabled button), filled, field errors (state, city, email, password under 8), email already used with login link, loading |
| S3 Onboarding | S3 (and `screen_spec.md`) | ONB-01 to 03 | 3 steps, leaf-dot progress, range errors (end before start, overlap), appliance details with stars and "Not sure", resume at the first step not done |
| S4 Simulator | S4.1 to S4.6 | SIM-01 to 07 | empty plan, plan with appliances, Edit mode tray, Bill modal (filled, empty), max-bill note, suggestion area (idle row, first time, Swap & Compare with Try and Undo, Solar), fast-forward (closed, open, playing, reduced motion), avatar poses, home looks (light on, off, away "Energy saving", backdrop by time of day), My day Quick setup (4 cards), timeline (Weekdays or Weekends, 24-hour strip, away blocks locked), Add block (valid, error), Edit Block, away note |
| S5 Bin | S5.1 to S5.3 | BIN-01, 02 | home, camera view (permission denied, scanning), result for each of the four bins, low confidence, AI error, daily limit reached toast, "+10" toast |
| S6 Community | S6.0 to S6.3 | COM-01 to 03 | home with letter waiting, voted waiting, result ready, reward unlocked and not unlocked, Living Leaf in all 3 stages, task cards To do and Done, Ballot sheet (nothing preselected), Result sheet |
| S7 Scanner | S7.1 to S7.4 | SCN-01 to 04 | home, all four water levels, filter All, Electricity, Water, month tap detail, AI Analysis (loading, loaded, error, first bill), check and correct (reading, cannot read, replace confirm), result, Bill detail with delete confirm, archive list |
| S8 Profile | S8 | PRO-01 | hero, Resident sheet (At home, Out), list, Log out |
| S9 Notifications | S9 | NOT-01 | grouped list, unread dot, mark all as read, empty |

Also build the shared status patterns (`page_refined.md` 1.3 and section 3): skeleton, empty state, server error toast, no internet, permission denied, reduced motion, font scaling.

## 12. Hard rules (from `AGENT.md`)

- The app never calls Gemini. Points and deeds are never written by a screen.
- The bill is calculated on the device. Presence always wins over My day. Before any My day answer, show the max bill and the note.
- The fast-forward animation only shows a number. It reads and writes no data. The avatar is only a picture of the data.
- Water level is the higher of the MoM level and the volume level. The AI only explains it.
- Max 3 deeds per day give points. One vote per household per month. Voting uses no points.
- Mention the feature ID (for example `SIM-04`) in file header comments and commit messages.
- When you change behavior, update the matching md file in the same change.
- Do not add libraries, fonts, or colors that are not in `design.md` or section 8 without asking.

## 13. Implementation order

Do not create parallel infrastructure before you inspect the repo.

1. Inspect the repo: existing theme, components, routes, mock data, config. Reuse what exists.
2. `theme.ts`, `tailwind.config.js` tokens, fonts, `flags.ts`.
3. Pure logic modules and `formatters` (section 6).
4. `mockData.ts` and mock services (section 7).
5. Shared components (section 10), then the tab bar and header variants.
6. Screens in the order of section 11, one feature ID per change. Before each screen, list the `page_refined.md` sections you use.
7. Navigation and the dev gallery.
8. Run the checks in section 14.

If a rule is unclear or an open item blocks you, stop and ask. Do not fill the gap with a guess.

## 14. Validation

Run the project's existing commands (see `AGENT.md` section 7):

```bash
npx expo lint        # or: npx eslint .
npx tsc --noEmit
npm test
```

Fix errors you introduced. Do not hide old unrelated errors; list them separately. `frontend_test.md` has the full test and cleanup pass.

## 15. Acceptance checklist

- [ ] Every screen and state in section 11 exists and opens from the dev gallery.
- [ ] Only shared components are used. Nested cards are one level, mini card style.
- [ ] Nothing from the Never use list appears.
- [ ] Every status has an icon and text.
- [ ] Touch targets 48 px, text 12 px or more, font scaling 130% works, reduced motion works.
- [ ] The Simulator never scrolls and nothing sits on top of the floor plan.
- [ ] No title bar on Simulator, Bin, Community, Profile. Scanner has its title block.
- [ ] 3 onboarding steps. Profile has no summary row and no status pill on the hero.
- [ ] Money is formatted `RM 1,500`. RM amounts come from `billCalc`.
- [ ] No Google button unless `ENABLE_GOOGLE_AUTH` is true.
- [ ] No screen writes points or deeds.
- [ ] The screens look warm, earthy, and handmade at a glance.

## 16. Report before you finish

1. Files changed and created.
2. Components created and reused.
3. Routes wired, and how to open the dev gallery.
4. Every named constant and `TODO(open-item N)` you left, with its default.
5. Every place the docs disagreed or were silent, and what you did.
6. Mock numbers that disagree with the tariff or with each other.
7. What is mocked (services, data) and what each real replacement will be.
8. Validation results: lint, `tsc --noEmit`, tests. Separate your errors from old ones.
9. Confirmation that the tab bar has exactly the 5 tabs in section 5 (Simulator, Bin, Community, Scanner, Profile), and that no extra navigation destination was added.

**Completion rule:** report this as "UI complete, data mocked", never as "integrated". Do not claim Supabase, Gemini, points, or voting persistence works.
