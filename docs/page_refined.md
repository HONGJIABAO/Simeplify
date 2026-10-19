# Page Refined

The final, merged page-by-page spec for Simeplify / EcoTwin, written for **React Native (Expo)**. It is a mobile app, not a web app.

It merges `screen_spec.md`, `design.md`, `Feature_Requirements.md`, `Workflow.md`, and the decisions made so far. Where `screen_spec.md` disagrees with the other files, this file follows them and lists the change in section 4.

**Screenshots seen so far (23):** Login, Login error, Sign up (empty, error, filled), Simulator (view, edit, suggestions), Estimated bill (filled, empty), Add to My Day (valid, error), Edit Block, Bin, Scan result, Community (letter waiting, Ballot sheet, Vote saved, Result sheet, Reward unlocked, Living Leaf), Scanner (Bill analyzer), Profile.
**Not seen yet:** the My day timeline sheet, Notifications, Onboarding, Scanner check-and-correct and Bill detail, Scanner empty state. Those sections (S3, S7.2 to S7.4, S9 and the My day timeline in S4) are still written from `screen_spec.md` text. Send those screenshots and I will check them the same way.

---

## 0. Rules for reading this file

**Which file wins**

| About | Winner |
|---|---|
| Layout, content, and copy of a screen | The screenshot, when you sent one. Otherwise `screen_spec.md`. |
| Colors, fonts, radius, spacing, motion, and the Forbidden list | `design.md` (when a screenshot breaks a `design.md` rule, this file uses the `design.md` token and says so) |
| Behavior and rules | `Feature_Requirements.md`, then `Workflow.md` |

**React Native rules (apply to every screen)**

- Build with `View`, `Text`, `Pressable`, `ScrollView`, `FlatList`, `TextInput`, `Image`. No HTML tags, no CSS files, no `hover`, no cursor styles.
- Wrap every screen in `SafeAreaView`. Scroll screens use `pb-28` so content clears the tab bar. The Simulator does not scroll.
- Pressed state: use `Pressable` with a pressed style (sink 2 px, fill `stone-100`). There is no hover on a phone.
- Web-only classes in `design.md` need a native version:

| In `design.md` | In React Native |
|---|---|
| `focus:ring-2 focus:border-stone-400` | Keep a `focused` state from `onFocus` and `onBlur`, then change the border color |
| `placeholder:text-stone-400` | The `placeholderTextColor` prop |
| `transition-colors duration-300` | NativeWind transition classes if your version supports them, otherwise a Reanimated color animation (300 ms) |
| `shadow-sm` | The brown shadow style object from `design.md` Unit 16 (`elevation: 1` for Android) |
| `active:scale-95` | A Reanimated scale on press, 95% |

- Text inputs: wrap forms in `KeyboardAvoidingView` so the keyboard does not cover the field. Use the right `keyboardType` and `secureTextEntry`.
- Bottom sheets: build one shared `BottomSheet` with Reanimated and Gesture Handler (500 ms ease-in-out, drag handle, scrim `stone-800` 40%).
- Haptics, camera, and file pickers need a permission text in `app.json` and a "permission denied" state.
- Respect `AccessibilityInfo.isReduceMotionEnabled` everywhere there is motion.
- Every icon-only button has `accessibilityLabel` and `accessibilityRole="button"`.

**Libraries not approved yet** (ask before adding): a time-wheel picker, a bottom-sheet library, a chart library, an image-loading library. Charts can be drawn with `react-native-svg`.

---

## 1. Global

### 1.1 Screen map (Expo Router)

```
app/
  (auth)/login, sign-up
  (onboarding)/schedule, layout, appliances
  (tabs)/simulator, bin, community, scanner, profile
  notifications
  (sheets and modals open on top of their tab)
```

- Tab bar hidden on: auth, onboarding, full-screen camera.
- Bell: a pill button, 76 × 48 px, `cream` fill, 1 px `stone-200`, bell icon with a `tan-600` dot when unread (the screenshots draw it 76 × 44, raised to 48 for the touch target). It opens Notifications from every tab. Simulator, Bin, Community, and Profile have **no title bar** (the screenshots show none): the bell sits top right. Scanner has no title bar either, but a page title block under the bell row ("Bill analyzer" and a line of text). Sub-pages (Scan result, Notifications) keep a back arrow and a title. No header on auth and onboarding.
- Tab bar icons: the screenshots use two different icon sets (the Simulator and Profile screenshots swap them). Use the set from the Community, Bin, and Scanner screenshots: Simulator `home`, Bin `recycle`, Community `sprout`, Scanner `receipt-text`, Profile `user`. The small `sage-500` dot on the Community icon in the Community screenshots means "a vote is waiting".
- `design.md` Unit 9 (title on every screen) and Unit 12 Simulator layout do not match the screenshots. This file follows the screenshots for layout.
- Start flow: no session goes to Login. Session but `onboarding_done = false` resumes onboarding at the first step not done. Otherwise Simulator (see `Workflow.md` W1).

### 1.2 Mapping `screen_spec.md` colors to `design.md` tokens

Use the token, not the hex from `screen_spec.md`.

| `screen_spec.md` | Use |
|---|---|
| Dark charcoal `#231F1E`, `#1E1B18` (primary button) | `stone-800` |
| Olive and sage fills (`#839470`, `#7E916C`) for main confirm | `sage-400` accent button, text `stone-800` |
| Light sage `#D6E5C8`, `#DFEAD5` (selected, success) | `sage-100` (or `sage-200` for the Lush leaf) |
| Sub-card fill `#F4F1EA`, `#F7F5F0` | Mini card: `bg-white`, border `stone-200` |
| Warm sand `#F3E7D8`, peach `#F4E5D4` (highlight cards) | `tan-100` with a `tan-300` border |
| Error red `#B91C1C`, red fills `#FDECEB`, `#FADCD9` | Error: bg `#fbece8`, text and icon `#a8442f` |
| Amber `#FDF6E4`, `#FBF4DF` (warning) | Warning: bg `amber-50`, text `#92600e` |
| Card radius 24, 28 px | 32 px (`rounded-[2rem]`) |
| Uppercase overlines (`ESTIMATED BILL`, `TRY THIS NEXT`, `ROUTINE NAME` ...) | Normal sentence case, 12 to 13 px, `stone-600`. Uppercase tracked labels are forbidden. |
| Radial glow behind illustrations | A soft blob shape in `sage-100`. No glow. |
| Bell pill 76 × 44 | Bell pill 76 × 48 (touch target) |

### 1.3 Shared status patterns

- Loading: skeleton blocks `stone-100`, slow pulse 700 ms.
- Empty: blob illustration, H3 title, one body line, one button.
- Error from the server: toast (top, 3 s) and a Secondary "Try again" button where it makes sense.
- Success: Toast with icon.
- Every status has an icon and text, never color alone.

---

## 2. Screens

Format: **Features**, **Layout** (top to bottom), **States**, **Actions**, **Data**.

### S1. Login (AUTH-01)

Screenshots: `Login.png`, `Login_Error.png`.

- **Features:** AUTH-01.
- **Layout:** brand illustration (two soft overlapping blobs, `tan-100` and `sage-100`, with a hand-drawn sprout in `brown` and `sage-600`), H1 "Welcome" (Lora), subtitle "Save energy, sort waste, grow your community.", segmented switcher "Log in | Sign up" (track `stone-100`, active pill `sage-100`), Email input, Password input (masked, eye toggle), Primary button "Log in", divider "or", button "Log in with Google" (see below).
- There is **no "Your account" heading and no "Forgot password?"** on the login screenshots.
- **States:**
  - Default: Email focused (border `stone-400`, ring `stone-200`), Password shows 8 dots.
  - Error: Email keeps its text. Password field in error style (`#fbece8`, border `#a8442f`), alert icon, text "Email or password is wrong." This wording does not say which one is wrong, which is safer. The "Log in" button stays Primary (`stone-800`). The screenshot turns it olive green after the error. Do not copy that.
  - Loading: leaf spinner in the button. No internet: toast and "Retry".
- **Actions:** Log in goes to Simulator, or to onboarding when `onboarding_done` is false. The switcher moves to Sign up without leaving the screen.
- **Data:** Supabase Auth `signInWithPassword`, then read `profile.onboarding_done`.
- **Google button:** it is drawn on both auth screens, but AUTH-01 says email and password only. Build it behind a flag (`ENABLE_GOOGLE_AUTH = false`) until you decide (section 5, item 1).

### S2. Sign up (AUTH-01)

Screenshots: `Sign_up.png` (empty), `Sign_up_filled.png`, `sign_up_error.png`.

- **Layout:** same brand illustration, title, and switcher (Sign up active).
  - Section "Your account" (leaf icon beside the heading). Line: "Start with your preferred personal sign-in details." Email input (mail icon, or a check icon when valid). Password input, placeholder "Create a password", eye toggle, helper "At least 8 characters." with an info icon.
  - Divider.
  - Section "Where do you live?" (home icon). Line: "We use this to set your electricity tariff and to show your address." Secondary button "Use my location" (navigation icon). **State** (picker, placeholder "Choose your state"). **City or area** (placeholder "e.g. Petaling Jaya", building icon). **Street address (optional)** (placeholder "Jalan, neighborhood, or postal code", pin icon).
  - Button "Create account" with an arrow icon, divider "or", "Sign up with Google" (flag, see S1).
- **Required:** email, password (8 or more), State, City or area. **Street address is optional.**
- **States:**
  - Empty: "Create account" in disabled style (`stone-200`, text `stone-400`).
  - Filled: "Create account" is Primary and active.
  - Error: fields in error style with icon and text: "Choose your state." and "Enter your city or area." Errors show after the field is left or after the first tap on a disabled-looking button, not while the user is still typing. Also: invalid email, password under 8 characters, email already used (message with a link to log in), loading.
- **Actions:** Create account makes the Auth user, profile, and household, then opens onboarding.
- **Data:** Auth `signUp`, then profile and household with the address (State, City or area, optional street). The address sets the tariff zone.
- **Neighbourhood:** because the street is optional, a neighbourhood sector cannot depend on it (section 5, item 2).
- "Use my location" needs a location permission and a library (section 5, item 2).
- The screenshots draw three different logos on the three sign-up screens. Use the one from Login.
- The password in the filled screenshot is shown in plain text. That is the eye toggle turned on. Default is masked.

### S3. Onboarding (ONB-01 to ONB-03)

No header, no tab bar. Leaf-dot progress at the top. One large Lora question per screen. "Back" (Secondary) and "Next" (Primary) at the bottom. Saves after every step.

1. **Schedule (ONB-01):** question "When are you away from home?". Weekdays | Weekends toggle. List of time ranges (start and end pickers), "Add range", "Copy to other days". Errors under the field: "End must be after start", "This overlaps with another range". Unmarked time counts as at home.
2. **House layout (ONB-02):** steppers for living rooms, bedrooms, kitchens, bathrooms, and residents. Residents is on this step.
3. **Appliances (ONB-03):** pick a type (air conditioner, fridge, lights, fan, TV, water heater, ...), then brand, then model or wattage (if the model is not found, type the wattage), then a 5-star picker with "Not sure" (saves as 3 stars), then place it in a room on the floor plan. Filled stars `tan-400`, empty stars `stone-300` outline.
- **Finish:** `onboarding_done = true`, then Simulator.
- `design.md` Unit 12 lists four steps (it has "Household size" as its own step). This file follows `Feature_Requirements.md` and `Workflow.md`, with residents inside step 2.

### S4. Simulator (SIM-01 to SIM-07)

Screenshots: `simulator_blank.png`, `simulator_appliances.png`, `simulator_suggestion.png`, `simulator_bill_card.png`, `simulator_bill_card_blank.png`, `simulator_add_routine.png`, `simulator_add_routine_error.png`, `simulator_edit_routine.png`. **Not seen:** `simulator_routine.png` (the My day timeline).

A fixed screen (it does not scroll). Screen background `sage-50` (as in the screenshots). Order, top to bottom: top area, fast-forward panel (when open), "Edit" row, floor plan, suggestion area, tab bar. There is no title bar.

**S4.1 Top area**

- **Left: Bill card** (Card style, `p-4`, about 58% of the width): row with a gauge icon and "Estimated bill" (sentence case), then the hero `RM 0` (Lora 28) with "/ mo" (15 px), a 1 px divider, and a row with a clock icon and "Today • 18:30" (the scene time, from the phone clock). Tap opens the Bill modal (S4.2). The number counts up or down over 700 ms. Until My day has one answer, a note says it is the max bill.
- **Right: a vertical stack, 16 px apart:**
  1. Bell pill (see 1.1).
  2. **My day** button: 48 px round, `cream` fill, calendar-check icon, label "My day". Opens the My day timeline (S4.6).
  3. **Fast-forward** button: 48 px round, `stone-800` fill, `stone-50` icon.
- **"High usage" badge** on the bill card (drawn next to `RM 0`, which makes no sense): no rule defines "high usage". Hide it until a threshold is decided (section 5, item 7).

**Fast-forward (SIM-04)**
- Icons: closed `fast-forward`, open `play`, playing `square`. Labels: "Fast-forward. Opens the time selector.", "Play fast-forward for {1 month / 6 months / 1 year}", "Stop fast-forward".
- First tap: a panel opens under the top area and pushes the floor plan down (it never covers it). Panel: Slider 1M · 6M · 1Y with a value badge, "Save RM 1,500" (Lora 18, `sage-600`), hint "Tap again to play."
- Second tap: plays (4 s, 6 s, 8 s). Tap or drag during playback stops it. Tap outside, or 10 s after the end, closes the panel. Reduced motion: the second tap shows the final result.
- Letting go of the slider does not play. Details of the animation: `design.md` Unit 12, 3c.

**S4.2 Estimated bill modal**

Screenshots: `simulator_bill_card.png`, `simulator_bill_card_blank.png`. A **centered modal card** (`cream`, radius 32, `p-6`) over the scrim. Close "×" top right (48 px target). The scrim is darker in the filled screenshot than in the empty one. Use one scrim (`stone-800` at 40%).

- **Filled:** "Estimated monthly bill", `RM 233` (Lora 44), "525 kWh a month", a stacked bar (14 px, rounded ends, one segment per appliance), the heading "By appliance", then one row per appliance: a colored dot (same color as its segment), an icon in a soft circle, the name (bold), the room, the amount (`RM 127`), the percent (`54%`), and under the row a thin progress bar in the same color. Rows are separated by a 1 px divider.
- **Empty:** `RM 0`, "0 kWh a month", an empty `stone-200` bar, H3 "No appliances yet", "Add your appliances to see where your money goes.", button "Add appliances" (Accent, closes the modal and turns on Edit mode), footer "Estimate from your appliances and your day. Your real bill may be different."
- Show the footer in the filled state too. The estimate has no taxes, no Energy Efficiency Incentive, no Time-of-Use (SIM-01).
- Every segment and dot also has the row's text next to it, so color is never the only signal.
- Use the right icons. The screenshot shows a "move" icon for the air conditioner, a flask for the water heater, a fan for the air conditioner in the add sheet, and a car for the table fan. Suggested lucide names (check they exist in your version): air conditioner `air-vent`, fan `fan`, TV `tv`, lights `lightbulb`, fridge `refrigerator`, water heater `shower-head`.
- The two mock totals in the screenshots do not agree (`RM 233` here, `RM 248 / RM 348 est.` on the My day screens). Use one set of mock numbers.

**S4.3 Floor plan and Edit mode** (SIM-05, SIM-06)

- Above the plan, a right-aligned text button **"Edit"** (16 px semi-bold, `sage-600`, 48 px target). In Edit mode it reads **"Done"**.
- Plan card: `bg-white`, radius 32, `p-4`, 1 px `stone-200`. Inside, the plan as drawn: `brown` walls (3 to 4 px, rounded), doors as dashed gaps, a white label pill with a colored dot for each room. Floors: living room warm wood planks `#E6C08E`, kitchen cream tile `#EFEAD8`, bedroom sage carpet `#B6C4A6`, bathroom warm grey `#D6D3CD`, corridor wood.
- Rooms come from ONB-02. The four-room layout in the screenshot is the example for one of each.
- **The screenshot is a flat top-down plan. SIM-05 and `design.md` ask for a 2.5D isometric view.** Section 5, item 3. Until you decide, keep the room layout as data (rectangles on a grid) so the drawing can be swapped without changing the logic.
- Empty-state pill at the bottom of the plan (hand icon, read-only): view mode "Nothing here yet. Tap Edit to add appliances." (the screenshot has a typo: "press edit ro add"). Edit mode: "Nothing here yet. Drag an appliance from below."
- Appliances: flat icons. **Drag to move** (the position is saved). Tap: a `sage-400` ring and the appliance panel (info, edit, swap suggestion).
- **Edit mode tray** (`simulator_appliances.png`): the plan card moves up and a docked tray slides up from the bottom, above the tab bar (no scrim, the plan stays tappable). Tray: drag handle, a segmented control "Appliances | Furniture" (track `stone-100`, active pill white), and a grid of 72 × 72 px items (radius 20, line illustration) with a 13 px label: Air cond., Fridge, Lights, TV, then more (Fan, Water heater) by horizontal scroll. Drag an item onto a room. Dropping a new appliance opens the same details form as onboarding (brand, model or wattage, stars).
- **Furniture tab:** drawn in the screenshot, but no requirement defines furniture (section 5, item 5).
- The avatar and the home looks (light on and off, energy saving, backdrop by time of day): `design.md` Unit 12, 3a and 3b.

**S4.4 Suggestion area** (docked card above the tab bar, no scrim)

Screenshot: `simulator_suggestion.png`. It is a card (`tan-100`, `tan-300` border, radius 32, `p-6`) with the title "Energy optimization suggestions" (Lora H3) and a **horizontally scrolling row** of mini cards (the third card is cut at the edge to show it scrolls). Each mini card: an icon in a `tan-100` rounded square, a label ("5★ Inverter AC", "5★ Eco Fridge", "Full Home LED"), and a full-width "Try" button (Accent).

- Rules from SIM-02 on top of the screenshot:
  - Each mini card is one swap for one of the household's own appliances, only when it is frequently used and its stars are below 5. Never a lower rating. Air conditioner: the card says **Inverter**.
  - Each card also shows the monthly saving ("Save RM 80/month"). The screenshot has no saving line. SIM-02 requires it.
  - No brand, no model, no price.
  - Tapping an appliance on the plan scrolls the row to that appliance's card.
- "Try" swaps in memory only, the bill drops right away, and the button becomes "Undo".
- When there is nothing to suggest, the card is hidden and the plan grows.
- Other states use the same docked card: **first time** ("Answer a few quick questions to make your bill more accurate." with "Start" and "Later") and **Solar** (bill at or above RM 500, "See how" and "Later", does not return in the same session once closed).
- "Full Home LED" is a lights swap, but SIM-02 talks about star ratings. Section 5, item 9.
- The screenshot shows suggestions while the plan is empty (`RM 0`, "Nothing here yet"). That cannot happen: with no appliances there is nothing to suggest.

**S4.5 Add appliances** is the Edit mode tray in S4.3, and the "Add appliances" button in the empty Bill modal.

**S4.6 My day** (SIM-07)

- *Quick setup* and the *timeline* sheet: as in `design.md` Unit 12, 5. The timeline screenshot (`simulator_routine.png`) has not been seen.
- All My day sheets are full-height bottom sheets with a drag handle, a title (Lora), and a round "×" close button (48 px) on the right. They cover the tab bar and sit over the scrim.
- **Add to My Day** (`simulator_add_routine.png`):
  - Sections: "Routine name" (input pill with an icon, the text, and a clear button), quick pills (Watching TV, Working, Studying, Cooking; horizontal scroll), "Where?" (2-column room grid: Living room, Kitchen, Bedroom 1, Bedroom 2, Bathroom; selected = `sage-100` and a check icon), "When?" (two mini cards "Starts" and "Ends" with a clock icon and the time, tap to open the time picker), "Appliances on during this" (a list card: icon, name, "90 W · Living room", switch; only appliances in the chosen room).
  - Sticky footer: "Cancel" (Secondary) and "Save" (Primary).
  - Labels in the screenshot are small uppercase ("ROUTINE NAME", "STARTS"). Use sentence case ("Routine name", "Starts").
  - Sub-labels like "Eco mode ready", "Warm ambient", and "Standby" are decoration. Show the wattage and room only.
- **Error state** (`simulator_add_routine_error.png`):
  - Top summary banner: "Please resolve 2 issues to continue" and "Missing required title and a scheduling overlap." (error style, icon and text).
  - Name field in error style, "Required" at the right of the label, helper "Enter a title." with an icon.
  - "When?" shows "Time conflict" at the right of the heading, the two time cards in error style, and a banner "Schedule overlap. This overlaps with Dinner (19:00 – 19:30)." (the screenshot adds "on Mon", drop it).
  - A block inside away time: amber note "You are away at this time. This block will not be counted." (the screenshot says "on Mon and Tue", drop it).
  - "Save" is disabled with a lock icon.
  - The screenshot's **"Repeat on" section** (Mon to Sun, Weekdays, Weekends, Every day) is only in the error state, not in the valid state. My day is the same every day (SIM-07), so it is dropped.
  - The "Away" option in the room grid: away time comes from the schedule and is locked (SIM-07), so a block cannot be "Away". Dropped from the grid (section 5, item 6).
- **Edit Block** (`simulator_edit_routine.png`):
  - Summary row with the routine name and a room badge, "Starts" and "Ends" cards, the "Where?" grid, and "Room appliances in use" with the count ("4 active · 1 standby"), one card per appliance with a switch.
  - Footer: "Cancel" and "Apply changes" (Accent), and a text button "Remove time block" (error color, trash icon, not for Sleep).
  - **Not defined in any requirement:** the Temperature stepper (23°C), the Timer stepper (1h), the Fan speed control (Low, Med, High), the per-appliance "~0.80 kWh" lines, and the "Est. cost RM 1.45 / RM 0.35 less than standard" card. Section 5, item 4. Until decided, build the sheet with times, room, and switches only. Keep the shower block's "Minutes per shower" stepper (5 to 30).
  - The routine name "Sunday Movie & Leisure" names a day. My day has no days, so use names like "Evening".
- **"Simulated Clock 20:45" slider and a settings button:** the My day screens show them in the background, together with "Forecast bill RM 248 / RM 348 est." They are not in the Simulator screenshots and not in the requirements (section 5, item 8).
- Sheets sit over the tab bar. The Edit Block screenshot shows the tab bar under the sheet. Use the scrim and cover it, like the Add sheet.

### S5. Bin (BIN-01, BIN-02)

Screenshots: `Bin.png`, `Bin_Scan.png`.

**S5.1 Bin home** (scroll, no title bar, bell pill top right)

1. **Eco progress card:** "Household eco progress" (sentence case, 12 to 13 px) and a round recycle badge (`sage-100`) on the right. Hero "340 pts" (Lora 40), line "+10 pts per cleanly sorted item". A "Community Tree Milestone" Progress bar ("340 / 500 pts", "160 pts until next sapling planted"). Two mini cards: "34 items · Diverted total" and "3.4 kg · CO₂ prevented".
   - The milestone number (500) is an example. The target is not decided (`Workflow.md` section 5, item 1).
   - "CO₂ prevented" has no requirement and no factor. The screenshot implies 0.1 kg per item. Section 5, item 10.
2. **Scan card:** round camera badge, title "Scan your waste", one line ("Snap a photo of packaging, containers, or leftovers. Gemini AI instantly identifies the right bin."), "Open AI scanner" (Primary, `stone-800`; the screenshot uses a deep brown) and "Upload photo from gallery" (Secondary). A stray "<" chevron is drawn on top of this card in the screenshot. Do not build it.
3. **Sorting bins guide:** four stacked cards, each with the bin icon in a colored circle, the name, a points pill, and one line of examples. Colors follow `design.md` (the screenshot uses peach for paper and olive for general waste):

| Bin | Color | Points | Examples line |
|---|---|---|---|
| Paper | `tan-400` | +10 | Clean cardboard, envelopes, egg cartons, unlined paper |
| Plastic | `sage-300` | +10 | Bottles, clean jugs, rinsed shampoo containers, rigid tubs |
| Glass & Metal | `brown` | +10 | Clean tins, glass jars, metal lids, beverage cans |
| General waste | `sage-600` | 0 | Food scraps, soiled wrapping, non-recyclable items |

   The pill "Standard 4-Stream" is dropped. Bin names follow BIN-01 (Paper, Plastic, Glass & Metal, General waste), so the guide and the result sheet use the same names (the screenshots use "Paper & Cardboard" in one place and "Paper & Carton Bin" in another).
4. **Recent scans:** a card with "Recent scans" and "View all". Rows (mini cards): bin icon, item name, "Paper bin • Today, 11:30 AM", points pill (+10 or 0).

**S5.2 Scanner view** (full-screen camera, no tab bar)
- Rounded viewfinder (`cream` stroke, 3 px), hint pill on `stone-800` 60%, shutter, close.
- States: permission denied (message and "Open settings"), scanning (slow leaf spinner).

**S5.3 Scan result** (`Bin_Scan.png`)

- Header: back arrow, title, bell pill. The screenshot title is "Material Breakdown". Use "Scan result", because the material percentages are dropped (below).
- Top half: the captured photo (radius 32) with a pill "Scan complete", reticle corners, and a label with the item name. **Layout bug in the screenshot:** the sheet covers the item-name label, and a stray panel is clipped at the right edge of the photo. Size the photo so the label stays visible.
- Bottom sheet (white, radius 32 at the top, drag handle):
  - Pill "AI confirmed · 98% match" (the confidence number is returned by the Edge Function, so it can be shown). Drop "Unit 12.3 · BIN-01".
  - A mini card with the bin icon in the bin color, the bin name (Lora H2), and "Recyclable item (+10 points)" or "General waste (0 points)". The text label is always there.
  - A mini card "Mindful separation advice": droplet icon and **one or two lines** of tip. Drop the material percentage bar ("85% FSC Pulp Board, 15% Barrier Seal"): the AI returns no such data (`Workflow.md` W4).
  - Buttons: "I threw it (+10 pts)" (Accent) and "Retake photo" (Secondary, camera icon).
  - Drop "Incorrect bin? Suggest correction" (no requirement, would need a feedback table). Section 5, item 11.
- After "I threw it": toast "+10 points" and back to Bin home. If the household already has 3 deeds today the button reads "I threw it" and the toast says "Daily limit reached. 0 points today." (COM-03).
- States: low confidence ("Not sure. Please retake the photo."), AI error or timeout ("Try again"), loading, permission denied.
- The AR tags on the photo ("Material: Paper Carton", "Status: Clean & Recyclable") need a `material` field. Proposal: the Edge Function also returns `material` (short text) and `tip` (short text). Section 5, item 11.

### S6. Community (COM-01 to COM-03)

Screenshots: `1__Community_Home_New_Letter.png`, `2__Voting_Letter.png` (Ballot), `3__Voted_Waiting.png`, `Group_2.png` (Result), `5__Community_Home_Hero_Leaf__Suggestions.png`, `6__Reward_Unlocked.png`.

The household has one account, one vote per month, and one Living Leaf. The neighbourhood sector comes from the address (section 5, item 2). The place names in the screenshots disagree (Oakridge Commons, Oakwood Grove, Cedar Grove, Elm & Oak, Meadow Lane Plot #4, Plot #42). Show only the neighbourhood name from data, and reward place names only when the reward has one (section 5, item 21).

**S6.0 Community home** (scroll, no title bar, bell pill top right)

The screenshots draw two looks of this tab: a **letter look** (mailbox or pigeon on top, `1__` and `3__`) and a **leaf look** (Living Leaf on top, `5__`). Neither look shows the other's blocks. Section 5, item 16. Until you decide, build one scroll with these blocks, top to bottom:

1. **Neighbourhood line:** house-sprout icon, "{Neighbourhood} • Sector {x}", and on the right the month name in Lora ("October"; the screenshot says "October Edition", and "Edition" is decoration).
2. **Letter hero and Vote card:** only while a vote needs attention (letter waiting, or vote saved and the result not yet seen). Details below.
3. **Living Leaf.**
4. **This month card.**
5. **Recommended for you.**
6. **Reward progress row** (only after the result is known).

**Living Leaf** (`5__`)
- A round dial: the leaf illustration in a white circle, a ring around it (`sage-600` arc on a `stone-100` track), and a pill on the dial with a leaf icon and "1 / 2 deeds". Drop the dashed outer ring and the small dots around it (decoration).
- Stage pill: "Healthy stage • 1 action today". Title (Lora H3): "Living Leaf is thriving". Line: "Complete 1 more green action today to unlock tomorrow's Lush state." Copy by stage: `design.md` Unit 12, 4. The "& community perks" part has no rule, so drop it.
- Stage stepper: three pills joined by arrows, "Dry (0)", "Healthy (Active)", "Lush (2+)". The current stage is a white pill with a dot, the others `stone-400`. The numbers are deeds today.
- **The dial says "1 / 2 deeds" and Lush starts at 2+, but COM-03 caps points at 3 deeds a day.** Section 5, item 17. The ring follows deeds today toward Lush.

**This month card** (`5__`)
- Title "Community impact" with a "This month" pill.
- A Progress bar toward the month target (example numbers: `42,850 / 50,000 pts`; the target is open, section 5, item 15).
- Two mini cards: "Recycling points" and "Energy points". The screenshot shows "Energy saved 18,420 kWh" and "Points earned". kWh saved is not tracked by any requirement, so it is dropped.
- Line: "240 households contributing". Drop "Live sync" (no realtime requirement).

**Recommended for you** (`5__`)
- Heading with a count pill ("{n} to do"). Drop the "Swipe →" hint; the next card peeking at the right edge already shows it scrolls.
- Horizontal `FlatList`, cards about 75% of the width. Card: round icon (`sage-100` for Bin, `tan-100` for Scanner), badge top right (dot and "To do", or check and "Done"), title (Lora), one line, a divider, and a bottom row with a meta item (clock and "~30s") on the left and a button ("Go to Bin →") on the right.
- Cards: "Recycle 1 item" → Bin ("Scan an item and sort it into the right bin."), "Upload a lower electricity bill" → Scanner ("Upload this month's bill. A lower bill than last month earns points."), an energy-saving action → Simulator.
- Drop "at the community bin station" (no stations in the app) and the "< 280 kWh baseline" (no rule for 280). The meta on the Scanner card is "1 bill".

**Reward progress row** (`5__`, "Oakridge Tree Planting 88%")
- `tan-100` row: tree icon in a white circle, the winning reward's title, a percent chip (share of the month target reached), and a chevron once the reward is unlocked (it opens S6.3).
- Hide it until the result is known, because the reward is not known before that. Drop "142 neighbors joined" (no data) and "Unlocks on Lush" (the reward unlocks when the month target is reached, not at a leaf stage).

**Vote card states**

| State | Content |
|---|---|
| Letter waiting (not voted) | Letter hero + Vote card, see below |
| Voted, waiting | Pigeon hero + "Vote saved" card, see below |
| Result ready | "The neighbourhood has decided!" opens the Result sheet (S6.2) once, then a compact winner row |
| Reward unlocked | Opens S6.3 |

**Letter waiting** (`1__`)
- Hero card: `sage-50` frame (radius 32, `p-4`) with the mailbox illustration (radius 24), and a pill at the top right with a leaf icon, "New letter" (`sage-100`).
- Vote card (white, radius 32, `p-6`):
  - Top row: label "Monthly decision" on the left (sentence case; the screenshot is uppercase) and a `tan-100` pill "4 days remaining" on the right (the window is open, section 5, item 12).
  - Lora H2 "This month's vote".
  - Primary button "Open letter" (envelope-open icon, `stone-800`). It opens the Ballot sheet (S6.1).
  - Body: "Your household letter has arrived in the mailbox outside. Open your ballot to vote on this month's community eco-reward." Do not hard-wrap lines.
  - A 1 px divider, then a leaf badge and "One vote per household • No points needed" (the screenshot says "1 letter per household").

**Voted, waiting** (`3__`)
- Hero card: pigeon illustration, a pill at the top left "Ballot sealed" (dot) and at the top right "Letter collected" (mail-check icon), and a caption "The community post carrier has gathered ballots for {neighbourhood}." (the screenshot says "Cedar Grove"; use the neighbourhood from data).
- Card (white, radius 32):
  - A sprout icon in a `sage-100` circle, Lora H3 "Vote saved. Result arrives tomorrow." (timing is open, section 5, item 12), and the line "We have safely recorded your household ballot for this month's community reward."
  - Divider, then "Your household's vote" (sentence case) and a `tan-100` mini card: icon, the option's title, the option's short line, and a "Submitted" badge with a check. **Bug in the screenshot:** the badge clips the title and the line ("Plant a tree ir", "Quarterly Green C"). Let the title wrap to two lines.
  - Divider, then "What happens next" (sentence case) with a two-step vertical timeline. Step 1 is done (check in a `sage-100` circle, connector line): "Vote submitted today", "Collected at 3:15 PM" (the time comes from the vote record; drop "from your cottage"). Step 2 is next (envelope icon, `stone-100` circle): "Announcement tomorrow morning", "You will get a notification when the result is ready." The screenshot says the letter is "delivered to your community noticeboard". There is no noticeboard; NOT-01 sends "Month result is ready".
  - Divider, then a scale icon and a 13 px note: "One vote per household per month. Results are tallied fairly across the neighbourhood."
- Below the card, a `stone-100` mini card with a people icon: "{n} households voted so far" and "Voting closes {when}." (the screenshot says "214 neighbors" and "tonight at midnight across all blocks"). The ballot shows 184 of 240, so use that number; one set of mock numbers. Section 5, item 12 for the closing time.

**S6.1 Ballot sheet** (`2__Voting_Letter.png`, bottom sheet, full height)
- Drag handle, scrim, covers the tab bar. **Bug in the screenshot:** the sheet is narrower than the screen, the reward cards run past its right edge, and the tab bar shows below the scrim. The sheet is full width and every card stays inside the same 24 px side padding.
- Pill "Official ballot" (stamp icon). Drop "Issue #09" (no data). Lora H2 "This month's community vote". Line "Choose the reward our neighbourhood should unlock this month. One vote per household."
- Illustration card (radius 24). Drop the pill "Oakridge Green Commons" on it, or use the neighbourhood name from data.
- Reward cards (radius 24, 3 in the example): icon in a soft circle, title (Lora), one line, and on the right a "Vote" pill (`stone-100`) or a "Selected" pill with a check (white pill on a `sage-100` card). The whole card is tappable. One selection at a time. **Nothing is selected when the sheet opens.** The screenshot opens with the first option already selected, which pushes the vote.
- Reward options come from data (title, one line, optional place, optional image). The screenshot options are sample data. Who defines them is open (section 5, item 18).
- A `tan-100` mini card "Household turnout": people icon in a circle, "184 / 240", and a Progress bar (`sage-400`).
- Buttons: "Submit vote" (Accent, check-circle icon, disabled until one option is selected) and "Later" (text button).
- Error: "Could not save your vote. Try again." (toast). Already voted: shows the current vote, no submit.

**S6.2 Result sheet** (`Group_2.png`, bottom sheet)
- Header: a `sage-100` pill "Official announcement • October results" (check icon) and the result date on the right ("Oct 28", from data). Lora H2 "The neighbourhood has decided!". Line "184 of 240 households voted. Together we chose this month's reward." Compute the numbers; the screenshot hard-codes "Over 82%", which does not match 184 / 240.
- Winner card (`tan-100`, radius 32): a white pill "Winning choice" (leaf icon) and a medal icon on the right, the reward title (Lora H2), the reward's one line, and the reward image with a place pill ("Meadow Lane Plot #4") only when the reward has an image or place.
- Mini card "Final ballot audit ({n} total votes)": one row per option, sorted high to low. Row: the option name on the left (two lines at most) and "58% · 139 votes" on the right on **one line**, then a full-width bar (winner `sage-400` with a check icon, others `stone-300`). Reserve the check's space on every row so the names line up. The screenshot wraps the percent text and shifts the names of the losing options. Drop the stamp icon at the top right of this mini card (no action behind it).
- Drop the avatars "ML TK JR" and "Signed by Elm & Oak Block Committee" (no committee in the requirements).
- Button "Got it" (Accent, check-circle icon).
- **Bug in the screenshot:** the scrim covers only the top part of the screen and the tab bar sits inside the sheet. Use one full-height scrim and cover the tab bar.

**S6.3 Reward unlocked** (`6__Reward_Unlocked.png`)
- A soft blob with the sapling illustration (the screenshot has a radial glow; no glow, no confetti, soft leaf animation 500 ms; fade only with reduced motion). Lora H1 "Reward unlocked". Line "Thank you for tending to our neighbourhood." Drop "You completed your green action" (no per-household action is tracked here).
- **Card 1** (`tan-100`, `tan-300` border, radius 32): a `sage-100` badge with a dot and "Unlocked this month" (the screenshot says "Ready to claim", which belongs to a claim step that is not in v1), the reward title (Lora H2), a mini card with a round image or icon, the place and the event name (for example "Community Planting Weekend") only if the reward has them, and one line from the reward's description (for example the event date). Drop "Tap below to choose your dedication plaque name and download your certificate", the "Claim reward" button, and "Reserved under Family Grove Account".
- **Card 2** (white, radius 32): a `tan-100` pill with a trophy icon "Neighbourhood milestone • Unlocked" and the month name on the right (the screenshot says "Month 11 Goal"), Lora H2 "Together, our neighbourhood did it", the line "240 households came together this month and reached our shared goal.", and a row of two numbers joined by a dashed line, each in an icon circle: "240 · Active households" and "42,850 · Points". Drop the third number ("18.4k kWh saved, +14% vs goal"), "100% engaged", "District fund", and the name "Grove Points" (the app calls them points).
- Drop the green "Unlocked perk" box. It repeats the reward, and the screenshot clips its text at the card's bottom edge.
- When the target is **not** reached at month end: a calm "Not unlocked this month" card with the total and the target, and a line that a new month starts.
- Not in v1: "Claim reward", the dedication plaque name, the certificate download, the kWh saved number. The screenshot draws them. No requirement defines them (section 5, item 13).

### S7. Scanner (SCN-01 to SCN-04)

Screenshot: `Scanner.png` (Bill analyzer, long scroll). **Not seen:** the check-and-correct screen, the result screen, Bill detail, and the empty state.

**S7.1 Scanner home** (scroll, bell pill top right, no title bar)
- Under the bell row, a page title block on the left: Lora H1 "Bill analyzer" and the line "Track monthly utility trends, detect leaks, and get AI tips."
- Upload card: a receipt icon in a `stone-100` rounded square, Lora H3 "Upload utility bill", "TNB electricity and Air Selangor water bills (PDF or photo)", then two buttons side by side, "Take photo" (Primary, camera icon) and "Upload PDF" (Secondary, upload icon).
- **Water alert area** (only when a level applies), from `Feature_Requirements.md` Appendix B. The screenshot shows the Leak detected level and matches the table, with these fixes: sentence case labels ("Anomaly detected", "Oct statement") and the wording from the table.

| Level | Display |
|---|---|
| Normal | Nothing |
| Minor drip | One tip line in the latest bill card (info style). No banner. |
| Leak detected | Amber banner, warning icon in a tinted square, "Anomaly detected", for example "Water bill up 48% vs September. Check the toilet cistern seal and outdoor pipes.", the bill month on the right |
| Major pipe burst | Terracotta banner above everything, alert icon, "Water use doubled. Check for a burst pipe and consider closing the main valve." |

- **Monthly usage card:**
  - Title "Monthly usage" with "Past 5 billing cycles" under it. **The filter row All / Electricity / Water goes on its own row under the title** (pill row, selected `sage-100`). The screenshot puts it beside the title, which wraps the title to two lines.
  - Grouped bars, one pair per month (Jun to Oct): electricity left (`tan-400`), water right (`sage-500`), rounded tops, 1 px `stone-200` gridlines, a legend with dots ("Electricity (TNB)", "Water (Air Selangor)").
  - **The screenshot has one "RM" label per month and it is not clear whose amount it is** (310, 325, 350, 380, 420). Proposal: no label above the bars; tap a month to show a line under the chart with both amounts ("Oct: Electricity RM xx · Water RM xx"). Section 5, item 20.
  - The leak marker is a warning icon plus the text "Water +48%" on the **water** bar of that month. The screenshot puts a small red triangle next to the electricity bar and colors the latest label red. Use the warning tokens, not red.
  - One trend sentence in a `stone-100` mini card with an arrow icon, written from the household's own bills ("Electricity is up 12% and water is up 48% vs September."). Drop "Usage is 12% lower than similar 3-bedroom terrace homes in your district" (no data).
- **AI Analysis card:**
  - A sprout icon in a rounded square, "AI Analysis" (Lora H3). Drop the chip "Tariff Band A".
  - Summary (2 sentences at most) at the **monthly level**. The screenshot says "steady at 28 kWh/day" and "a surge between 13:00 and 16:00 on weekends due to twin air conditioner usage". A monthly bill has no daily or hourly data, so the AI cannot say this.
  - Two mini cards with an arrow icon and text: "Electricity 340 kWh, +12% vs last month" and "Water 18 m³, +48% (leak detected)". Drop the labels "Peak electricity" and "Base water" (no peak or base data).
  - "Try this next" (sentence case, up to 3): a mini card each, with a leaf icon (energy) or a droplet icon (water). Tips can name an appliance from the household's list. No room names ("master bedroom", "downstairs guest bath") and no "Save ~RM 35/mo" unless the app computes it (section 5, item 20).
  - 12 px footer note. Do not name a tariff schedule (the app has no tariff-band data). Suggested: "Based on your bills only. Your real usage may differ."
- **Archive list:** not drawn (the screenshot ends after the AI card). Keep it from `screen_spec.md`, under the AI Analysis card: bills by month, newest first, thumbnail, amount, status badge. Tap opens Bill detail.
- The latest bill card shows only the first line of the analysis.
- Not in v1: "Tariff Band A", "Usage is 12% lower than similar homes", the weekend 13:00 to 16:00 example. The screenshot draws them; the app has no data for them.

**S7.2 Check and correct** (after reading a bill, SCN-01)
- Photo thumbnail, then editable fields: bill type, billing month, usage, amount (Input style). "Confirm" (Accent), "Retake" (Secondary).
- States: reading (skeleton, "Reading your bill..."), cannot read ("We could not read this bill. Try a clearer photo."), same month already saved (confirm "Replace the saved bill?").

**S7.3 Result**
- Status badge and alert first. Then an "Energy points" toast if earned ("+50 points", counts as one deed). Then the AI Analysis card loads after (skeleton and "Analyzing your bill..."). AI error: amber note and "Try again". The bill is already saved.
- First bill (no history): "A trend needs next month's bill." Electricity compares with the Simulator estimate. Water uses the volume limits only.

**S7.4 Bill detail** (SCN-04)
- File preview, values, status, history comparison, the saved AI analysis (read from `bills.analysis`, no AI call), "Analyze again", and "Delete bill" with a confirmation.

### S8. Profile (PRO-01)

Screenshot: `Profile.png`.

- No title bar (the screenshot shows none): the bell sits top right on a transparent row. Drop the flat strip drawn behind the bell and the peach glow at the top right of the hero card.
- Hero card: the avatar face centered in a round frame (about 176 px, `sage-200` ring, the face illustration with the small leaf), the name (Lora H2), and "Petaling Jaya, Selangor · 3-person household". **Tap the avatar** to open the Resident sheet: the full avatar (about 120 px, slow breathing idle), and a status pill ("At home · Living room" in `sage-100`, or "Out · back at 18:00" in `tan-100`). No buttons.
- **The screenshot draws the status pill on the hero card, under the household line.** PRO-01 rule 4 puts it in the Resident sheet, so it is not on the hero. Section 5, item 19.
- **No row of summary numbers.** The screenshot draws three mini cards (Savings "RM 420 this year", Community "1,840 Eco Points", Eco Rating "5.0★ Top Tier"). The row was removed, and "Savings this year" and "Eco rating" have no requirement. Section 5, item 19.
- List card (`bg-white`, radius 32, 1 px `stone-200`), rows of 68 px: an icon in a `stone-100` circle, the row text (18 px semi-bold), a chevron, and 1 px dividers. **The row text is the current value**, so no sub-labels:
  - Account (the screenshot says "Account & Security"; the app has no security settings, so just "Account").
  - Address, for example "18, Jalan SS 2/6, Petaling Jaya" (show "Petaling Jaya, Selangor" when the street is empty).
  - Household, for example "3 residents · 5 rooms" (the screenshot says "Semi-D layout", and the app has no house-type data).
  - Appliances, for example "14 appliances". The screenshot says "14 Connected Appliances" and clips it ("Applia"). "Connected" is wrong, there are no smart devices. Truncate with an ellipsis if a long value does not fit.
  - Schedule, "Weekday and weekend" (clock icon, opens the My day schedule; the screenshot says "Weekday & Weekend Routine").
  - Notifications (opens the list). The screenshot draws "Daily Summary & Spike Alerts" in this slot. Not in v1, NOT-01 has no settings.
- "Log out": a full-width Secondary button under the list card, with the log-out icon.
- Edits: name and address editable. Schedule, layout, and appliances reuse the onboarding screens. Changes update the Simulator bill the next time it opens.
- The screenshot uses a wide, tracked body font and a different serif for the name. Use the `design.md` fonts.

### S9. Notifications (NOT-01)

- Header with back arrow, title "Notifications", text button "Mark all as read".
- Groups "Today" and "Earlier". Row: icon, title, short text, time, `tan-600` dot if unread.
- Types: unusual water bill (Leak detected and Major pipe burst only), "Voting is open", "Month result is ready". Tap opens the linked screen and marks the row read.
- Empty state: leaf illustration and "You are all caught up."

---

## 3. States checklist (every screen)

- [ ] Loading (skeleton) and empty (blob illustration)
- [ ] Server error (toast and retry)
- [ ] No internet
- [ ] Permission denied (camera, photos) where used
- [ ] Reduced motion
- [ ] Font scaling to 130% without clipped text

---

## 4. What changed

**From the screenshots (23 seen)**

| In the screenshot | Now | Why |
|---|---|---|
| Google button on Login and Sign up | Behind a flag, off | AUTH-01 is email and password only |
| Login has no "Forgot password?" and no "Your account" heading | Matches the screenshot | `screen_spec.md` was wrong |
| Login error turns the button olive | Button stays Primary | One button style |
| Street address optional, State and City required | Matches the screenshot | `screen_spec.md` said all three |
| Sign-up helper text mentions "show your address", not "neighbourhood" | Matches the screenshot | Neighbourhood grouping is open |
| Top-right stack: bell, My day, fast-forward | Kept | The screenshots and `screen_spec.md` agree |
| No title bar on Simulator and Bin | Kept | The screenshots show none. `design.md` Unit 9 needs an update. |
| "High usage" badge beside `RM 0` | Hidden | No rule |
| Flat top-down floor plan | Open question | SIM-05 asks for 2.5D isometric |
| Three "Try" cards in a scrolling row | Kept, but each card is one real swap with a saving line | SIM-02 |
| "Furniture" tab | Open question | No requirement |
| Bill modal in the center, with per-row bars | Kept | The screenshots show it |
| Icons: "move" for the AC, flask for the water heater, car for the fan | Correct icons | Wrong icons |
| "Repeat on" in the error state of Add to My Day | Dropped | My day is the same every day |
| "Away" in the room grid | Dropped | Away comes from the schedule |
| "on Mon", "on Mon and Tue" in the error banners | Dropped | No days in My day |
| Temperature, timer, fan speed, "Est. cost" in Edit Block | Not built until decided | No calculation rule |
| Material percentage bar, "Suggest correction", "Unit 12.3 · BIN-01" on the scan result | Dropped | The AI returns no such data |
| Bin guide colors peach and olive | `design.md` bin colors | Design tokens |
| Uppercase small labels ("ESTIMATED BILL", "ROUTINE NAME", "HOUSEHOLD ECO PROGRESS") | Sentence case | `design.md` Forbidden list |
| Saturated red and pink error fills | `design.md` error tokens | Design tokens |
| Stray "<" on the Bin scan card, clipped panel on the scan photo, sheet covering the item-name label | Not built | Drawing bugs |
| Mock totals `RM 233` and `RM 248 / RM 348 est.` | One set of mock numbers | They disagree |
| No title bar on Community and Profile, a title block on Scanner | Kept | The screenshots show it |
| Two Community looks (letter hero, leaf hero) | One scroll for now | Open question 16 |
| Leaf dial "1 / 2 deeds", Lush (2+) | Open question | COM-03 caps at 3 deeds |
| "Energy saved kWh" (Community and Reward unlocked), "Live sync", "142 neighbors joined", "Unlocks on Lush" | Dropped | No data, no rule |
| Task card "< 280 kWh baseline", "community bin station" | Reworded | No rule, no stations |
| Ballot: "Issue #09", first option preselected, cards past the sheet edge | Dropped, nothing preselected, fixed | No data, no vote pushing, layout bug |
| Voted screen: clipped vote title, "214 neighbors", "noticeboard", "from your cottage" | Wrap, 184 / 240, notification, dropped | Layout bug, one set of numbers, NOT-01 |
| Result: "Over 82%", committee signature, wrapped percent text, scrim that stops short | Computed numbers, dropped, one line, full scrim | No requirement, layout bugs |
| Reward unlocked: "Claim reward", plaque, certificate, "Reserved under Family Grove Account", kWh saved, "Grove Points", "Unlocked perk" box (clipped), glow | Dropped (glow becomes a blob) | No requirement, `design.md` |
| Place names Oakridge, Oakwood Grove, Cedar Grove, Elm & Oak, Meadow Lane | Neighbourhood name from data | Open question 21 |
| Scanner: filter pills beside the title, one unlabeled "RM" per month, leak marker on the electricity bar, red label | Pills on their own row, tap a month for amounts, marker on the water bar, warning tokens | Layout and clarity |
| Scanner: "Tariff Band A", "12% lower than similar homes", "Peak electricity", "Base water", weekend 13:00 to 16:00, room names and "Save ~RM 35/mo" in tips | Dropped or reworded | A monthly bill has no such data |
| Profile: summary row (Savings, Eco Points, Eco Rating), status pill on the hero, glow, strip behind the bell | Not built | PRO-01, `design.md` |
| Profile rows: "Account & Security", "Semi-D layout", "Connected Appliances" (clipped), "Daily Summary & Spike Alerts" | "Account", room count, "appliances", "Notifications" | No such data or settings |
| Tab bar icons differ between screenshots | One set | Consistency |

**From `screen_spec.md` text (S3, S7.2 to S7.4, S9, the My day timeline). Some rows are now confirmed by the screenshots above.**

| Item | Now | Why |
|---|---|---|
| Fast-forward floats over the canvas | Panel docks under the top area | Nothing sits on top of the floor plan |
| Mon to Sun day selector in the My day timeline | Weekdays \| Weekends toggle | SIM-07 |
| CO₂, "Tariff Band A", "12% lower than similar homes", weekend 13:00 to 16:00 AI example | Not in v1 (CO₂: open question) | No data |
| Committee signature, claim reward, plaque name, certificate, kWh saved | Not in v1 | No requirement |
| Live presence pill on Profile | Pill lives in the Resident sheet | PRO-01 rule 4 |
| Notification preferences row | Not in v1 | NOT-01 |
| Four onboarding steps in `design.md` | Three steps, residents in step 2 | `Workflow.md` W2 |
| Alert red `#B91C1C`, glow, uppercase overlines | `design.md` tokens, sentence case, no glow | `design.md` Forbidden list |

---

## 5. Open questions for you

1. **Google sign-in:** it is drawn on Login and Sign up. Keep it (then AUTH-01 must change and Supabase needs the Google provider) or remove it?
2. **Neighbourhood and "Use my location":** the street address is optional, so a sector cannot come from it. How is the sector made (State and City, postal code, a code the user enters)? And keep "Use my location" (needs a location permission and a library)?
3. **Floor plan style:** the screenshots are flat top-down. SIM-05 and `design.md` say 2.5D isometric. Which one?
4. **Edit Block controls:** Temperature, Timer, Fan speed, per-appliance kWh, and "Est. cost". Add to the requirements with a calculation rule (for example, Timer as hours on inside the block), or leave them out?
5. **Furniture tab:** is furniture decorative only (no watts, no bill effect), or is it out of v1?
6. **"Away" as a room in Add block:** keep it out (away is set in the schedule), or let it add an away range?
7. **"High usage" badge:** what makes a bill "high usage"? A threshold (for example the RM 500 solar line), or remove the badge?
8. **"Simulated Clock" slider and "RM 348 est." next to the forecast bill:** they appear on the My day screens. Is the clock a feature (the user sets the time of day for the avatar)? `Workflow.md` says the avatar uses the phone clock. Do you want to show the max bill next to the My day bill?
9. **Lights swap ("Full Home LED"):** SIM-02 is about star ratings. Give lights a star or LED rule?
10. **CO₂ prevented:** use a fixed factor (the screenshot implies 0.1 kg per item), or remove the card?
11. **Scan result:** add `material` and `tip` to the `classify_waste` output? Add "Suggest correction" (needs a feedback table), or leave it out?
12. **Voting window:** the screenshots show "4 days remaining", "Result arrives tomorrow", "Voting closes tonight at midnight", and results on Oct 28, but `Workflow.md` settles at month end. When does voting close and when are results shown?
13. **Reward claim:** the Reward unlocked screenshot draws "Claim reward", a plaque name, and a certificate. Is there a claim step, or is it out of v1 (as built here)?
14. **Solar "See how":** where does it go? (Open in `Workflow.md`.)
15. **Community numbers:** points target, household milestone, and sectors are still open (`Workflow.md` section 5).
16. **Community layout:** the screenshots show a letter look and a leaf look of the same tab. One scroll with both (as built here), or two modes (letter while a vote needs attention, leaf otherwise)?
17. **Living Leaf dial:** the screenshot says "1 / 2 deeds" with Lush at 2+. COM-03 caps points at 3 deeds a day. Does the dial count to 2 (Lush) or 3 (the cap)?
18. **Ballot options:** who defines the monthly reward options (title, line, place, date, image)? A table the team seeds, or something else?
19. **Profile:** the screenshot draws the status pill on the hero card and a row of three numbers (Savings, Eco Points, Eco Rating). PRO-01 rule 4 and the earlier decision keep the pill in the Resident sheet and drop the row. Keep both out?
20. **Scanner chart and AI tips:** (a) tap a month to see its two amounts, instead of one unlabeled "RM" per month? (b) May the AI name rooms and give an RM saving, or only general tips and tips about the household's own appliances?
21. **Neighbourhood name:** the screenshots use five different names. Is it one name per sector, taken from the address, and shown everywhere?

If you agree with the "Not in v1" items, I can also update `Feature_Requirements.md` and `design.md` so the three files match this one. `design.md` Unit 9 (title bar) and Unit 12 (Simulator layout, four onboarding steps) still differ from the screenshots.
