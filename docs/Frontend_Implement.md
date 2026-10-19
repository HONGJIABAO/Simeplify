# Frontend Implement: stage prompt for Simeplify / EcoTwin

One prompt for the whole group. You only change **Part A**. Part B never changes.

---

## How to use

1. Pick your stage in **Part C** and copy its block.
2. Paste the block over the **EDIT HERE** block in **Part A**. (Or fill Part A by hand.)
3. Copy everything between `=== PROMPT START ===` and `=== PROMPT END ===` (Part A and Part B) into the AI coding agent.
4. Do not edit Part B. If a rule has to change, change the doc it comes from (`AGENT.md`, `design.md`, `Feature_Requirements.md`, `Workflow.md`, `page_refined.md`) and tell the group.
5. One stage for each prompt. Never paste two blocks together.
6. When the agent reports: open the screens, check the "Done when" line, then `git commit`. Run `Implementation_Review.md` when a whole tab is done.

**Check before you paste**

- [ ] The earlier stage this one depends on is committed.
- [ ] The screenshot paths in Part A exist in the screenshot folder.
- [ ] You pasted exactly one block.
- [ ] You filled every field (no `<...>` left).

---

=== PROMPT START ===

## Part A: EDIT HERE

```
Stage:                 <number> - <name>
Feature IDs:           <for example SIM-04, SIM-05>
Screens and sections:  <for example S4.3 in page_refined.md>
Screenshots:           <paths in the screenshot folder, or "none">
States to build:       <every state. Each one must open from the dev gallery>
Rules for this stage:  <short list, each with its source file and section>
Flags and open items:  <constant name = default, TODO(open-item N)>
Out of scope:          <what not to build in this stage>
Done when:             <what I will see on the screen>
```

---

## Part B: FIXED (do not edit)

### 1. Read first (every time, even if you read them before)

Read in this order:

1. `AGENT.md` (rules)
2. `frontend_Implementation.md`: section 3 (known conflicts, follow that table), 8 (libraries), 9 (flags and open items), 10 (design rules in short), 11 (screens and states), 12 (hard rules), 13 (order), 14 to 16 (checks, acceptance, report)
3. `page_refined.md` (layout, copy, and states of each screen; section 0 has the React Native rules)
4. `design.md` (all visual rules, including the Forbidden list in Unit 15)
5. `Feature_Requirements.md` and `Workflow.md`, only for the features named in Part A
6. `frontend_test.md`, only if this stage has logic or tests
7. `docs/BUILD_OUTLINE.md`, if it exists (section 10 has the stage list)
8. `screen_spec.md`: lowest priority. Use it only for screens that `page_refined.md` marks as "not seen yet".

**Which file wins**

| About | Winner |
|---|---|
| What a feature must do, rules, numbers | `Feature_Requirements.md`, then `Workflow.md` |
| Layout, content, copy, and states of a screen | `page_refined.md` |
| Colors, fonts, radius, spacing, motion, Forbidden list | `design.md` |
| Build order, libraries, flags, report format | `frontend_Implementation.md` |

Do not silently fix a conflict by inventing product behavior. If something is not defined, use a named constant with a `TODO(open-item N)` comment, build only what is safely supported, and list the gap in your report.

### 2. Task

Build the stage named in Part A. React Native (Expo), TypeScript, NativeWind. **UI only, with mock data.** No Supabase and no Gemini.

Before you write code, list: the rows of `frontend_Implementation.md` section 11 you will build, the sections of `page_refined.md`, the feature IDs, the shared components, and the logic modules you will use.

Do **only** this stage. Do not start the next one.

### 3. What already exists (reuse it)

- The Stage 0 skeleton: the 5-tab bar (Simulator, Bin, Community, Scanner, Profile), the Header variants, the theme and fonts, `lib/flags.ts`, and the dev gallery index.
- Shared components, if earlier stages are done.

Do not rebuild the tab bar, the header, the theme, or a shared component. Do not create a second navigation. Do not add a sixth tab.

If something this stage needs is missing (a shared component, a logic module, mock data), **stop and tell me which earlier stage is missing.** Do not build it silently. A tiny helper is fine, but name it in your report.

### 4. Folder placement

Follow the repository's own layout (the starter uses `src/app`). Do not create a parallel `app/` or `frontend/` folder.

- Routes in `src/app/`.
- Shared components in `src/components/`, one file each.
- Feature code in `src/features/<tab>/` (simulator, bin, community, scanner, profile).
- Pure logic in `src/features/<tab>/` or `src/lib/`, with no UI imports.
- Mock data in **one** `src/lib/mockData.ts`. Mock services in `src/lib/services/`.

Screens use only the shared components. A screen never defines its own button, card, or input.

### 5. Data and service rules

- All sample data is in `mockData.ts`. One set of numbers everywhere. Do not type a number in a screen.
- RM amounts that must follow from kWh come from `billCalc`. Do not hand-type them. Money format: `RM 1,500`.
- Mock services mirror the Edge Functions (`classifyWaste`, `confirmDisposal`, `readBill`, `analyzeBill`, `awardEnergyPoints`). Each one is marked `// MOCK` and returns after a short delay.
- **Screens never write points or deeds.** Only the mock services change them.
- "Try swap" lives in memory only. It is never saved.
- AI text in the mock data may only contain numbers that come from the mock numbers.
- The app never calls Gemini. No Supabase calls. No secrets in the app.

### 6. Design rules in short (`design.md` is the full list and wins)

- Mood: Natural Organic. Warm, earthy, calm. Motion 300 to 700 ms, ease-in-out. No bounce.
- Screen background `#faf6f1`. Card `bg-[#faf6f1] rounded-[2rem] border border-stone-200 p-6`. Mini card (one nesting level only): `bg-white rounded-[1.25rem] border border-stone-200 p-4`, no shadow.
- Buttons and inputs `rounded-full`. Headings and numbers in Lora. Body in Source Sans 3.
- Water data `sage-500`. Electricity data `tan-400`.
- Every status has an icon and text, never color alone.
- **Never use:** blue, purple, or cyan as a main color, `#000000`, gradients, neon, glow, glassmorphism, `rounded-none`, `shadow-lg` or bigger, bounce or elastic motion, tiny uppercase tracked labels, cards nested two levels.
- Accessibility: contrast 4.5:1, touch targets 48 × 48, text at least 12 px, font scaling to 130%, `accessibilityLabel` and `accessibilityRole="button"` on every icon-only button, `AccessibilityInfo.isReduceMotionEnabled` respected wherever there is motion.

### 7. React Native rules

- `View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`, `Image`. No HTML tags, no CSS files, no hover.
- Wrap every screen in `SafeAreaView`. Wrap forms in `KeyboardAvoidingView`. Scroll screens use `pb-28`. The Simulator does not scroll.
- Press state with `Pressable` (sink 2 px). Focus state from `onFocus` and `onBlur`. `placeholderTextColor` for placeholders.
- Camera and file pickers need a permission text in `app.json` and a "permission denied" state.
- Do not add a library without asking. Ask before adding a time-wheel picker, a bottom-sheet library, a chart library, an image library, or a location library. Draw charts with `react-native-svg`. Use the shared `BottomSheet`.

### 8. States

- Build **every state** named in Part A, and add each one to the dev gallery (`__DEV__` only, never in the tab bar or in a release build).
- Also build the shared status patterns that apply to the stage: skeleton, empty state, server error toast, no internet, permission denied, reduced motion, and font scaling to 130%.

### 9. Open items

- Use the named constants and flags from `frontend_Implementation.md` section 9 (for example `ENABLE_GOOGLE_AUTH = false`). Each has a `TODO(open-item N)` comment.
- Do not pick a value silently. If an open item blocks you, stop and ask.

### 10. Out of scope (always)

- Supabase, Auth, Storage, RLS, migrations, pg_cron, Gemini, push notifications.
- Anything `page_refined.md` marks "Not in v1" or "Dropped". Its absence is correct.
- Any screen that is not named in Part A.
- Any new tab, new bottom-bar destination, or second navigation.
- Any new library, font, or color that is not in `design.md` or `frontend_Implementation.md` section 8.

### 11. Order of work

1. Inspect the repo: existing theme, components, routes, mock data, flags. Reuse what exists.
2. List what you will use (section 2).
3. Build the pieces (logic first if the stage has logic, then components, then screens).
4. Add every state to the dev gallery.
5. Run the checks (section 12).
6. Report (section 14).

### 12. Checks

```bash
npx tsc --noEmit
npx expo lint        # or: npx eslint .
npm test
```

Fix the errors you introduced. Do not hide old errors. List them separately. Then search the code for these banned items and show that none exist: `bg-blue-`, `bg-purple-`, `bg-cyan-`, `text-black`, `rounded-none`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `bg-gradient`.

### 13. Acceptance checklist

- [ ] Every state in Part A exists and opens from the dev gallery.
- [ ] Only shared components are used. Nested cards are one level, mini card style.
- [ ] Nothing from the "Never use" list appears.
- [ ] Every status has an icon and text.
- [ ] Touch targets 48 px, text 12 px or more, font scaling 130% works, reduced motion works.
- [ ] No screen writes points or deeds. No number is typed in a screen.
- [ ] The tab bar still has exactly 5 tabs.
- [ ] Every "Done when" line in Part A is true.
- [ ] The screen looks warm, earthy, and handmade at a glance.

### 14. Report before you stop

1. Files changed and created.
2. Components created and reused.
3. How to open each screen and each state.
4. Every `TODO(open-item N)` and named constant you left, with its default.
5. Every place the docs disagreed or were silent, and what you did.
6. What is mocked, and what the real replacement will be.
7. Check results (tsc, lint, tests, banned-class search). Separate your errors from old ones.
8. Confirmation that the tab bar has exactly the 5 tabs and that no extra navigation was added.
9. Anything you could not do.

### 15. Completion rule

Report the stage as **"UI complete, data mocked"**, never as "integrated". Do not claim that Supabase, Gemini, points, deeds, or voting persistence works.

Then **STOP and wait for me.**

=== PROMPT END ===

---

## Part C: Ready-made blocks (copy one into Part A)

### Stage 1: Theme and shared components

```
Stage:                 1 - Theme and shared components
Feature IDs:           none
Screens and sections:  none. A component gallery at /_dev/components
Screenshots:           none
States to build:       Button (primary, secondary, accent, disabled, loading, pressed); Input (default, focused, error,
                       password show and hide); Badge (sage, tan, stone, amber, error); BottomSheet (auto, 88%, full,
                       docked with no scrim, reduced motion); Toast (success, error, warning, info); Slider (continuous and
                       3 stops 1M/6M/1Y); ProgressBar; ListItem; EmptyState; Skeleton; Stepper; Chip (selected, not
                       selected); SegmentedControl; Switch; Header (bell only, page title block, back and title, none);
                       TabBar (5 tabs, selected state); Card and MiniCard
Rules for this stage:  design.md all units (tokens, components, Unit 15 Forbidden); frontend_Implementation.md section 10;
                       page_refined.md section 0 (React Native rules); BottomSheet built with Reanimated and Gesture
                       Handler (no new library); mini card is the only nesting level
Flags and open items:  none (lib/flags.ts already exists)
Out of scope:          any real screen, mock data, or logic
Done when:             the gallery shows every component with every state, on web and on a phone; the banned-class search
                       finds nothing
```

### Stage 2: Pure logic and unit tests

```
Stage:                 2 - Pure logic and unit tests
Feature IDs:           SIM-01, SIM-02, SIM-04, SIM-06, SIM-07, SCN-02, COM-03
Screens and sections:  none (no UI imports)
Screenshots:           none
States to build:       none. Write the tests first, then the modules: billCalc, swap, fastForward, waterLevel, deeds,
                       energyPoints, avatarPlace, blocks, and the money formatter
Rules for this stage:  Feature_Requirements.md Appendix A (TNB tariff) and Appendix B (water levels); Workflow.md 3a;
                       frontend_Implementation.md section 6; test cases in frontend_test.md section 2;
                       tariff and AFA come from a config object, not constants in code;
                       water level = the higher of the MoM level and the volume level, MoM rounded to a whole percent first,
                       first bill uses volume only, RM does not decide;
                       first 3 deeds a day give points and the 4th gives 0 (day = Asia/Kuala_Lumpur);
                       energy points +50 once per billing month
Flags and open items:  AFA rate and the TNB values in a config object (TODO(open-item N) if a number is missing)
Out of scope:          any screen, any component, mock data
Done when:             npm test passes and lists the tests for each module; no module imports from react or react-native
```

### Stage 3: Mock data and mock services

```
Stage:                 3 - Mock data and mock services
Feature IDs:           supports all
Screens and sections:  none. A dev page /_dev/mock-data that lists the data
Screenshots:           none
States to build:       none. Mock data for: household (Mei Ling Tan, Petaling Jaya, 3 residents), rooms, appliances with stars,
                       day blocks, bills (Jun to Oct), October water 18 m3 and +48% vs September, all four water levels,
                       points, deeds, the Living Leaf in all three stages, ballot and results, notifications
Rules for this stage:  frontend_Implementation.md section 7; one single set of numbers; RM amounts come from billCalc;
                       mock services classifyWaste, confirmDisposal, readBill, analyzeBill, awardEnergyPoints each marked
                       // MOCK with a short delay; AI text may only use numbers from the mock data;
                       where the docs disagree on a number, keep the value UI_REQUIREMENT_PROMPT.md section 7 gives, add a
                       TODO, and list it in your report
Flags and open items:  COMMUNITY_MONTH_TARGET_PTS, HOUSEHOLD_MILESTONE_PTS, VOTE_CLOSES_AT, RESULT_AT, NEIGHBOURHOOD_NAME
Out of scope:          screens, Supabase, Gemini
Done when:             the dev page shows all the data; tests for the mock services pass; deeds and points change only
                       inside the mock services
```

### Stage 4: Login and Sign up

```
Stage:                 4 - Login and Sign up
Feature IDs:           AUTH-01
Screens and sections:  S1 Login, S2 Sign up (page_refined.md)
Screenshots:           screenshot/login/Login.png, Login_Error.png; screenshot/sign_up/Sign_up.png, Sign_up_filled.png,
                       sign_up_error.png
States to build:       Login: default, wrong password, loading, no internet (toast and retry).
                       Sign up: empty (disabled button), filled, field errors (state, city, email, password under 8
                       characters), email already used with a login link, loading
Rules for this stage:  Sign up is one page with the account and the address ("Where do you live?"); no header, no tab bar;
                       Log in and Sign up share one toggle; primary button color is design.md (not the olive variant)
Flags and open items:  ENABLE_GOOGLE_AUTH = false (the Google buttons are hidden unless true)
Out of scope:          real Auth, Google sign-in, the short address screen for new Google accounts
Done when:             both screens and every state open from the gallery and look like the screenshots in style;
                       "Create account" is disabled until the fields are valid
```

### Stage 5: Onboarding

```
Stage:                 5 - Onboarding
Feature IDs:           ONB-01, ONB-02, ONB-03
Screens and sections:  S3 Onboarding (page_refined.md), steps in screen_spec.md (not seen yet in screenshots)
Screenshots:           none
States to build:       3 steps with leaf-dot progress: Schedule, House layout (with residents), Appliances;
                       range errors (end before start, overlap); appliance details with 5 stars and "Not sure";
                       resume at the first step not done
Rules for this stage:  one question for each screen; Back and Next at the bottom; no header and no tab bar;
                       "Not sure" is saved as 3 stars; saves after each step (mock); frontend_Implementation.md section 3
                       says three steps, not four
Flags and open items:  none new
Out of scope:          the real save to Supabase, the Simulator floor plan
Done when:             all three steps and their errors open from the gallery; leaving and coming back resumes at the
                       first step that is not done (mock)
```

### Stage 6: Simulator A (top area, bill, floor plan view)

```
Stage:                 6 - Simulator A: top area, Bill modal, floor plan view
Feature IDs:           SIM-01, SIM-05 (view only)
Screens and sections:  S4.1 Top area, S4.2 Estimated bill modal, S4.3 floor plan (view only)
Screenshots:           screenshot/simulator/simulator_blank.png, simulator_bill_card.png, simulator_bill_card_blank.png,
                       simulator_appliances.png (view part)
States to build:       empty plan; plan with appliances; bill card values; "max bill" note before My day;
                       Bill modal filled and empty ("Add appliances" button); loading skeleton
Rules for this stage:  the Simulator is a fixed screen and does not scroll; nothing sits on top of the floor plan;
                       no title bar (bill card on the left, button stack on the right: bell, My day, fast-forward);
                       the bill comes from billCalc and counts up or down in 700 ms; the floor plan is drawn with
                       react-native-svg from room data (rectangles on a grid); sprites missing = a rounded tile with an icon
Flags and open items:  FLOOR_PLAN_STYLE = 'flat'; HIGH_USAGE_THRESHOLD_RM = null (badge hidden)
Out of scope:          Edit mode, suggestions, fast-forward, My day, avatar
Done when:             the Simulator opens with a house and a bill; tapping the bill card opens the modal; the empty states
                       show; the screen does not scroll
```

### Stage 7: Simulator B (Edit mode, suggestions, fast-forward)

```
Stage:                 7 - Simulator B: Edit mode, suggestion area, fast-forward
Feature IDs:           SIM-02, SIM-03, SIM-04, SIM-05
Screens and sections:  S4.3 Edit mode, S4.4 Suggestion area, S4.1 fast-forward button and panel
Screenshots:           screenshot/simulator/simulator_appliances.png, simulator_suggestion.png
States to build:       Edit mode tray (Appliances), drag onto a room, details sheet (type, brand, model, wattage, stars,
                       "Not sure", quantity, room); suggestion area: idle row, first time, Swap & Compare with Try and Undo,
                       Solar; fast-forward: closed, open (1M / 6M / 1Y), playing, stopped, reduced motion
Rules for this stage:  fast-forward button: first tap opens the selector, second tap plays, letting go of the slider does not
                       play, tap or drag during playback stops it, icons change (fast-forward, play, stop); the panel pushes
                       the floor plan down and never covers it; suggestion area shows one card at a time, no scrim;
                       Try swap lives in memory only; Solar at RM 500 or more, once for each session; savings come from
                       the fastForward module; the animation never changes the number
Flags and open items:  ENABLE_FURNITURE_TAB = false; ENABLE_LIGHTS_SWAP = false; SOLAR_SEE_HOW_ROUTE = null ("coming soon" toast)
Out of scope:          My day, avatar
Done when:             I can drag an appliance in, see its label, try a swap and undo it, and run the fast-forward with two taps
```

### Stage 8: Simulator C (My day, avatar, home looks)

```
Stage:                 8 - Simulator C: My day, avatar, home looks
Feature IDs:           SIM-06, SIM-07
Screens and sections:  S4.6 My day, avatar and home looks (frontend_Implementation.md section 11, row S4)
Screenshots:           screenshot/simulator/simulator_routine.png, simulator_add_routine.png, simulator_add_routine_error.png,
                       simulator_edit_routine.png
States to build:       Quick setup (4 cards: sleep, sleeping aircon, evening, showers, each with the bill change line, Skip /
                       Next / Done); timeline (Weekdays or Weekends, 24-hour strip, block list, away blocks locked);
                       Add block (valid, error); Edit Block; away-time note; avatar poses (stand, walk, sit, lie, cook,
                       shower); home looks (light on, light off, away "Energy saving", backdrop by time of day);
                       fast-forward animation (date pill, day and night, avatar plays one weekday)
Rules for this stage:  presence wins over My day; before any answer the bill is the max bill; blocks cannot overlap and overnight
                       is only for Sleep; the avatar position comes from avatarPlace and walks to the room of the active block;
                       appliances of that block light up; the avatar is only a picture and never changes the bill;
                       animation 4 s / 6 s / 8 s; reduced motion skips it; missing pictures = placeholders
Flags and open items:  ENABLE_EDIT_BLOCK_EXTRA_CONTROLS = false (no temperature, timer, fan speed, or cost preview)
Out of scope:          "Repeat on" and "Away" in Add block (Not in v1); the Simulator parts built in stages 6 and 7
Done when:             the user can answer Quick setup, edit the timeline, see the bill change, and watch the avatar go
                       to the room of the active block
```

### Stage 9: Bin

```
Stage:                 9 - Bin
Feature IDs:           BIN-01, BIN-02
Screens and sections:  S5.1 Bin home, S5.2 Scanner view, S5.3 Scan result
Screenshots:           screenshot/bin/Bin.png, Bin_Scan.png
States to build:       home; camera view (permission denied, scanning); result for each of the four bins; low confidence;
                       AI error; daily limit reached toast; "+10" toast
Rules for this stage:  four bins named Paper, Plastic, Glass & Metal, General waste, each with an icon and text;
                       +10 only for recyclable items, after "I threw it"; the first 3 deeds a day give points, the 4th gives 0;
                       the screen calls the mock confirmDisposal and never writes points; camera permission text in app.json
Flags and open items:  SHOW_CO2_CARD = false; the deed limit text comes from LEAF_DAILY_DEED_CAP; HOUSEHOLD_MILESTONE_PTS
Out of scope:          real camera classification (mock classifyWaste), the material composition bar, internal IDs in copy
Done when:             I can scan (mock), see each of the four results, tap "I threw it", and see "+10" and the points update
                       through the mock service
```

### Stage 10: Community

```
Stage:                 10 - Community
Feature IDs:           COM-01, COM-02, COM-03
Screens and sections:  S6.0 Community home, S6.1 Ballot sheet, S6.2 Result sheet, S6.3 Reward unlocked
Screenshots:           screenshot/Community/1__Community_Home_New_Letter.png, 2__Voting_Letter.png, 3__Voted_Waiting.png,
                       Group_2.png, 5__Community_Home_Hero_Leaf__Suggestions.png, 6__Reward_Unlocked.png
States to build:       home with letter waiting; voted and waiting; result ready; reward unlocked and not unlocked;
                       Living Leaf in all 3 stages; task cards To do and Done; Ballot sheet (nothing preselected); Result sheet
Rules for this stage:  one vote for each household each month; voting uses no points; Living Leaf: Dry 0, Healthy 1,
                       Lush 2 to 3 deeds, resets at midnight in Asia/Kuala_Lumpur; dial shows "deeds today / 3";
                       tasks: Recycle 1 item, Upload a lower bill, Simulator action (no points for the Simulator action)
Flags and open items:  LEAF_DAILY_DEED_CAP = 3; COMMUNITY_MONTH_TARGET_PTS and HOUSEHOLD_MILESTONE_PTS (mock examples);
                       VOTE_CLOSES_AT and RESULT_AT (mock dates); NEIGHBOURHOOD_NAME from mock data
Out of scope:          Claim reward, plaque name, certificate, kWh saved, committee signature
Done when:             I can step through every home state, vote, see the result, and see the three leaf stages
```

### Stage 11: Scanner

```
Stage:                 11 - Scanner
Feature IDs:           SCN-01, SCN-02, SCN-03, SCN-04
Screens and sections:  S7.1 Scanner home, S7.2 Check and correct, S7.3 Result, S7.4 Bill detail
Screenshots:           screenshot/Scanner/Scanner.png
States to build:       home; all four water levels; filter All / Electricity / Water; month tap detail; AI Analysis (loading,
                       loaded, error, first bill); check and correct (reading, cannot read, replace confirm); result;
                       Bill detail with delete confirm; archive list
Rules for this stage:  water level = the higher of the MoM level and the volume level (Appendix B): Normal (no alert), Minor drip
                       (one tip line), Leak detected (amber banner and a notification), Major pipe burst (terracotta top alert
                       and a notification); the demo (18 m3, +48%) gives Leak detected; the AI only explains the level;
                       AI text only uses numbers from the mock data; history comparison numbers are calculated, not written
                       by the AI; electricity data tan-400, water data sage-500
Flags and open items:  none new
Out of scope:          "Tariff Band A", "12% lower than similar homes", real OCR, real AI
Done when:             I can open each water level, see the AI Analysis in each state, and open and delete a bill
```

### Stage 12: Profile and Notifications

```
Stage:                 12 - Profile and Notifications
Feature IDs:           PRO-01, NOT-01
Screens and sections:  S8 Profile, S9 Notifications
Screenshots:           screenshot/profile/Profile.png
States to build:       Profile hero; Resident sheet (At home, Out); settings list; Log out confirm;
                       Notifications: grouped list, unread dot, mark all as read, empty
Rules for this stage:  Profile has NO row of summary numbers (money saved, total points, eco rating); the status pill lives
                       in the Resident sheet only; the profile picture is the avatar's face and opens the Resident sheet;
                       notification types: unusual water bill (Leak or Major only), voting is open, month result is ready;
                       in-app list only, no push messages
Flags and open items:  none new
Out of scope:          Account and Notification settings screens (not designed), push notifications
Done when:             the bell opens the list from any tab; Profile matches the screenshot without the summary row
```

### Stage 13: Test and cleanup

```
Do not use this template for this stage.
Paste frontend_test.md into the agent. After that, paste Implementation_Review.md (read-only review).
```
