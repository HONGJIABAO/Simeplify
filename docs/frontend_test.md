# Frontend Test and Cleanup Prompt: Simeplify / EcoTwin

Paste this whole file into your AI coding agent after the UI is built (`frontend_Implementation.md`).

Project context:

- Simeplify / EcoTwin is a **React Native (Expo)** mobile app with Expo Router, TypeScript, and NativeWind. It is not a web app.
- This phase is **UI with mock data**. There is no Supabase and no Gemini call yet.
- Rules are in `AGENT.md`. Behavior is in `Feature_Requirements.md` and `Workflow.md`. Screens are in `page_refined.md` (`frontend/docs/SCREEN_SPEC.md`). Visual rules are in `design.md` (`DESIGN.md`).

Ground rules:

- Do not change UI behavior unless a test shows a clear bug. If you fix a bug, say which test found it.
- Do not delete files blindly. If you are unsure whether something is safe to remove, leave it and add a note.
- Do not rewrite the architecture, rename public APIs, or change the folder structure.
- If a test needs a decision the docs do not give, do not guess. Use the named constant, mark the test `TODO(open-item N)`, and report it.

---

## 1. Run the project checks first

Use whichever scripts are configured (`AGENT.md` section 7):

```bash
npx expo lint            # or: npx eslint .
npx tsc --noEmit
npm test
```

Write down the result of each before you change anything. This is the baseline. Later, keep errors you introduced apart from old errors.

## 2. Unit tests for the pure logic (write these first)

These have clear rules in the docs (`AGENT.md` section 8). Put tests next to the modules in `frontend/features/*` and `frontend/lib`. The modules must have no UI imports.

### 2.1 Bill calculation (`Feature_Requirements.md` Appendix A)

Formula: `generation = min(kWh,1500)×0.2703 + max(kWh−1500,0)×0.3703`, `capacity = kWh×0.0455`, `network = kWh×0.1285`, `retail = 10 if kWh > 600`, `afa = kWh × afa_rate`. Round to 2 decimals.

| kWh | AFA rate | Expected RM |
|---|---|---|
| 0 | 0 | 0.00 |
| 525 | 0 | 233.26 (shows as `RM 233`) |
| 600 | 0 | 266.58 (no retail charge) |
| 601 | 0 | 277.02 (retail charge starts) |
| 1000 | 0 | 454.30 |
| 1000 | −0.011 | 443.30 (negative AFA lowers the bill) |
| 1500 | 0 | 676.45 |
| 1501 | 0 | 676.99 (only the kWh above 1,500 use the higher rate) |
| 1600 | 0 | 730.88 |

Also test:

- The tariff and AFA come from a config object. Changing the AFA in the config changes the result, with no code change.
- The solar suggestion shows when the bill is RM 500 or more: test with bill values 499.99 (no) and 500.00 (yes). A bill of RM 500 is about 1,100 kWh, so a normal home never triggers it.
- The estimate has no Energy Efficiency Incentive, no taxes, no Time-of-Use (nothing in the result for them).

### 2.2 Presence, My day, and the max bill (SIM-01, Workflow W3a)

- Away slot: appliances that need a person (air conditioner, lights, TV, fan, other) are off, **even when My day lists them**. Presence wins.
- Always-on appliances (fridge, router) are on in every slot, including away slots.
- Before any My day answer: every person-dependent appliance is on in all home slots (the max bill), and the "max bill" note shows.
- After My day is saved: in a home slot, an appliance is on only if the active block lists it. With no block, only the living room lights are on, and only between 19:00 and 07:00.
- Skipping every card keeps the max bill.
- Water heater: `kWh per day = showers per person × residents × minutes per shower ÷ 60 × wattage ÷ 1000`. Defaults: 2 showers, 10 minutes. With 3 residents and a 3,000 W heater that is `2 × 3 × 10 ÷ 60 × 3000 ÷ 1000 = 3.0 kWh/day`.
- A month is 30 days: 5/7 weekdays and 2/7 weekend days, each with its own schedule. My day is the same on both.
- Changing the schedule, an appliance, My day, or a swap recalculates the bill.

### 2.3 Swap and fast-forward (SIM-02, SIM-04)

- A swap suggestion appears only for a frequently used appliance with fewer than 5 stars. A 5-star appliance gives none. "Not sure" counts as 3 stars.
- The suggested rating is always higher. Never equal or lower.
- An air conditioner suggestion says Inverter.
- Saving = old monthly bill − new monthly bill. The suggestion has no brand, model, or price.
- "Try swap" changes the bill in memory. "Undo" restores it. Nothing is saved (check that no storage or service function is called).
- Fast-forward: 1M, 6M, 1Y map to 1, 6, 12 months. Total = monthly saving × months. With no swap and no solar the total is `RM 0`.
- The animation function never returns a number different from the total, and reads and writes no data.

### 2.4 Fast-forward state machine (SIM-04, W3c)

| Action | From | To |
|---|---|---|
| Tap button | closed | open (icon `play`, panel shows, nothing plays) |
| Tap button | open | playing (icon `square`) |
| Tap button | playing | open (stopped, no new animation) |
| Drag slider | playing | open (stopped) |
| Release slider | open | open (does **not** play) |
| Tap outside | open | closed |
| 10 s after the end | open | closed (use fake timers) |
| Tap outside | playing | stays playing |
| Reduced motion on, second tap | open | shows the final date and savings, no animation |

Durations: 4 s for 1M, 6 s for 6M, 8 s for 1Y.

### 2.5 Blocks and schedule (ONB-01, SIM-07)

- Schedule: end must be after start. Overlapping ranges on the same day are rejected. Unmarked time counts as at home. Copy to other days works.
- Blocks cannot overlap. Overnight is allowed only for Sleep. A block inside an away range is ignored and the note shows.
- Only appliances in the block's room are listed. Away blocks are locked. Sleep cannot be deleted.
- "Reset to default" restores the default blocks from `Workflow.md` 3e (Sleep 23:00 to 07:00, meals at 07:00, 12:00, 19:00 for 30 minutes, Evening 20:00 to 23:00, showers at 07:15 and 20:30).
- Avatar place: a shower block gives the bathroom, then the active block's room, then the living room. An away slot gives outside.

### 2.6 Water anomaly level (SCN-02, Appendix B)

The level is the higher of the MoM level and the volume level. Round MoM to a whole percent first.

| MoM % | Expected MoM level |
|---|---|
| −10 | Normal |
| 19.4 | Normal |
| 20 | Minor drip |
| 29 | Minor drip |
| 30 | Leak detected |
| 99 | Leak detected |
| 100 | Major pipe burst |

| Residents | Volume m³ | Expected volume level |
|---|---|---|
| 3 | 22 | Normal |
| 3 | 22.1 | Minor drip |
| 3 | 29.9 | Minor drip |
| 3 | 30 | Leak detected |
| 4 | 29 | Normal (limit is 22 × 4 ÷ 3 = 29.3) |
| 4 | 40 | Leak detected (30 × 4 ÷ 3 = 40) |

Combined cases:

- 18 m³, 3 residents, +48% vs last month: volume Normal, MoM Leak, so **Leak detected** (the demo case).
- 10 m³ and +100%: **Major pipe burst** (no volume rule for Major).
- 31 m³ with +25%: Leak detected (the higher one).
- First bill (no last month): the volume check only.
- The RM amount never changes the level (same level for two different RM values).
- Normal: no banner. Minor drip: a tip line only, no banner, no notification. Leak and Major: banner and notification (check which one the mock notification list gets).

### 2.7 Deeds, Living Leaf, and points (COM-03, BIN-02, COM-02)

- The first 3 deeds of a day give points. The 4th gives 0. The Bin still shows the right bin.
- Leaf stage: 0 deeds Dry, 1 Healthy, 2 Lush, 3 Lush.
- Day boundary is Malaysia time (Asia/Kuala_Lumpur): `2026-10-19T15:59:59Z` is still Oct 19, and `2026-10-19T16:00:00Z` is Oct 20 and the leaf is Dry again.
- Recycling gives +10 per recyclable item and 0 for General waste.
- Energy points: +50 once per billing month. Saving the same month again gives nothing more. The +50 counts as one deed.
- Vote: one per household per month. A second vote is rejected. Voting changes no points.

## 3. Component and screen tests

Use React Native Testing Library (`@testing-library/react-native`). Mock the services in `lib/services` and the data in `lib/mockData.ts`. If the testing library is not installed, ask before adding it.

For **every screen** in `page_refined.md` section 2, test that each state renders and its main action works:

| Screen | Check |
|---|---|
| S1, S2 | Wrong password shows the message with an icon. Empty sign up has a disabled button. Errors show after the field is left. "Email already used" shows a login link. The Google button is absent when `ENABLE_GOOGLE_AUTH` is false. |
| S3 | 3 steps. Range errors show. "Not sure" saves 3 stars. Back and Next keep the data. |
| S4 | The screen has no scroll view. Nothing renders over the floor plan. The fast-forward panel pushes the plan down. The bill counts to the new number. The Bill modal has filled and empty states, and "Add appliances" turns on Edit mode. The suggestion area shows one suggestion at a time. The Solar suggestion does not come back in the same session after it is closed. My day: Quick setup has up to 4 cards and skips cards for missing appliances. Add block error state disables Save. |
| S5 | Four bins each show icon and text. Low confidence shows "Retake the photo". Permission denied shows "Open settings". AI error shows "Try again". "I threw it" shows "+10", and after 3 deeds the toast says the daily limit is reached. |
| S6 | All three leaf stages render. Ballot has nothing selected when it opens. Submit is disabled until one option is selected. After voting the card shows the vote and the turnout. A second vote is not possible. The Result sheet bars sum to the vote total. |
| S7 | All four water levels render with the right style and an icon. The filter changes the chart. Tapping a month shows both amounts. AI Analysis shows loading, loaded, error, and first-bill states. Bill detail shows the saved analysis without calling the mock `analyzeBill`. Delete asks for confirmation. |
| S8 | No summary row. Tapping the avatar opens the Resident sheet with the status pill. The pill is not on the hero. Log out returns to Login. |
| S9 | Groups Today and Earlier. Unread dot. "Mark all as read" clears the dots. Empty state text is "You are all caught up." |

Shared checks (render each shared component once):

- Every icon-only button has `accessibilityLabel` and `accessibilityRole="button"`.
- Disabled buttons use the disabled style and ignore presses.
- With reduced motion on (mock `AccessibilityInfo.isReduceMotionEnabled`), no movement animation runs.
- Text at font scale 1.3 does not clip: check that text nodes have no fixed height (or that they wrap).
- `Toast` hides after 3 s. `BottomSheet` covers the tab bar and the scrim closes it.

## 4. Static scans

Run these from the repo root. Each match must be explained or fixed. A match in a comment or in `design.md` text is fine.

```bash
# Forbidden list (design.md Unit 15)
rg -n "#000000|#000\b|text-black|bg-black" frontend --glob '!node_modules'
rg -n "bg-(blue|purple|cyan|indigo|violet)-|text-(blue|purple|cyan)-" frontend --glob '!node_modules'
rg -n "bg-gradient|LinearGradient|expo-linear-gradient" frontend --glob '!node_modules'
rg -n "shadow-(lg|xl|2xl)|rounded-none|rounded-sm" frontend --glob '!node_modules'
rg -n "uppercase|tracking-(wide|wider|widest)" frontend --glob '!node_modules'
rg -n "Inter|Roboto|Geist|Fraunces|Plus Jakarta" frontend --glob '!node_modules'

# Text and touch size
rg -n "fontSize: ?(8|9|10|11)\b|text-\[(8|9|10|11)px\]" frontend --glob '!node_modules'
rg -n "\b(h|w)-(8|9|10|11)\b" frontend --glob '!node_modules'   # review: tap targets must be 48 px

# Security and data rules (AGENT.md section 4)
rg -n "GEMINI|AIza|service_role" frontend --glob '!node_modules' --glob '!*.md'
rg -n "@supabase/supabase-js" frontend --glob '!node_modules'   # expect none in this phase, or only an unused client file
```

Also check by reading:

- No screen file changes points or deeds. Only functions in `lib/services` do.
- No screen file has its own copy of the tariff, water limits, or deed cap. They come from the logic modules and config.
- Every `TODO(open-item N)` matches a row in `frontend_Implementation.md` section 9.
- No card holds a card that holds a card.

## 5. Manual acceptance (Expo Go or a simulator)

Use the dev gallery to open each screen and state. Test at 360 px and 430 px wide, and at font scale 130%.

- [ ] Tab bar: exactly Simulator, Bin, Community, Scanner, Profile, in that order. Hidden on auth, onboarding, and the camera.
- [ ] No title bar on Simulator, Bin, Community, Profile. Scanner has its title block.
- [ ] Simulator: does not scroll. The floor plan fills the space. The fast-forward panel pushes the plan down and never covers it.
- [ ] Fast-forward: first tap opens, second tap plays, tap or drag stops, releasing the slider does nothing.
- [ ] Bottom sheets and modals cover the tab bar, share one scrim, and fit the screen width (no card past the edge).
- [ ] Keyboard does not hide the focused input or the main button.
- [ ] Reduced motion: the avatar stays still, fast-forward shows the final result, reveals use fades.
- [ ] Every status has an icon and text, not color alone (water levels, bin names, bill chart, stage pills).
- [ ] Contrast 4.5:1 for body text on cream, sage, and tan fills.
- [ ] The app looks warm, earthy, and handmade at a glance.

## 6. Cleanup pass (only when sections 1 to 4 are green)

Use Fallow as the cleanup tool. Find unused code, dead files, circular dependencies, duplicate code, dependency issues, and complexity hotspots.

```bash
npx fallow ./frontend
npx fallow ./frontend/app
npx fallow ./frontend/components
npx fallow ./frontend/features
npx fallow ./frontend/lib
```

Prioritize: unused imports, variables, components, and helpers; duplicate components or helpers; circular imports; unused dependencies; overly complex components; leftover experimental files; a feature importing the internals of another feature instead of a shared export.

**Do not remove** (Fallow may flag them, but they are used or intended):

- Expo Router files (`_layout.tsx`, `index.tsx`, `[param].tsx`, `+not-found.tsx`) and the `app/_dev` gallery.
- `app.json`, `app.config.ts`, `babel.config.js`, `metro.config.js`, `tailwind.config.js` (the tokens are used through NativeWind class names, so they look unused), `global.css`.
- Platform files (`*.ios.tsx`, `*.android.tsx`), dynamic imports, tests.
- Fonts and images referenced only by string path.
- `lib/mockData.ts` and `lib/services/*`. They are the only data layer in this phase and are not dead code.
- Code behind a flag that is off by default (Google sign-in, Furniture tab, Edit Block extra controls, CO₂ card, High usage badge). These are intentional, see `frontend_Implementation.md` section 9.
- Shared components, form validation, accessibility props, loading, empty, and error states, the reanimated press and motion helpers.

Keep cleanup small. Move repeated logic into a hook or util only when it clearly removes duplication. Remove an unused prop only after checking the parents. Avoid new state when a value can be derived, and avoid a `useEffect` when render logic is enough. Keep `useMemo`, `useCallback`, and `React.memo` where they help (lists, the floor plan, charts).

After cleanup, run again: lint, `tsc --noEmit`, `npm test`, and `npx fallow ./frontend`.

## 7. Report before you finish

1. Baseline result of lint, `tsc --noEmit`, and tests, and the result after your changes.
2. Tests written (count per module and per screen), and any test marked `TODO(open-item N)`.
3. Bugs the tests found, and what you fixed.
4. Static scan matches you fixed, and matches you left with the reason.
5. Manual checklist results, item by item, with anything you could not check (say why).
6. Files changed, what was removed, what was refactored.
7. Fallow warnings that remain, and which you ignored on purpose and why.
8. Risky areas to review by hand before pushing (fast-forward timers, drag and drop on the floor plan, bottom sheet gestures, keyboard handling, time zone code).

Do not report the work as done if tests for section 2 are missing, or if a failing test was skipped or deleted. Say what is still failing.
