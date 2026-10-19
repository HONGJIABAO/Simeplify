# Master Screen Specification: Simeplify / EcoTwin (Complete & Detailed Edition)

## 1. Global Architecture & Core Business Rules (Unified Baseline)

### 1.1 Application Overview
* **Product Name:** `Simeplify` / `EcoTwin`
* **Core Purpose:** Empower Malaysian households to build a 2D/2.5D digital twin of their home (`Simulator`), sort recyclable waste using Gemini AI vision (`Bin`), analyze monthly electricity (`TNB`) and water (`Air Selangor`) statements for anomalies/leaks (`Scanner`), participate in neighborhood-wide democratic sustainability rewards (`Community`), and manage household parameters (`Profile`).

### 1.2 Confirmed Global Design & Logic Decisions (Mandatory Alignment)
1. **Nested Cards Rule (`design.md` Exception — Relaxed):**
   * **Rule:** Nested cards (placing sub-cards `#F4F1EA` / `#FAF6F1` inside primary container cards `#FFFFFF` / `#F3E7D8`) are **officially permitted and standardized** across all modules (`Simulator`, `Bin`, `Scanner`, `Community`, and `Profile`) to preserve visual hierarchy and information density.
2. **Simulator Fast-Forward (`⏩`) Interaction:**
   * **Visual:** Retains the single circular dark charcoal button (`48px × 48px`, `#231F1E` fill) in the top-right HUD.
   * **Interaction State Machine:**
     * **1st Tap:** Expands/reveals a floating time-horizon selector slider (`1M` / `6M` / `1Y`).
     * **2nd Tap:** Executes the fast-forward simulation across the selected horizon and updates projected bills/usage.
3. **Community Governance & Point Accumulation Rule:**
   * **Grouping & Voting:** Grouped at the **Household** level within a residential neighborhood/sector (e.g., `Oakridge Commons • Sector 4B`, `240 households`). **Each household has exactly 1 voting right (`1 vote per household`)** per monthly cycle—no points are required to vote.
   * **Daily Tasks & Monthly Goal:** Each household can complete **1 to 3 energy-saving or waste-sorting tasks per day** (`Living Leaf` stages: `Dry (0)` $\rightarrow$ `Healthy (1)` $\rightarrow$ `Lush (2–3)`). Every completed task awards points that **accumulate toward the end-of-month neighborhood target** to unlock the democratically chosen community reward.
4. **Water Bill Anomaly & Leak Detection Matrix (`Scanner` — Air Selangor Standard):**
   * Evaluates a 3-person Malaysian household (Mei Ling Tan's Semi-D home; Malaysian average is $200\sim230\text{ L}$/person/day $\approx 6\sim7\text{ m}^3$/person/month; normal 3-person baseline is $18\sim21\text{ m}^3$/month):

| Severity Level | 1. MoM % Increase | 2. 3-Person Monthly Volume ($\text{m}^3$) | 3. Bill Amount (`RM` - Air Selangor*) | Physical Reality / Leak Scenario | UI Trigger Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Normal (正常波动)** | $\le +15\%$ (or $0\% \sim 19\%$) | $15 \sim 22\text{ m}^3$ | $\text{RM } 10 \sim \text{RM } 20$ | Hot weather extra showers, car washing, weekend laundry. | No alert banner; normal green/neutral chart state. |
| **Minor Drip (轻度异常/观察期)** | $+20\% \sim +29\%$ | $23 \sim 29\text{ m}^3$ | $\text{RM } 21 \sim \text{RM } 34$ | Loose tap / slow drip ($1\text{ drop/sec} \approx 1.5 \sim 3\text{ m}^3\text{/mo}$). | Display general water-saving tip; do not trigger severe leak banner. |
| **Leak Detected (高概率漏水)** | **$\ge +30\%$** *(UI Demo: **$+48\%$**)* | **$\ge 30\text{ m}^3$** *(or sudden jump to $18\text{ m}^3$ from low base)* | **$\ge \text{RM } 35$** | **Aging toilet cistern seal / silent outdoor pipe seepage** ($\sim 200\text{ L/day} \approx +6\text{ m}^3\text{/mo}$). **UI Demo uses `+48%`**, which far exceeds the $+30\%$ threshold. | **Trigger yellow `#FDF6E4` `ANOMALY DETECTED` banner** + red `↑ +48% anomaly` metric & cistern inspection tip. |
| **Major Pipe Burst (严重爆管)** | $\ge +100\%$ (Doubled) | Extreme spike | Extreme spike | Underground pipe rupture / stuck float valve (24h continuous flow). | Trigger highest-severity red alert advising main valve shutoff. |

   *\*Note on Air Selangor Domestic Tariff:* First $20\text{ m}^3$ at $\text{RM } 0.65/\text{m}^3$; $20 \sim 35\text{ m}^3$ at $\text{RM } 1.62/\text{m}^3$. A standard 3-person household rarely exceeds $\text{RM } 35\text{/month}$ unless a leak occurs.
5. **Profile KPI Row Removal (`Profile`):**
   * The 3-column KPI summary row (`Savings RM 420`, `Community 1,840 Eco Points`, `Eco Rating 5.0 ★`) previously placed below the Hero Identity Card is **officially canceled and removed** from the specification.

---

## 2. Global Design Tokens & Visual Language

### 2.1 Consolidated Color Palette

| Token | Hex / Value | Usage Across Modules |
| :--- | :--- | :--- |
| `bg-canvas-cream` | `#FAF6F1` / `#F7F4EF` | Primary screen background (`Auth`, `Bin`, `Scanner`, `Community`, `Profile`, and `Simulator` sheets/modals) |
| `bg-canvas-sage` | `#EAEDE6` / `#ECF0E8` | Main `Simulator` screen background (Soft Muted Sage Tint) |
| `surface-card-white` | `#FFFFFF` | Primary elevated section cards, text inputs, Google button, floor plan outer container |
| `surface-subcard` | `#F4F1EA` / `#EFECE6` | **Nested sub-cards**, segmented control tracks, secondary action buttons, recent scan rows, settings list container |
| `surface-card-warm` | `#F4E9DA` / `#F3E7D8` | Highlighted winning choice card, turnout box, reward claim container (`Community`), suggestion container `#F4E5D4` (`Simulator`) |
| `surface-pill-sage` | `#D6E5C8` / `#DFEAD5` | Active bottom nav tab pill, active segmented tab, `+10 pts` badge, `AI Confirmed` pill, selected room/day pills |
| `accent-sage-primary` | `#7E916C` / `#839470` | Primary CTA on modals, sheets & rewards (`Save schedule`, `Apply changes`, `Try`, `Submit vote`, `Got it`, `Claim reward`) |
| `accent-olive-dark` | `#4A5D3B` / `#526544` | Active toggle switches, `I threw it (+10 pts)` CTA, `Save` button, progress bar fill, checkmarks (`✓`), `Edit`/`Done` text |
| `accent-brown-deep` | `#422A1D` / `#5C4033` | `Open AI Scanner` CTA, `Glass & Metals` icon circle & badge, floor plan structural walls (`#60493E` / `#5C4033`) |
| `accent-charcoal` | `#231F1E` / `#1E1B18` | Primary dark CTA (`Log in`, `Create account`, `Open letter`, `Take photo`) & Fast-Forward (`⏩`) floating button |
| `accent-peach-soft` | `#FADDC3` / `#F7D9BC` | `Paper & Cardboard` icon circle, `+10 pts` warm badge, barrier seal bar |
| `accent-tan-wood` | `#D4A373` / `#D49B6A` | Living room wood floor, AC breakdown bar, `High Usage` badge fill, Electricity (`TNB`) bar chart color |
| `chart-bar-water` | `#697D58` | Water (`Air Selangor`) bar chart color |
| `surface-warning-amber` | `#FDF6E4` / `#FBF4DF` | `ANOMALY DETECTED` alert card background (`Scanner`), Away-mode notice banner (`Simulator`) |
| `text-warning-amber` | `#8F5B14` / `#9A6316` | `ANOMALY DETECTED` body copy & warning triangle icon |
| `surface-error-soft` | `#FDECEB` / `#FADCD9` | Error input field fill (`Auth`, `Simulator`), validation banner, schedule overlap alert |
| `status-error-red` | `#B91C1C` / `#C92A2A` | Error icons (`!`, `⚠️`), `RM 420` peak month label, `↑ +48% anomaly`, `Remove time block` destructive action |
| `btn-disabled` | `#E3DFD9` / `#DCD9D2` | Disabled Primary CTA fill (`Sign up`, `Locked Save`) |
| `text-primary` | `#1E1B18` / `#2A2421` | Serif headings, active input values, hero metrics (`RM 233`, `340 pts`, `RM 420`), list titles |
| `text-secondary` | `#57534E` / `#6E665E` | Subtitles, helper text, timestamps, wattage labels (`1200 W`), kWh subtitles |
| `text-placeholder` | `#8C857B` | Input placeholders (`you@example.com`), disabled/muted stage text, footer disclaimers |
| `border-subtle` | `#E6E1DA` / `#E2DDD5` | Card borders (`1px` solid) and horizontal section dividers |

### 2.2 Typography System

* **Display & Headings (Serif — e.g., *Lora* / *Playfair Display* / *Merriweather*):**
  * **Hero Figures (`RM 0`, `RM 233`, `340 pts`, `RM 420`):** `36px–44px`, Bold (`700`), `#1E1B18`.
  * **Screen / Modal Titles (`Welcome`, `My day`, `Add to My Day`, `Material Breakdown`, `Bill Analyzer`, `This month's vote`, `Reward unlocked`):** `26px–32px`, Bold (`700`), line-height `1.2`.
  * **Section / Card Headings (`Your account`, `Where do you live?`, `Scan Your Waste`, `Living Leaf is Thriving`):** `20px–24px`, Semi-Bold/Bold (`600`/`700`).
  * **Sub-Card Titles (`Plant a tree in our community`, `Recycle 1 item`, `Where?`, `When?`):** `17px–19px`, Semi-Bold/Bold.
* **UI Controls & Body Copy (Sans-serif — e.g., *Plus Jakarta Sans* / *Source Sans 3* / *Inter*):**
  * **Overline Labels (`ESTIMATED BILL`, `HOUSEHOLD ECO PROGRESS`, `ANOMALY DETECTED`, `MONTHLY DECISION`):** `11px–12px`, Semi-Bold (`600`), Uppercase, letter-spacing `0.06em`, `#6E665E`.
  * **Primary Buttons & Input Text:** `15px–16px`, Regular (`400`) for inputs, Semi-Bold (`600`) for buttons and list titles.
  * **Body Descriptions & Subtitles:** `13px–15px`, Regular (`400`), line-height `1.45–1.5`, `#57534E`.
  * **Pills, Badges & Helper Text:** `12px–13px`, Medium/Semi-Bold (`500`/`600`).

### 2.3 Global Layout, Spacing & Navigation
* **Screen Padding:** `24px` horizontal padding on forms (`Auth`); `16px–20px` on dashboard modules.
* **Corner Radii:**
  * Primary Elevated Cards & Modals: `24px–32px` radius.
  * Nested Sub-Cards (`surface-subcard`): `16px–20px` radius.
  * Inputs, Primary CTAs & Segmented Toggles: Pill-shaped (`9999px`).
* **Bottom Navigation Bar (Shared across `Simulator`, `Bin`, `Community`, `Scanner`, `Profile`):**
  * Floating pill container (`9999px` radius), `#F7F4EF` fill, `1px` border `#E2DDD5`, height `68px`.
  * **5 Tabs:**
    1. `Simulator`: House outline icon + label.
    2. `Bin`: Recycling trefoil / bin icon + label.
    3. `Community`: Potted plant / people icon + label (supports top-right green notification dot).
    4. `Scanner`: Viewfinder / receipt icon + label.
    5. `Profile`: User avatar outline icon + label.
  * *Active Tab State:* Wrapped inside a soft sage green pill (`#D6E5C8`) with `#1E1B18` / `#4A5D3B` icon and bold label.

---

## 3. Module 1: Authentication (`Log in` & `Sign up`)

### 3.1 Screens Included
1. `Login.png` — Log in (Default / Empty & Masked Input State)
2. `Login_Error.png` — Log in (Invalid Credentials Error State)
3. `Sign_up.png` — Sign up (Default / Empty State)
4. `Sign_up_filled.png` — Sign up (Completed / Ready to Submit State)
5. `sign_up_error.png` — Sign up (Required Field Validation Error State)

### 3.2 Shared Header Components (All 5 Auth Screens)
1. **Brand Eco Illustration (Top Center):**
   * Circular/organic overlapping pastel shapes (`72px × 72px` to `96px × 96px`) in soft peach (`#F9E0D6`) and sage green (`#DFEAD5`).
   * Centered sprouting plant/leaf icon in warm brown (`#5C4033`) and sage green (`#566549`).
2. **Header Title & Subtitle:**
   * **Title (`H1`):** `Welcome` (`32px` Serif Bold, center-aligned).
   * **Subtitle:** `Save energy, sort waste, grow your community.` (`15px–16px` Sans Regular, `#57534E`).
3. **Segmented Mode Switcher (`Log in` | `Sign up`):**
   * 2-column equal-width pill toggle (`#EBE7E0` track, `9999px` radius, `4px` internal padding).
   * Active tab uses `#D6E5C8` sage pill (or `#FFFFFF` in `Login_Error.png`). Tapping switches between Login and Registration views without page reload.

### 3.3 Screen 1 & 2: Log In (`Login.png` & `Login_Error.png`)
* **Section Heading (`H2`):** `Your account` (`22px` Serif Semi-Bold).
* **Form Fields (`54px–56px` height, `9999px` pill radius):**
  1. **Email Field:**
     * Label: `Email` (`14px` Semi-Bold).
     * Default (`Login.png`): `#FFFFFF` fill, placeholder `you@example.com` (`#8C857B`).
     * Validated (`Login_Error.png`): Populated with user email + right-aligned green checkmark `✓` (`#4A5D3B`).
  2. **Password Field:**
     * Label: `Password` (`14px` Semi-Bold) + right-aligned `Forgot password?` link.
     * Default (`Login.png`): `#FFFFFF` fill, masked dots `••••••••` + right eye toggle icon.
     * Error State (`Login_Error.png`): Soft red fill `#FDECEB`, red exclamation icon `!` (`#B91C1C`), helper error text below: `Incorrect password. Please try again.` (`12px–13px`, `#B91C1C`).
* **Actions:**
  * **Primary CTA:** Full-width pill button (`54px–56px` height), `Log in` (`#231F1E` in `Login.png`, `#3A4928` olive variant in `Login_Error.png`, white text).
  * **Divider:** Horizontal line with centered `or` (`#57534E`).
  * **Social OAuth Button:** Full-width pill button (`#FFFFFF` fill, `1px` border `#E2DDD5`), Google `G` logo + `Continue with Google`.

### 3.4 Screen 3, 4 & 5: Sign Up (`Sign_up.png`, `Sign_up_filled.png`, `sign_up_error.png`)
* **Section 1: `Your account`**
  * **Email Field:** Pill input (`you@example.com` empty; `meiling.tan@email.com` + green `✓` in filled/error states).
  * **Password Field:** Pill input (`At least 8 characters` placeholder; masked dots in filled/error states).
* **Section 2: `Where do you live?` (Malaysian Location & Tariff Binding)**
  * **Header:** Leaf icon (`#4A5D3B`) + `Where do you live?` (`22px` Serif Semi-Bold).
  * **Subtitle:** `Used to set your local electricity tariff and connect you with your neighborhood.`
  * **Auto-Locate Button:** Secondary pill button (`48px` height, `#EFECE6` fill): `📍 Use my location`.
  * **Location Fields:**
    1. **`State` (Dropdown Pill):**
       * Empty (`Sign_up.png`): `Select state` + chevron `▾`.
       * Filled (`Sign_up_filled.png`): `Selangor`.
       * Error (`sign_up_error.png`): Soft red fill `#FCE8E6`, red icon `!`, helper text `Please select your state` (`#B91C1C`).
    2. **`City or area` (Text Input Pill):**
       * Empty: `e.g. Petaling Jaya`.
       * Filled: `Petaling Jaya`.
       * Error (`sign_up_error.png`): Soft red fill `#FCE8E6`, red icon `!`, helper text `Please enter your city or area` (`#B91C1C`).
    3. **`Street address` (Text Input Pill):**
       * Empty: `House number and street name`.
       * Filled: `18, Jalan SS 2/6`.
* **Submit CTA (`Create account`):**
  * **Disabled State (`Sign_up.png` & `sign_up_error.png`):** `#E3DFD9` fill, `#7A756E` text (`Create account`).
  * **Active State (`Sign_up_filled.png`):** `#231F1E` dark charcoal fill, `#FFFFFF` text (`Create account`).

---

## 4. Module 2: Home Energy Simulator (`Simulator`)

### 4.1 Screens Included
1. `simulator_blank.png` — Main Simulator View (Default Empty Floor Plan State)
2. `simulator_appliances.png` — Floor Plan Edit Mode (Appliances & Furniture Drawer Open)
3. `simulator_suggestion.png` — Energy Optimization Suggestions View
4. `simulator_routine.png` — `My day` Daily Schedule Bottom Sheet (View-Only Expanded Activity)
5. `simulator_add_routine.png` — `Add to My Day` Bottom Sheet (Valid / Ready to Save State)
6. `simulator_add_routine_error.png` — `Add to My Day` Bottom Sheet (Validation & Schedule Overlap Error State)
7. `simulator_edit_routine.png` — `Edit Block` Bottom Sheet (Granular Appliance Parameter Tuning)
8. `simulator_bill_card.png` — `Estimated monthly bill` Modal (Populated Breakdown by Appliance)
9. `simulator_bill_card_blank.png` — `Estimated monthly bill` Modal (Empty State)

### 4.2 Base Screen Architecture (`simulator_blank.png`)
* **Canvas Background:** Soft Muted Sage Tint (`#EAEDE6` / `#ECF0E8`).

#### A. Top HUD (Heads-Up Display)
1. **Estimated Bill Summary Card (Top-Left):**
   * **Container:** Rounded rectangle (`24px` radius), `#F7F4EF` fill, `1px` border `#E2DDD5`, soft drop shadow.
   * **Header Row:** Gauge icon + `ESTIMATED BILL` uppercase overline on left; `High Usage` pill badge (`#EED4B5` fill, `#5C4033` text) on right.
   * **Main Value:** `RM 0` (or `RM 233` when populated, `36px` Serif Bold) + `/ mo` (`15px` Sans Regular).
   * **Divider:** `1px` solid `#E6E1DA`.
   * **Footer Row:** Clock icon + `Today • 18:30`.
   * **Interaction:** Tapping opens **Estimated Monthly Bill Modal** (`simulator_bill_card_blank.png` or `simulator_bill_card.png`).
2. **Floating Utility Stack (Top-Right):**
   * **Notification Bell Button:** Pill container (`76px × 44px`), `#F7F4EF` fill, bell outline icon with top-right bronze unread dot (`#A47551`).
   * **Routine (`My day`) Button:** Circular button (`48px × 48px`), `#F7F4EF` fill, calendar-check outline icon. Tapping opens `simulator_routine.png`.
   * **Fast-Forward Simulation Button (`⏩` — Updated 2-Tap Interaction):**
     * **Visual:** Circular button (`48px × 48px`), dark charcoal `#231F1E` fill, white double-arrow fast-forward (`⏩`) icon.
     * **1st Tap (Expand Slider):** Reveals a compact floating time-horizon slider pill (`1M` / `6M` / `1Y`) anchored next to/below the button. User can slide or tap to choose 1 Month, 6 Months, or 1 Year.
     * **2nd Tap (Execute Fast-Forward):** Confirms and triggers the time-jump simulation for the selected duration, animating the floor plan state and recalculating cumulative bill/energy projections.

#### B. Interactive Floor Plan Canvas (Center)
1. **Section Action Header:** Right-aligned text button above canvas: `Edit` (`16px` Semi-Bold, `#4A5D3B`). Toggles to `Done` in Edit Mode.
2. **Floor Plan Card Container:**
   * White rounded square container (`32px` radius, `16px` padding).
   * **4-Zone Architectural Grid (`#5C4033` structural walls, `3px–4px` rounded stroke):**
     * **Top-Left (`Living room`):** Warm light wood plank texture (`#E6C08E`), white floating pill label `● Living room`.
     * **Top-Right (`Kitchen`):** Warm cream tile surface (`#EFEAD8`), white floating pill label `● Kitchen`.
     * **Bottom-Left (`Bedroom`):** Soft sage green carpet/floor (`#B6C4A6`), white floating pill label `● Bedroom`.
     * **Bottom-Right (`Bathroom`):** Warm grey tile surface (`#D6D3CD`), white floating pill label `● Bathroom`.
   * **Empty State Floating Toast (Bottom of Floor Plan):**
     * White pill banner with hand/drag icon (`✋`):
     * View Mode (`simulator_blank.png`): `Nothing here yet. Press edit to add appliances` *(production fix: "ro" $\rightarrow$ "to")*.
     * Edit Mode (`simulator_appliances.png`): `Nothing here yet. Drag an appliance from below.`

### 4.3 Floor Plan Edit Mode (`simulator_appliances.png`)
* **Trigger:** User taps `Edit` on `simulator_blank.png` (or `Add appliances` in empty bill modal).
* **Bottom Tray Drawer:** Slides up above the bottom navigation bar (`28px` top corner radius, `#FAF6F1` background, top drag handle pill).
* **Category Segmented Toggle:** Pill track (`#E4E0D8`) with two tabs: `Appliances` (active white pill `#FFFFFF`) and `Furniture`.
* **Draggable Item Grid (4 Columns of Nested Cards):**
  * Each item sits in a rounded square sub-card (`72px × 72px`, `#F2EFE9` fill, `18px` radius) with a 2D warm-line flat illustration and a `13px` label underneath:
    1. `Air cond.` (Split AC unit)
    2. `Fridge` (2-door sage green refrigerator)
    3. `Lights` (Table lamp with warm wood base)
    4. `TV` (Flat screen monitor/TV)
* **Interaction:** Drag items onto any room in the 4-zone floor plan, then tap `Done`.

### 4.4 Energy Optimization Suggestions (`simulator_suggestion.png`)
* **Placement:** Appears below the floor plan canvas.
* **Outer Container Card:** Rounded card (`28px` radius), warm peach-tan fill `#F4E5D4`, `1px` border `#E2C9AE`, `20px` padding.
* **Title:** `Energy Optimization Suggestions` (`17px` Serif Bold, `#1E1B18`).
* **3-Column Horizontal Nested Card Grid (Permitted under Relaxed Nested Card Rule):**
  * Each nested card has `#FAF6F1` fill, `18px` radius, centered icon in a `#EFE4D6` squircle (`48px × 48px`), bold title, and a full-width sage green pill CTA `Try` (`#839470` fill, `#1E1B18` text):
    1. **Card 1:** AC icon | `5★ Inverter AC` | `Try`
    2. **Card 2:** Fridge icon | `5★ Eco Fridge` | `Try`
    3. **Card 3:** Lightbulb icon | `Full Home LED` | `Try`
* **Interaction:** Tapping `Try` swaps the appliance on the floor plan with the 5-star upgrade and recalculates `ESTIMATED BILL` in real time.

### 4.5 Daily Schedule Sheet — `My day` (`simulator_routine.png`)
* **Trigger:** Tapping the Calendar/Routine button in the top-right HUD.
* **Modal Container:** Full-height bottom sheet (`28px` top corners, `#FAF6F1` fill) over a dimmed backdrop showing `FORECAST BILL RM 248 / RM 348 est.`.
* **Header:** Top drag handle bar; Left: `My day` (`28px` Serif Bold); Right: Circular close button `✕` (`#EDE9E1`).
* **Day-of-Week Selector:** 7 rounded squircle buttons (`Mon`–`Sun`). Active day (`Mon`): Sage green fill `#D6E5C8` with orange dot indicator underneath. Inactive days: `#EFECE6` fill.
* **24-Hour Timeline Bar:** Horizontal multi-segment progress bar showing color-coded activity blocks across `00:00`, `06:00`, `12:00`, `18:00`, `24:00`.
* **Time Block Activity Cards (Read-Only Tap-to-Expand Pattern with Nested Cards):**
  1. `00:00 – 06:30 · Sleep` (Moon icon, `Bedroom`, `Bedroom AC at 25°C, ceiling fan gentle`)
  2. `06:30 – 07:15 · Morning Shower` (Showerhead icon, `Bathroom`, `Storage water heater (15-min eco timer)`, soft green card tint `#EEF3EA`)
  3. `07:15 – 08:30 · Breakfast & Prep` (Cutlery icon, `Kitchen`, `Kitchen induction burner, kettle, warm pendant lighting`, soft peach card tint `#F9EFE8`)
  4. `08:30 – 17:30 · Away (Office)` (Lock icon, grey card tint `#EAE7E1`, plus nested yellow info banner `#FBF4DF`: `ⓘ You are marked away at this time. Manual appliance consumption will not be counted.`)
  5. `20:00 – 23:00 · Evening Routine` (**Expanded Read-Only State**):
     * White card container (`#FFFFFF`), Bed icon (`#8B9D77`), `Bedroom` pill, `3 active appliances`, and `⋮` menu icon.
     * Subheader: `ROOM APPLIANCES IN USE`.
     * **Read-Only Appliance List:**
       * `Panasonic Air Conditioner` | `20:00-23:00` | `1200 W`
       * `KDK Table Fan` | `20:00-23:00` | `35 W`
       * `MUJI Bedside Lamp` | `20:00-23:00` | `10 W`
* **Sheet Footer Actions:**
  * Secondary full-width pill: `⊕ Add time block` (`#EDE9E1` fill) $\rightarrow$ opens `simulator_add_routine.png`.
  * Primary full-width pill: `Save schedule` (`#839470` sage green fill).

### 4.6 Add Routine Sheet — `Add to My Day` (`simulator_add_routine.png` & `simulator_add_routine_error.png`)

#### A. Valid / Ready State (`simulator_add_routine.png`)
1. **Header:** `Add to My Day` + Close `✕` button.
2. **Routine Name Section:** Label `ROUTINE NAME`; Input Pill (`#FFFFFF`) with TV icon + `Watching TV` + clear `⊗`; Quick-select pills: `Watching TV` (selected `#D6E5C8`), `Working`, `Studying`, `Cooking`.
3. **`Where?` (Room Selection Grid):** 2-col × 3-row pill grid (`Living room` selected `#D6E5C8`, `Kitchen`, `Bedroom 1`, `Bedroom 2`, `Bathroom`, `Away`).
4. **`When?` (Time Range Picker):** 2 equal-width white nested cards (`STARTS` `🕒 20:00` | `ENDS` `🕒 23:00`).
5. **`Appliances on during this` (Interactive Toggle List):**
   * White container card with right-aligned green toggle switches (`#566549` ON, `#E6E2DC` OFF):
     * `Samsung TV` (`90 W · Living room`) — **ON**
     * `Philips LED Lights` (`18 W · Warm ambient`) — **ON**
     * `Panasonic Air Conditioner` (`1200 W · Eco mode ready`) — **OFF**
     * `Table Fan` (`55 W · Standby`) — **OFF**
6. **Sticky Footer Bar:** `Cancel` pill (`#EDE9E1`) + `Save` pill (`#4F6041` dark olive, white text).

#### B. Validation & Conflict Error State (`simulator_add_routine_error.png`)
* **Top Error Summary Banner (`#FADCD9` fill, `#B91C1C` text):** `❗ Please resolve 2 issues to continue — Missing required title and a scheduling overlap.`
* **Error 1 — Missing Routine Name:** Label `ROUTINE NAME *` + right-aligned `Required` (`#B91C1C`). Input box turns `#FADCD9` with `❗` and helper text `ⓘ Enter a title.`.
* **Error 2 — Time Conflict (`When?`):** Right-aligned `Time conflict` (`#B91C1C`). `Starts` (`19:15`) and `Ends` (`20:30`) cards turn `#FADCD9`. Overlap Banner below: `⚠️ Schedule Overlap — This overlaps with Dinner (19:00 – 19:30) on Mon.`
* **`Repeat on` Section:** Day circles (`Mon`, `Tue`, `Wed` selected in green; `Thu`–`Sun` unselected). Preset pills: `✓ Weekdays` (selected), `Weekends`, `Every day`. Away Conflict Banner (`#F8E2D0`): `ⓘ You are away at this time on Mon and Tue. It will not be counted on those days.`
* **Disabled Footer CTA:** `🔒 Save` (`#DCD9D2` fill, `#7A756E` text).

### 4.7 Edit Routine Block Sheet — `Edit Block` (`simulator_edit_routine.png`)
* **Trigger:** Tapping `⋮` on an existing routine card in `My day`.
* **Routine Summary Card:** Displays `ROUTINE NAME` (`Sunday Movie & Leisure`) and `Living Room` badge.
* **Time & Location Pickers:** `STARTS 20:00` / `ENDS 23:00` + `Where?` 2×3 room grid (`Living room` selected).
* **Granular Appliance Parameter Controls (`ROOM APPLIANCES IN USE — 4 Active · 1 Standby`):**
  * Active appliance cards contain nested parameter controls:
    1. **`Living Room Inverter AC` (`Eco Inverter Mode · ~0.80 kWh` — ON):**
       * `Temperature` stepper row: `[-]` `23°C` `[+]`
       * `Timer` stepper row: `[-]` `1h` `[+]`
    2. **`4K TV & Soundbar System` (`Cinema Preset · ~0.15 kWh` — ON)**
    3. **`Ceiling Fan` (`Circulation · ~0.04 kWh` — ON):**
       * `Fan Speed` segmented control: `Low` (selected white pill) | `Med` | `High`
    4. **`Ambient Warm Accent Light` (`Warm LED Strip (40% dim) · ~0.01 kWh` — ON)**
* **Live Block Cost Preview Card (`#EFF3EC` fill, `#CBD8C3` border):** Left: `Est. cost` `RM 1.45` (`22px` Serif Bold). Right white pill badge: `↘ RM 0.35 less than standard`.
* **Footer Actions:** Row 1: `Cancel` (`#EDE9E1`) + `Apply changes` (`#839470`). Row 2: Centered red text button `🗑️ Remove time block` (`#B91C1C`).

### 4.8 Estimated Monthly Bill Modal (`simulator_bill_card.png` & `simulator_bill_card_blank.png`)
* **Trigger:** Tapping top-left `ESTIMATED BILL` card.
* **Container:** Centered modal card (`28px` radius, `#FAF6F1` fill, `24px` padding).
* **Populated State (`simulator_bill_card.png`):**
  * Primary Metric: `RM 233` (`44px` Serif Bold) + `525 kWh a month`.
  * Stacked Proportional Bar (`14px` height): Warm Tan (`#D4A373` — 54%), Sage Green (`#839470` — 20%), Dark Brown (`#5C4033` — 19%), Soft Olive (`#B6C4A6` — 3%), Light Peach (`#E6C08E` — 2%).
  * `By appliance` Breakdown List:
    1. `Panasonic Air Conditioner` (`Bedroom 1`) — **`RM 127`** (`54%`)
    2. `Water heater` (`Bathroom`) — **`RM 47`** (`20%`)
    3. `Inverter Fridge` (`Kitchen`) — **`RM 44`** (`19%`)
    4. `Table Fan` (`Bedroom 1`) — **`RM 6`** (`3%`)
    5. `Philips LED Lights` (`Living room`) — **`RM 5`** (`2%`)
* **Empty State (`simulator_bill_card_blank.png`):**
  * Displays `RM 0`, `0 kWh a month`, greyed-out bar (`#E6E3DD`), `No appliances yet`, and `Add appliances` CTA pill (`#839470`).

---

## 5. Module 3: Waste Bin, Bill Scanner & User Profile

### 5.1 Screen 1: Waste Sorting Hub (`Bin.png`)
* **Top Utility Header:** Right-aligned floating notification bell pill button (`76px × 44px`, `#F4F1EA` fill, `1px` border `#E2DDD5`, bronze unread dot `#A47551`).
* **Card 1: Household Eco Progress (`#FFFFFF`, `28px` radius, `20px` padding):**
  * **Top Row:** Left overline `HOUSEHOLD ECO PROGRESS`, hero metric `340` (`40px` Serif Bold) + `pts` (`18px`), subtitle `+10 pts per cleanly sorted item`. Right: Circular eco-recycle badge (`48px × 48px`, `#D6E5C8` fill, `#4A5D3B` icon).
  * **Milestone Progress Bar:** Left: `Community Tree Milestone` (`14px` Semi-Bold). Right: `340 / 500 pts` (`13px` `#4A5D3B`). Track: `8px` height, `#EAE7E1` track, `#4A5D3B` fill (`68%`). Helper text below: `160 pts until next sapling planted`.
  * **Impact Summary Nested Sub-Cards (2-Column Grid, `#F4F1EA` fill — Relaxed Nested Card Rule):**
    1. **Left Nested Card:** Leaf icon in green circle (`#D6E5C8`) | **`34 Items`** (`14px` Bold) | `Diverted total` (`12px` `#57534E`).
    2. **Right Nested Card:** `CO2` badge in green circle (`#D6E5C8`) | **`3.4 kg`** (`14px` Bold) | `$\text{CO}_2$ prevented` (`12px` `#57534E`).
* **Card 2: Scan Your Waste (AI Camera Entry — `#FFFFFF`, `28px` radius, `24px` padding):**
  * Centered circular green badge (`64px × 64px`, `#D6E5C8`) with camera outline icon, Title `Scan Your Waste` (`22px` Serif Bold), Description: `Snap a photo of packaging, containers, or leftovers. Gemini AI instantly identifies the right bin.`
  * **Primary CTA:** Full-width pill (`52px` height, `#422A1D` deep brown fill, white text): `[📷] Open AI Scanner` $\rightarrow$ `Bin_Scan.png`.
  * **Secondary CTA:** Full-width pill (`48px` height, `#F4F1EA` fill, `#1E1B18` text): `[↑] Upload photo from gallery`.
* **Section: Sorting Bins Guide:**
  * Header: `Sorting Bins Guide` (`20px` Serif Bold) + `Standard 4-Stream` pill (`#D6E5C8`).
  * **4 Stream Cards (Vertical Stack, `12px` gap):**
    1. `Paper & Cardboard`: Soft peach circle (`#FADDC3`) | `+10 pts` (`#FADDC3` fill, `#5C4033` text) | `Clean cardboard, envelopes, egg cartons, unlined papers.`
    2. `Plastic Packaging`: Soft sage circle (`#D6E5C8`) | `+10 pts` (`#D6E5C8` fill, `#4A5D3B` text) | `Bottles, clean jugs, rinsed shampoo containers, rigid tubs.`
    3. `Glass & Metals`: Dark brown circle (`#5C4033`, white icon) | `+10 pts` (`#5C4033` fill, white text) | `Clean tins, glass jars, metal lids, beverage cans.`
    4. `General Waste & Scraps`: Dark olive circle (`#4A5D3B`, white icon) | `0 pts` (`#E6E2DC` fill, `#57534E` text) | `Organic food scraps, soiled wrappings, non-recyclable items.`
* **Card 3: Recent Scans (`#FFFFFF`, `28px` radius, `20px` padding):**
  * Header: `Recent Scans` + `View All` (`#4A5D3B`).
  * **4 Nested History Rows (`#F4F1EA` containers, `12px` radius):**
    1. `Oat Milk Carton` | `Paper Bin • Today, 11:30 AM` | `+10 pts`
    2. `Glass Olive Jar` | `Glass & Metal • Yesterday` | `+10 pts`
    3. `Banana Peel` | `General Waste • Yesterday` | `0 pts`
    4. `PET Water Bottle` | `Plastic Bin • 2 days ago` | `+10 pts`

### 5.2 Screen 2: AI Waste Scan Result (`Bin_Scan.png`)
* **Top Header:** Back arrow `←` + `Material Breakdown` (`24px` Serif Bold) + Notification bell pill.
* **Camera Viewport & AR Overlay (Top Half):**
  * Rounded image container (`28px` radius) showing captured oat milk carton.
  * Floating status pill (`#FFFFFF`): `● Scan complete`.
  * Center AR Reticle: Corner brackets `[ ]`, focus target, AR tags (`Material: Paper Carton`, `Status: Clean & Recyclable`).
  * Bottom Floating Label (`#FFFFFF`): `Plant-based Beverage Carton`.
* **Material Breakdown Bottom Sheet (`#FFFFFF`, `32px` top radius, `24px` padding):**
  * **Confidence Row:** Left pill (`#D6E5C8`): `🍃 AI Confirmed · 98% match`. Right: `Unit 12.3 · BIN-01`.
  * **Target Bin Highlight Nested Card (`#F4F1EA`, `20px` radius):** Peach badge (`56px × 56px`, `#FADDC3`) + `Paper & Carton Bin` (`22px` Serif Bold) + `⊕ Recyclable Item (+10 Points)` (`#D6E5C8`).
  * **Mindful Separation Advice Nested Card (`#F4F1EA`, `20px` radius):**
    * Header: Water droplet icon + `Mindful Separation Advice` (`15px` Semi-Bold, `#4A5D3B`).
    * Body: `Rinse cleanly with cold water and flatten to save bin capacity. Unscrew the plastic cap and place separately into the Plastics Bin (BIN-02).`
    * **Material Stacked Bar (`8px` height):** `85% FSC Pulp Board` (`#4A5D3B`) + `15% Barrier Seal` (`#E6B383`).
  * **Footer Actions:**
    1. Primary CTA (`54px` height, `#4A5D3B` fill, white text): `✓ I threw it (+10 pts)` $\rightarrow$ awards `+10 pts` (counts toward daily Community task & monthly household score) and returns to `Bin.png`.
    2. Secondary CTA (`48px` height, `#FFFFFF` fill, `1px` border `#EFECE6`): `📷 Retake photo`.
    3. Tertiary Link: `Incorrect bin? Suggest correction`.

### 5.3 Screen 3: Utility Bill Analyzer (`Scanner.png`)
* **Header Section:** Notification bell pill; Title `Bill Analyzer` (`28px` Serif Bold); Subtitle `Track monthly utility trends, detect leaks, and get AI tips.`.
* **Card 1: Upload Utility Bill (`#F4F1EA` fill, `24px` radius, `24px` padding):**
  * Icon (`52px × 52px`, `#EAE5DC`), Title `Upload utility bill`, Subtitle `Supports TNB electric bills, Air Selangor water statements (PDF or Photo)`.
  * **Dual Button Row:** Left: `📷 Take photo` (`#231F1E` fill, white text). Right: `📄 Upload PDF` (`#FFFFFF` fill, `#1E1B18` text).
* **Alert Banner: Anomaly Detected (Governed by Air Selangor $\ge +30\%$ Leak Rule):**
  * **Trigger Logic:** Mei Ling's October water usage jumped **+48% MoM** (exceeding the $\ge +30\%$ High-Probability Leak threshold).
  * **Container:** Rounded card (`20px` radius, `#FDF6E4` warm amber fill, `1px` border `#F5E4B8`, `16px` padding).
  * **Left Icon:** Circular badge (`40px × 40px`, `#F5E6C4`) with amber warning triangle `⚠️`.
  * **Header Row:** Left: `ANOMALY DETECTED` (`12px` Bold Uppercase, `#8F5B14`). Right: `Oct Statement` (`12px` `#8F5B14`).
  * **Body Copy:** `Water bill up 48% vs September. Check for potential toilet cistern leak or outdoor hose drip.` (`14px` `#8F5B14`).
* **Card 2: Monthly Usage Chart (`#FFFFFF`, `28px` radius, `20px` padding):**
  * **Header Row:** Left: `Monthly Usage` (`20px` Serif Bold) + `Past 5 billing cycles`. Right segmented filter (`#F4F1EA` track): `All` (active `#D6E5C8`), `Electricity`, `Water`.
  * **5-Month Grouped Bar Chart (`Jun` – `Oct`):**
    * Top Spend Labels: `Jun`: `RM 310` | `Jul`: `RM 325` | `Aug`: `RM 350` | `Sep`: `RM 380` | `Oct`: **`RM 420`** (Bold red `#B91C1C` with red spike indicator `▲` above the water bar).
    * Bars: Left bar in warm tan (`#D49B6A` for `Electricity (TNB)`), Right bar in olive green (`#697D58` for `Water (Air Selangor)`).
  * **Benchmark Nested Callout Box (`#F4F1EA` fill, `16px` radius):** Green circle `↘` + `Usage is 12% lower than similar 3-bedroom terrace homes in your district.`
* **Card 3: AI Analysis & Actionable Tips (`#FFFFFF`, `28px` radius, `20px` padding):**
  * **Header Row:** Green sprout circle + `AI Analysis` (`20px` Serif Bold) | Right pill: `Tariff Band A` (`#F4F1EA`).
  * **AI Summary Copy:** `Your baseline electricity is steady at 28 kWh/day. A noticeable surge occurs between 13:00 and 16:00 on weekends due to twin air conditioner usage.`
  * **2-Column Metric Nested Sub-Cards (`#F4F1EA`):**
    1. **Left Box (`Peak electricity`):** `340` (`24px` Serif Bold) + `kWh` | `↑ +12% vs last mo` (`#A46B2C` warm amber).
    2. **Right Box (`Base water`):** `18` (`24px` Serif Bold) + `$\text{m}^3$` | `↑ +48% anomaly` (`#B91C1C` alert red — reflects the $+48\%$ MoM cistern leak surge; normal 3-person Semi-D baseline is $18\sim21\text{ m}^3$ / $\text{RM } 10\sim20$).
  * **`TRY THIS NEXT` Nested Action List (`#F4F1EA` cards):**
    1. **Tip 1:** Green leaf icon `🍃` | `Set master bedroom AC timer to 26°C with ceiling fan assistance (`**`Save ~RM 35/mo`**`).`
    2. **Tip 2:** Red water drop icon `🩸` | `Inspect toilet cistern seal in downstairs guest bath for silent leak.`
  * **Footer Disclaimer:** `Calculated based on TNB Domestic Tariff Schedule A and Air Selangor residential rates.` (`12px` `#8C857B`).

### 5.4 Screen 4: Household & User Profile (`Profile.png` — Updated without KPI Row)
* **Top Utility Header:** Right-aligned notification bell pill button with unread dot.
* **Hero Identity Card (`#FFFFFF` / `#FAF6F1`, `28px` radius, `24px` padding, center-aligned):**
  * **Avatar (`96px × 96px`):** Circular frame with double sage-green ring (`#D6E5C8`), warm illustrated female portrait with green leaf hair clip.
  * **Name:** `Mei Ling Tan` (`26px` Serif Bold, `#1E1B18`).
  * **Location & Household Subtitle:** `Petaling Jaya, Selangor · 3-person household` (`14px` `#57534E`).
  * **Live Presence Status Pill:** Sage green pill (`#D6E5C8` fill, `#4A5D3B` text): `● At home · Living room`.
* **Canceled Component Note:**
  * *The 3-Column KPI Summary Row (`Savings RM 420`, `Community 1,840`, `Eco Rating 5.0 ★`) is **omitted** per finalized product decision. The layout flows directly from the Hero Identity Card to the Settings & Digital Twin Configuration List.*
* **Settings & Digital Twin Configuration List (`#F4F1EA` fill, `28px` radius, `8px 20px` padding):**
  * **6 Interactive Rows** (Each row has a `40px × 40px` `#EAE6DF` circular icon badge on the left, `15px` Semi-Bold title in the center, and a right chevron `›`, separated by `1px` `#E4E0D8` dividers):
    1. `[👤]` **`Account & Security`** `›`
    2. `[📍]` **`18, Jalan SS 2/6, Petaling Jaya`** `›` *(Residential address & TNB/Air Selangor tariff zone)*
    3. `[👥]` **`3 Residents · Semi-D layout`** `›` *(Household occupancy & baseline water/energy profile)*
    4. `[🔌]` **`14 Connected Appliances`** `›` *(Full unclipped text in production)*
    5. `[🔔]` **`Daily Summary & Spike Alerts`** `›` *(Notification preferences)*
    6. `[🕒]` **`Weekday & Weekend Routine`** `›` *(Deep-links to `My day` schedule templates)*
* **Logout Action:** Full-width pill button (`52px` height, `#F4F1EA` fill, `#5C4033` text & exit arrow icon): `[↪] Log out` $\rightarrow$ redirects to `Login.png`.

---

## 6. Module 4: Community Eco-Governance & Collective Impact (`Community`)

### 6.1 Core Governance & Task Rules (Aligned with Peiyuan's Specification)
1. **Neighborhood Grouping & 1-Vote Rule:**
   * Households are grouped into local residential neighborhoods/sectors (e.g., `Oakridge Commons • Sector 4B`, `240 households`) based on their registered address.
   * **Every household has 1 voting right (`1 vote per household`)** each month to select the neighborhood reward. Voting requires no points.
2. **Daily Energy-Saving Tasks (`1 to 3 tasks/day`) & Monthly Point Accumulation:**
   * Each day, a household can complete **1 to 3 energy-saving or eco-sorting tasks** (e.g., sorting recyclable waste in `Bin`, uploading a lower-usage utility bill in `Scanner`, or optimizing AC/routine schedules in `Simulator`).
   * Completing daily tasks advances the household's **Living Leaf** across 3 daily stages:
     * `Dry (0 deeds today)` $\rightarrow$ `Healthy (1 deed today)` $\rightarrow$ `Lush (2 to 3 deeds today)`.
   * Every completed task awards Eco/Grove Points that **accumulate throughout the month toward the collective neighborhood target** (and household milestone) at month-end to unlock the democratically voted reward.

### 6.2 Screen 1: Community Home — New Letter State (`1. Community Home (New Letter).png`)
1. **Top Utility Bar:** Right-aligned notification bell pill (`76px × 44px`, `#F4F1EA`).
2. **Neighborhood Context Header:** Left: Green house-sprout icon + `Oakridge Commons • Sector 4B` (`14px` Medium, `#4A453E`). Right: `October Edition` (`16px` Serif Regular).
3. **Hero Mailbox Illustration Card:**
   * Soft sage-tinted outer frame (`#EFF3EC`, `28px` radius, `12px` padding) wrapping a rounded storybook watercolor illustration (`22px` radius) of a wooden postbox with a sealed letter.
   * Top-Right Floating Badge: Sage green pill (`#DFEAD5` fill, `#4A5D3B` text): `🍃 New letter`.
4. **Card: Monthly Decision (`This month's vote` — `#FFFFFF`, `28px` radius, `24px` padding):**
   * **Header Row:** Left overline `MONTHLY DECISION` (`12px` Uppercase). Right pill badge: `4 days remaining` (`#F5E9DA` fill, `#9A6338` text).
   * **Title:** `This month's vote` (`28px` Serif Bold).
   * **Primary CTA:** Full-width dark charcoal pill (`54px` height, `#231F1E` fill, white text): `✉️ Open letter` $\rightarrow$ triggers `2. Voting Letter.png`.
   * **Body Copy:** `Your household letter has arrived in the mailbox outside. Open your ballot to vote on this month's community eco-reward.`
   * **Divider:** `1px` solid `#EAE6DF`.
   * **Footer Rule Note:** Circular sage icon `🍃` + `1 letter per household • No points required` (`13px` `#57534E`).

### 6.3 Screen 2: Official Ballot Bottom Sheet (`2. Voting Letter.png`)
* **Modal Container:** Full-height bottom sheet (`28px` top corner radius, `#FAF6F1` fill) with top drag handle.
* **Sheet Header:** Pill badge (`#F2EFE9`): `[🗳️] Official Ballot • Issue #09`; Title: `This month's community vote` (`26px` Serif Bold); Subtitle: `Choose the reward our neighborhood should unlock this month. One vote per household.`
* **Banner Illustration:** Rounded landscape illustration (`20px` radius) of neighbors planting a young tree; bottom-left floating pill (`#FAF6F1`): `🌲 Oakridge Green Commons`.
* **Ballot Options Stack (3 Interactive Radio Cards, `12px` gap):**
  1. **Option 1 (Selected State — `#DFEAD5` fill, `20px` radius, `16px` padding):**
     * Left Icon: Leaf icon in darker sage circle (`#C5D6B8`).
     * Content: `Plant a tree in our community` (`16px` Serif Bold) + `Adds native shaded greenery to the parkway` (`13px` `#4A5D3B`).
     * Right Action Pill: White pill (`#FFFFFF`): `✓ Selected`.
  2. **Option 2 (Unselected State — `#FFFFFF` fill):**
     * Left Icon: Shopping basket in warm peach circle (`#F5E5D3`).
     * Content: `50% off organic food at Sime Darby Mall` + `Redeemable voucher for seasonal fresh produce`.
     * Right Action Pill: `#F2EFE9` pill: `Vote`.
  3. **Option 3 (Unselected State — `#FFFFFF` fill):**
     * Left Icon: Crossed tools in soft sage-grey circle (`#EBF0E6`).
     * Content: `Community tool & seed library` + `Free borrowing station for garden equipment`.
     * Right Action Pill: `#F2EFE9` pill: `Vote`.
* **Household Turnout Progress Nested Box (`#F3E7D8` fill, `18px` radius, `14px 16px` padding):**
  * Left: Circular tan badge (`#DFC7AC`) with people icon.
  * Top Row: `Household Turnout` (`13px` Semi-Bold) | `184 / 240` (`14px` Serif Bold).
  * Progress Bar: `6px` height, `#E2D5C5` track, `#7E916C` fill (`76.6%`).
* **Sheet Footer Actions:** Primary CTA (`54px` height, `#839470` fill, `#1E1B18` text): `✓ Submit vote` $\rightarrow$ `3. Voted, Waiting.png`. Secondary text button: `Later`.

### 6.4 Screen 3: Post-Vote Waiting State (`3. Voted, Waiting.png`)
* **Card 1: Carrier Pigeon Illustration Card (`#FFFFFF`, `28px` radius, `16px` padding):**
  * Top Status Row: Left pill (`#EFF3EC`): `● Ballot Sealed` (`#4A5D3B`) | Right pill (`#FFFFFF`): `✉️ Letter collected`.
  * Artwork: Carrier pigeon flying over a cottage garden carrying a sealed envelope.
  * Caption: `The community post carrier has gathered ballots for Cedar Grove.`
* **Card 2: Vote Confirmation & Timeline (`#FFFFFF`, `28px` radius, `24px` padding):**
  * Header: Circular sage badge (`44px × 44px`, `#EFF3EC`) + `Vote saved. Result arrives tomorrow.` (`22px` Serif Bold) + `We have safely recorded your household ballot for this month's community reward.`
  * **Nested Sub-Card (`YOUR HOUSEHOLD'S VOTE` — `#F3E7D8` fill, `18px` radius, `16px` padding):**
    * White circle with pine-trees icon | `Plant a tree in our community` (`Quarterly Green Commons`) | Right sage pill (`#DFEAD5`): `✓ Submitted`.
  * **2-Step Vertical Timeline (`WHAT HAPPENS NEXT`):**
    * Step 1 (Completed): Green checkmark `✓` | **`Vote submitted today`** | `Collected at 3:15 PM from your cottage`.
    * Step 2 (Pending): Cream envelope circle `✉️` | **`Announcement letter tomorrow morning`** | `Delivered directly to your community noticeboard`.
  * **Footer Fairness Note:** `⚖️` *`One vote per household per month. Results are tallied fairly across the neighborhood.`*
* **Bottom Live Turnout Banner (`#EDF2EA` fill, `22px` radius, `16px` padding):**
  * White circular people icon + **`214 neighbors voted so far`** + `Voting closes tonight at midnight across all blocks.`

### 6.5 Screen 4: Official Announcement Modal — Voting Results (`Group 2.png`)
* **Modal Container:** `#FAF6F1` fill (`28px` radius, `24px` padding) over dimmed backdrop.
* **Header:** Top pill (`#DFEAD5`) `✉️ Official Announcement • October Results` | Right date `Oct 28`. Title: `The neighborhood has decided!` (`26px` Serif Bold). Subtitle: `Over 82% of households voted. Together we chose how to channel our collective energy savings into local soil:`
* **Highlighted Winner Card (`#F3E7D8` warm sand fill, `24px` radius, `18px` padding):**
  * Badge Row: Left white pill `🍂 WINNING CHOICE` (`#9A6338`) | Right medal icon `🎖️`.
  * Title: `Plant a tree in our community` (`20px` Serif Bold) + `A native oak grove planted along Meadow Lane parkway this Autumn.`
  * Illustration: Hands in gardening gloves planting a sapling (`Meadow Lane Plot #4`).
  * **Nested Ballot Audit Sub-Card (`#FAF6F1` fill, `16px` radius, `16px` padding):**
    * Header: `Final Ballot Audit (240 total votes)`
    * Bar 1 (Winner): `✓` **`Plant a tree in our community`** | **`58%`** `(139 votes)` | Sage green bar (`58%`).
    * Bar 2: `50% off organic food` | `27% (65 votes)` | Grey bar (`27%`).
    * Bar 3: `Tool & seed library` | `15% (36 votes)` | Grey bar (`15%`).
* **Committee Signature Row:** 3 overlapping avatars (`ML`, `TK`, `JR`) + *`Signed by Elm & Oak Block Committee`*.
* **Primary CTA:** Full-width sage green pill (`54px` height, `#839470` fill): `✓ Got it` $\rightarrow$ transitions to Active Community Hub (`5. Community Home`).

### 6.6 Screen 5: Active Community Hub — Living Leaf & Daily Tasks (`5. Community Home (Hero Leaf & Suggestions).png`)
* **Hero Section: Circular Living Leaf Progress Dial:**
  * **Concentric Rings:** Outer dashed orbital ring + thick circular progress track (`#E4E7DF` track, `#566549` active arc).
  * **Center Artwork:** White circle (`190px × 190px`) featuring a botanical green leaf with morning dew drops.
  * **Bottom Overlapping Counter Pill:** Dark olive pill (`#4A5D3B` fill, white text): `🍃 1 / 2 deeds` *(supports 1 to 3 daily energy-saving tasks per household)*.
  * **Status Pill Below Dial:** Soft sage pill (`#E6ECD9`): `● Healthy Stage • 1 action today`.
  * **Heading:** `Living Leaf is Thriving` (`24px` Serif Bold).
  * **Subtitle:** `Complete 1 more green action today to unlock tomorrow's Lush state & community perks.` *(Points from each completed daily deed accumulate until the end of the month).*
* **3-Stage Leaf Progression Stepper (`#F4F1EA` pill bar):**
  * `● Dry (0)` (muted `#8C857B`) $\rightarrow$ `● Healthy (Active)` (elevated white pill `#FFFFFF`, bold) $\rightarrow$ `● Lush (2–3)` (sage green dot `#7E916C`).
* **Card: District Collective Impact (`Oakridge Community Impact` — `#FFFFFF`, `24px` radius, `18px` padding):**
  * Header: People icon + `Oakridge Community Impact` | Right pill: `This Month` (`#EFF3EC`).
  * **2-Column Metric Nested Sub-Cards (`#F7F5F0` fill, `16px` radius):**
    1. **Left Nested Box:** `⚡ ENERGY SAVED` | **`18,420`** `kWh` (`20px` Serif Bold).
    2. **Right Nested Box:** `🍃 POINTS EARNED` | **`+42,850`** `pts` (`20px` Serif Bold — cumulative monthly points across all participating households).
  * Footer Row: `● 240 households contributing` | `Live sync 🔄`.
* **Section: `Recommended for you` (Daily Energy-Saving & Eco Tasks Carousel):**
  * Header: `Recommended for you` (`20px` Serif Bold) + `4 available` (`#D6E5C8`) + `Swipe →`.
  * **Carousel Card 1 (`Recycle 1 item`):** White card (`24px` radius, `20px` padding), sage recycle icon, `● To do` pill, `Scan & correctly sort paper, plastic or metal at the community bin station.`, `🕒 ~30s`, `Go to Bin →` (`#F4F1EA` pill $\rightarrow$ deep-links to `Bin.png`).
  * **Carousel Card 2 (`Upload lower...`):** Peach receipt icon, `Snap electricity or... baseline < 280 kWh`, `⚡ < 280 kWh` ($\rightarrow$ deep-links to `Scanner.png`).
* **Bottom Milestone Progress Banner (`Oakridge Tree Planting` — `#F3E7D8` fill, `22px` radius, `16px` padding):**
  * White circle with brown tree icon | `Oakridge Tree Planting` + `88%` white badge + `142 neighbors joined. Unlocks on Lush` | Right chevron `›` $\rightarrow$ opens `6. Reward Unlocked.png` when monthly point target & Lush state are achieved.

### 6.7 Screen 6: Reward Unlocked & Village Milestone (`6. Reward Unlocked.png`)
* **Top Celebration Header:** Radial sage glow behind sprouting sapling illustration (`80px × 80px`), Title `Reward unlocked` (`30px` Serif Bold), Subtitle `Thank you for tending to our neighborhood! You completed your green action.`.
* **Card 1: Household Reward Claim Card (`#F3E7D8` fill, `28px` radius, `22px` padding, `1px` border `#E2C9AE`):**
  * Status Pill: `● Ready to claim` (`#DFEAD5`).
  * Title: `Plant a tree in our community` (`24px` Serif Bold).
  * **Location Nested Sub-Card (`#FAF6F1` fill, `16px` radius, `14px` padding):** Circular sapling photo (`48px × 48px`) + `Oakwood Grove • Plot #42` + `Community Planting Weekend`.
  * Description: `Your household sapling has been reserved for the Community Planting Weekend on Nov 12th. Tap below to choose your dedication plaque name and download your certificate.`
  * Primary CTA (`54px` height, `#7E916C` fill, `#1E1B18` text): `🪴 Claim reward`.
  * Footer Caption: `Reserved under Family Grove Account`.
* **Card 2: Village Milestone Summary (`Together, Our Neighborhood Did It` — `#FFFFFF`, `28px` radius, `22px` padding):**
  * Top Row: `🏆 Village Milestone • Unlocked` (`#FDF8F0` fill, `#D4A373` border) | `Month 11 Goal`.
  * Title: `Together, Our Neighborhood Did It` (`22px` Serif Bold).
  * Description: `240 households united this month to bring our village grove to life and exceed our shared district goal.`
  * **3-Column Connected KPI Nodes:**
    1. **`240`** | `Active Homes` | `100% engaged`
    2. **`18.4k`** | `kWh Saved` | `+14% vs goal`
    3. **`+42.8k`** | `Grove Points` | `District fund`
  * **Unlocked Perk Nested Callout Box (`#E2EAD9` fill, `16px` radius, `16px` padding):** Dark olive circle (`#566549`) with white tree icon + **`Unlocked Perk: Oakwood Grove Enhancement`** + `Sapling dedication ceremonies and shaded community bench installations begin this Saturday.`