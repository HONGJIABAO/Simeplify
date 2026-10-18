# App Design Standards

Style: **Natural Organic**. Warm, earthy, calm.
Stack: React Native (Expo) + NativeWind. Backend: Supabase.
Apps covered: Simulator, Bin, Community, Scanner, Profile.

This file is the single source of truth for UI. Follow it exactly. No style drift.

---

## Unit 1: Design Principles

- Natural harmony: colors and shapes come from nature.
- Warm and safe: the user should feel calm, not pushed.
- Handmade feel: no cold, industrial, or high-tech look.
- Slow and soft: motion feels like growth, not speed.
- Rules in "Forbidden" (Unit 15) always win over any other rule.

---

## Unit 2: Global Layout

- Mobile only. Portrait. Design for 360–430 px width.
- Screen horizontal padding: `px-6` (24 px).
- Safe areas: always wrap screens in `SafeAreaView`.
- Bottom padding on scroll screens: `pb-28` (112 px), so content does not hide behind the tab bar.
- Screen background: `bg-[#faf6f1]`.
- One scroll direction per screen (vertical). Horizontal scroll only for small card rows.

---

## Unit 3: Typography

| Role | Font | Notes |
|---|---|---|
| Headings | **Lora** (serif) | `tracking-tight` |
| Body | **Source Sans 3** (sans) | comfortable line-height |
| Numbers (bills, points) | Lora | big, calm numbers |
| Mono | system mono | only for codes |

Do not use: Inter, Roboto, Geist, Fraunces, Plus Jakarta Sans.

Load with `@expo-google-fonts/lora` and `@expo-google-fonts/source-sans-3`.

| Style | Size | Weight |
|---|---|---|
| Hero number (e.g. monthly bill) | 40 px | Lora SemiBold |
| H1 | 28 px | Lora SemiBold |
| H2 | 22 px | Lora SemiBold |
| H3 | 18 px | Lora Medium |
| Body | 15 px | Source Sans Regular |
| Small | 12–13 px | Source Sans Regular |

- Body line-height: 1.5.
- Body text color: `stone-600` (#57534e). Heading color: `stone-800` (#292524).
- Max about 65–75 characters per line.
- Minimum text size: 12 px.

---

## Unit 4: Color Palette

### Core tokens

| Token | Hex | Use |
|---|---|---|
| `cream` | #faf6f1 | Screen and card background |
| `paper` | #ffffff | Inputs, secondary surfaces |
| `brown` | #5c4033 | Primary brand, strong accents |
| `sage-400` | #8b9d77 | Main accent |
| `tan-400` | #d4a373 | Secondary accent |
| `stone-800` | #292524 | Primary text, primary button |
| `stone-600` | #57534e | Body text |
| `stone-400` | #a8a29e | Placeholder, muted icon |
| `stone-300` | #d6d3d1 | Secondary button border |
| `stone-200` | #e7e5e4 | Card and input border |
| `stone-100` | #f5f5f4 | Hover / pressed fill |

### Sage ramp (green, light → dark)

`sage-50 #f1f4ee` · `sage-100 #e0e6d9` · `sage-200 #c5d0b9` · `sage-300 #a8b896` · `sage-400 #8b9d77` · `sage-500 #6f8260` · `sage-600 #566549`

- `sage-50/100`: soft fills, active tab fill, success badge.
- `sage-400`: main accent, progress bars, slider fill.
- `sage-600`: deep green. Used for the "verdant tint" on pressed text/icons.

### Tan ramp (warm, light → dark)

`tan-100 #f6e8d8` · `tan-300 #e6c39b` · `tan-400 #d4a373` · `tan-600 #a97a4a`

- Used for suggestion pop-ups (swap, solar), reward highlights, and chart bars.

### Status colors (earthy, never neon)

| State | Background | Text / icon |
|---|---|---|
| Success | `sage-100` #e0e6d9 | `sage-600` #566549 |
| Warning | `amber-50` #fffbeb | #92600e |
| Error | #fbece8 | #a8442f (terracotta) |
| Info | `stone-100` #f5f5f4 | `stone-600` |

### Usage rules

- Text on `sage-400` or `tan-400` backgrounds uses `stone-800`. Never white.
- Never use pure black `#000000`. Darkest allowed: `stone-800`.
- Never use blue, purple, or cyan as a main color.
- Water data uses `sage-500`. Electricity data uses `tan-400`. Do not use blue for water.
- No gradients.

---

## Unit 5: Shape, Border, Shadow

| Item | Value |
|---|---|
| Card radius | `rounded-[2rem]` (32 px) |
| Button / input / badge radius | `rounded-full` |
| Image radius | 24–32 px, or a soft blob shape |
| Border | 1 px, `stone-200` |
| Shadow default | none |
| Shadow raised (cards, sheets) | `shadow-sm` only |
| Shadow max | `shadow-md` (pressed or open sheet) |
| Focus ring | `ring-2` `stone-300` |

- Allowed shapes: rounded, soft, slightly irregular (blob).
- Not allowed: sharp corners, `rounded-none`, `rounded-sm`, `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- Blob shapes: use for decorative background shapes, mascot spots, and empty-state art. Example radii: `borderTopLeftRadius: 48, borderTopRightRadius: 32, borderBottomRightRadius: 56, borderBottomLeftRadius: 36`.
- No nested cards. A card never contains another card. Use dividers or spacing inside a card.

---

## Unit 6: Spacing

| Token | Value |
|---|---|
| Screen padding | `px-6` |
| Section gap | `gap-8` (32 px) |
| Card padding | `p-6` (24 px) |
| Gap between items | `gap-4` (16 px) |
| Small gap | `gap-2` (8 px) |
| Min touch target | 48 × 48 px |

---

## Unit 7: Motion

- Style: slow, soft, like plants growing.
- Duration: **300–700 ms**. Easing: ease-in-out.
- Use `react-native-reanimated` with `Easing.inOut(Easing.ease)`.
- Press: sink slightly (`translateY: 2`) and fill goes to `stone-100`. `active:scale-95` on buttons.
- Text and icons shift slowly toward `sage-600` when pressed or active.
- Pop-ups fade and rise gently (500 ms).
- Numbers (bill, savings) count up over 700 ms.
- No bounce. No elastic. No spring overshoot.
- The avatar and the fast-forward animation use the same slow easing. With reduced motion on, the avatar stays still and the fast-forward is skipped.
- **Reduced motion:** check `AccessibilityInfo.isReduceMotionEnabled`. If on, turn off movement and use simple fades or no animation.

---

## Unit 8: Icons and Imagery

- Icon set: `lucide-react-native`, stroke width 1.5, rounded caps.
- Preferred themes: leaf, sprout, tree, sun, drop, recycle, home, plug, receipt.
- Default icon color: `stone-600`. Active: `sage-600`.
- Illustrations: hand-drawn feel, earth tones, plants and leaves.
- Optional soft paper texture on large backgrounds (low opacity image, under 5%).
- Every icon-only button needs an accessibility label.

---

## Unit 9: Header (Top Bar)

- Not fixed with blur. Plain `bg-[#faf6f1]`. No glassmorphism.
- Padding: `px-6 py-4`.
- Left: screen title (H2, Lora).
- Right: small round icon button for notifications (dot indicator in `tan-600` when unread). Tapping it opens the Notifications screen.
- Back arrow on sub-pages. No header on Onboarding.

---

## Unit 10: Bottom Navigation

- Fixed at the bottom. Pill container: `rounded-full`, `bg-[#faf6f1]`, 1 px `stone-200` border, `shadow-sm`. Float 16 px above the bottom safe area.
- Padding: `px-2 py-2`.
- **5 tabs, fixed order:**
  1. Simulator (home icon)
  2. Bin (recycle icon)
  3. Community (users / sprout icon)
  4. Scanner (receipt icon)
  5. Profile (user icon)
- Each tab: icon (24 px) + label (12 px).
- Active tab: `sage-100` pill fill, icon and label `sage-600`.
- Inactive tab: `stone-600`.
- Tab change animation: 300 ms fill fade.
- Hidden on: Onboarding, Login, camera full screen.

---

## Unit 11: Core Components

### Button

All buttons include: `px-6 py-3 rounded-full font-medium transition-colors duration-300`.

| Type | Style |
|---|---|
| Primary | `bg-stone-800 text-stone-50` |
| Secondary | `bg-transparent text-stone-800 border border-stone-300` |
| Accent | `bg-[#8b9d77] text-stone-800` (use for main reward / confirm actions) |
| Disabled | `bg-stone-200 text-stone-400` |

- Pressed: `bg-stone-100` (secondary) or slightly lighter (primary), sink 2 px.
- Loading: replace label with a small leaf spinner (slow rotation).

### Card

All cards include: `bg-[#faf6f1] rounded-[2rem] border border-stone-200 p-6`.

- Optional `shadow-sm`.
- Highlight cards (suggestions) use `bg-tan-100` with a `tan-300` border.
- Title uses Lora. Body uses Source Sans.

### Input

All inputs include: `px-5 py-3 bg-white border border-stone-200 rounded-full text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition-all duration-300`.

- Label above the input, 13 px, `stone-600`.
- Error: border `#a8442f`, helper text below in terracotta. Include an icon, not only color.

### Badge

- `rounded-full`, `px-3 py-1`, 12 px, font-medium.
- Backgrounds: `sage-100`, `tan-100`, or `stone-100`.

### Bottom Sheet / Pop-up

- Slides up from the bottom over a soft scrim (`stone-800` at 40% opacity).
- Top radius 32 px. Background `cream`. `shadow-md`.
- Drag handle: short rounded bar, `stone-300`.
- Primary action = Primary or Accent button. Dismiss = Secondary button.
- Open and close: 500 ms ease-in-out.

### Toast

- Appears at the top, `rounded-full`, uses status colors from Unit 4.
- Shows icon + short text. Auto-hides after 3 s.

### Slider

- Track: `stone-200`, 8 px high, rounded.
- Filled part: `sage-400`.
- Thumb: 28 px, `cream` fill, 2 px `sage-600` border, `shadow-sm`.
- Value label above thumb in a small `sage-100` badge.

### Progress bar

- 10 px high, rounded, track `stone-200`, fill `sage-400`. Animate 700 ms.

### List item

- Row inside a card. Divider: 1 px `stone-200`. Left icon, title, right value or chevron.

### Empty state

- Soft blob illustration (plant, leaf), H3 title, one line of body text, one button.

---

## Unit 12: Screen Patterns by Feature

### 1. Onboarding

- One question per screen. Large Lora question, simple inputs.
- Steps: Daily schedule → House layout (rooms) → Household size → Appliances.
- Progress: a row of small leaf dots at the top.
- Buttons: "Back" (secondary) and "Next" (primary) at the bottom.
- Appliance step: pick from a list, then brand, model, and a 5-star rating picker (with "Not sure"). Filled stars use `tan-400`. Empty stars are a `stone-300` outline.

### 2. Simulator

**Screen layout (top → bottom, fixed order):**

```
[ Header                                   ]
[ Bill card (left) ][ Time slider (right)  ]
[                                          ]
[            Floorplan area (center)       ]
[                                          ]
[ Suggestion area (docked at the bottom)   ]
[ Bottom tab bar                           ]
```

- The Simulator is a fixed screen. It does not scroll. Use `flex-1` for the floorplan so it fills the space between the top row and the suggestion area.
- Outer padding: `px-6`. Gap between all blocks: `gap-4`.
- Do not move, swap, or hide these four blocks. Only the suggestion area can be empty.

**1. Bill card (top left)**
- Width: half of the row (`flex-1`), `gap-4` from the slider card.
- Uses the standard Card style (`bg-[#faf6f1] rounded-[2rem] border border-stone-200`), with `p-4` because the card is small.
- Label: "Estimated monthly bill" (12 px, `stone-600`).
- Hero number: Lora, 28 px (smaller than the normal 40 px so it fits). Format `RM 1,234`.
- Tan accent: small `tan-400` leaf or plug icon next to the label.
- When the bill changes (swap or solar), the number counts up or down over 700 ms.

**2. Time slider (top right)**
- Width: half of the row (`flex-1`). Same Card style and `p-4`.
- Label: "Fast-forward" (12 px, `stone-600`).
- Slider: use the Slider component from Unit 11, with 3 stops: **1M · 6M · 1Y**. Stop labels are 12 px under the track.
- Value badge (`sage-100`) shows the selected period.
- Savings result: one line under the slider, e.g. "Save RM 1,500" in `sage-600`, Lora 18 px. It counts up over 700 ms.
- Default: "1M" selected.
- Playback: when the user lets go of the slider, the fast-forward animation plays (see 3c). The savings number counts up with the calendar.

**3. Floorplan area (center)**
- Large rounded canvas: `rounded-[2rem]`, `bg-white`, 1 px `stone-200` border. Fills all remaining height.
- Warm wood, plant, and paper tones inside. No neon or glowing effects.
- View style: **2.5D isometric**, hand-drawn look, flat shapes with soft shading. No real 3D engine. Rooms are isometric tiles. Appliances are flat isometric icons you can drag.
- Appliance tap: the tapped item gets a `sage-400` soft ring.
- Do not put cards or buttons on top of the canvas. Pop-ups go to the suggestion area. The only things allowed on the canvas are read-only labels (the date label and the "Out · back at" label below). They cannot be tapped.

**3a. Resident avatar**
- One avatar for the household. Hand-drawn, rounded, soft. About 32 px tall on a 390 px wide screen.
- Outline: `brown` #5c4033, 2 px, round caps. Never black.
- Colors: skin `tan-300`, hair `brown`, top `sage-400`, bottom `tan-600`. Flat fills. No gradients, no shine, no glow.
- Face: two small dots and a small curve in `brown`.
- Ground shadow: a soft ellipse in `stone-300` at 40% opacity.
- Poses: stand, walk, sit (TV), lie (sleep), cook (kitchen), shower (stands with a small drop icon in the bathroom).
- Walking: slow bob (up and down 2 px, 500 ms, ease-in-out). No bounce.
- Moving between rooms: walks along the isometric floor, 700 to 1000 ms.
- Leaving home: walks to the front door and fades out in 700 ms. A read-only pill near the door says "Out · back at 18:00" (`tan-100`, 12 px). Coming home: fades in at the door and walks in.
- The avatar is not tappable.

**3b. Home and day look** (no glow, no dark or blue tones)

| State | Look |
|---|---|
| Light on, someone in the room | Floor tile `tan-100`, lamp icon filled `tan-400` |
| Light off, room empty | Floor tile `stone-100` |
| Nobody home (energy saving) | Whole home covered with a soft `stone-100` layer (40%). All lights off. Only always-on appliances (fridge, router) show a small `sage-400` dot. A `sage-100` pill near the door says "Energy saving". |
| Appliance on | Small `sage-400` dot on its icon |

Backdrop behind the rooms (changes with the clock, 500 to 700 ms fades):

| Time | Color |
|---|---|
| 07:00 – 09:00 | `tan-100` |
| 09:00 – 17:00 | `cream` |
| 17:00 – 19:00 | `tan-300` at 40% |
| 19:00 – 07:00 | `stone-300` (warm gray) |

**3c. Fast-forward animation**
- Starts when the user lets go of the time slider on 1M, 6M, or 1Y.
- A read-only date pill at the top center of the canvas (`cream`, Lora 14 px). It starts at today and counts forward fast to the end date. The speed slows down in the last 20%.
- The backdrop cycles through the day colors above, one cycle for each avatar loop.
- The avatar plays one typical weekday: leaves, the home turns energy-saving, the avatar comes back, lights come on, the avatar goes to bed. One loop is about 1.2 s.
- Total time: 4 s (1M), 6 s (6M), 8 s (1Y).
- The savings number in the slider card counts up with the calendar and stops at the total when the date pill reaches the end date.
- Dragging the slider again stops the animation and starts a new one.
- Reduced motion: no animation. Show the last date and the final savings. The avatar stays still.

**4. Suggestion area (bottom, just above the tab bar)**
- Docked panel, 16 px above the bottom tab bar. Full width inside `px-6`.
- Style: `bg-tan-100`, `rounded-[2rem]`, 1 px `tan-300` border, `shadow-sm`, `p-6`.
- Exception to the Bottom Sheet rule (Unit 11): **no scrim** and no drag handle. The floorplan stays visible and tappable.
- Slides up from behind the tab bar in 500 ms (ease-in-out). Closes the same way. Reduced motion: fade only.
- Only one suggestion shows at a time. When it is closed, the floorplan grows back to full height.
- Idle state: when no appliance is selected and no suggestion shows, the area shows a slim row with one Secondary button, "My day". It is not a card.
- First time (before the user answers any My day question): the area shows "Answer a few quick questions to make your bill more accurate." with "Start" (Accent) and "Later" (Secondary).
- **Swap & Compare:** appears when the user taps an old appliance that is used often. Shows old vs new, and the saving (e.g. "Save RM 80/month"). Buttons: "Try swap" (Accent), "Not now" (Secondary).
- **Solar:** appears automatically when the bill is RM 500 or more. Sun icon, text about saving up to 40%. Buttons: "See how" (Accent), "Later" (Secondary).
- If the user closes the Solar suggestion, it does not come back in the same session.

**5. My day (Quick setup and timeline)**

*Quick setup* (full-height Bottom Sheet, one card per step)
- Leaf dots at the top (like Onboarding). One big question per step (H2, Lora).
- Answers are pill option rows (selected row: `sage-100` fill and a check icon). Times use pill options plus "Other", which opens a time wheel. Switches use the standard toggle. Steppers use the Onboarding stepper. No typing.
- Under the question, one line shows the bill change, for example "Bill: RM 260 → RM 235" (Body 13 px, with an arrow icon). A lower bill is in `sage-600`. The text always has the numbers, never color alone.
- Buttons at the bottom: "Skip" (Secondary) and "Next" (Primary). The last card has "Done" (Accent).

*Timeline* (full-height Bottom Sheet titled "My day")
- Top: a toggle "Weekdays | Weekends" (only the away blocks change) and a thin read-only 24-hour strip (12 px high, rounded) that shows the blocks in a row.
- Below: a vertical list of blocks in time order. No nested cards. Each block is a List item with the time range, name, room, and small icons for the appliances that are on.
- Block fills (always with a text label): sleep `stone-200`, meals `tan-100`, evening `sage-100`, shower `sage-50`, away `stone-100` with a lock icon.
- Tap a block: it expands in place. It shows start and end time pickers and a switch for each appliance in that room. A shower block shows "Minutes per shower" (stepper, 5 to 30).
- Away blocks are locked. They show a text button "Edit schedule".
- Buttons: "Add block" (Secondary) at the end of the list, "Save" (Accent), and "Reset to default" (Secondary) at the bottom.
- A block inside away time shows a small amber note: "You are away at this time. This block will not be counted." This is a note, not an error.
- Overlapping blocks show an error under the block: "This overlaps with {name}."

### 3. Bin

- **Scanner view:** full-screen camera. Rounded viewfinder frame (soft corners, `cream` stroke, 3 px). Hint text on a `stone-800` 60% pill.
- **Result sheet:** large bin icon in the bin's color, bin name in H2, one line of tip. Use earthy bin colors only (sage, tan, brown, stone). Always add a text label, never color alone.
- Four bin types. Always show the icon and the text label, never color alone:

| Bin | Color | Text color |
|---|---|---|
| Paper | `tan-400` | `stone-800` |
| Plastic | `sage-300` | `stone-800` |
| Glass & Metal | `brown` #5c4033 | `stone-50` |
| General waste | `sage-600` | `stone-50` |
- **Points card:** monthly points as a hero number + progress bar.

### 4. Community

- **Voting card list:** each reward is a card (image, title, short text, vote button). Selected card gets `sage-100` fill and a check icon.
- **Points board:** household points, progress bar toward the monthly reward, and a split of recycling points and energy points.
- **Reward unlocked:** soft leaf animation, no confetti.

### 5. Scanner (Bill Analyzer)

- **Upload area:** large dashed-feel soft card (use a 1 px `stone-300` border, rounded). Buttons: "Take photo", "Upload PDF".
- **Result card:** usage vs normal range, with a status badge (Normal / High).
- **Anomaly alert:** warning style (amber). Example: "Water bill up 200%. Check for leaks." Include an icon and text.
- **Chart:** monthly bars. Electricity = `tan-400`. Water = `sage-500`. Show values as text labels too. A filter row (All / Electricity / Water) uses pill option rows; the selected one has a `sage-100` fill. A one-sentence "Trend" line (Body, `stone-600`) sits under the chart.
- **Archive list:** bills by month, thumbnail + amount + badge.
- **AI Analysis card** (result screen and Bill Detail): standard Card with a leaf icon (not a sparkle or robot icon) and the title "AI Analysis" in Lora. Parts: summary (Body), history table (2 columns: label and value, each with an up or down arrow icon and text, never color alone), "Why" list, "Try this" list (each tip has a small leaf icon), and a 12 px footer note. Parts are separated by 1 px `stone-200` dividers. No nested cards.
- AI Analysis loading: skeleton lines and the text "Analyzing your bill..." (slow pulse). Error: amber note with a Secondary button "Try again".
- On Scanner home, the latest bill card shows only the first line of the analysis.

### 6. Profile

- Profile picture: the resident avatar's face in a soft blob frame (`sage-100` fill, 1 px `stone-200` border). Tapping it opens the Resident sheet: a small Bottom Sheet with the full avatar (about 120 px tall, slow breathing idle, 700 ms ease-in-out) and a status pill ("At home · Living room" in `sage-100`, or "Out · back at 18:00" in `tan-100`). Same avatar style as the Simulator (Unit 12, 3a). No buttons in the sheet. Reduced motion: no breathing.
- Name, address.
- List items: Account, Address, Household, Appliances, Notifications, Log out.
- Log out uses Secondary button.

### 7. Notifications

- Opened from the bell icon. Back arrow and title in the header, text button "Mark all as read".
- List grouped as Today and Earlier. Each row is a List item: icon, title, short text, time, and a `tan-600` dot if unread.
- Empty state: leaf illustration and "You are all caught up."

---

## Unit 13: Data Display Rules

- Money: `RM 1,500`. Use thousands separator. Hero numbers in Lora.
- Savings text uses `sage-600`. Costs use `stone-800`.
- Never use red/green alone to show good or bad. Add icon + text.
- Charts: rounded bar tops, no gradients, no heavy gridlines (`stone-200`, 1 px).
- Loading: soft skeleton blocks in `stone-100` with slow pulse (700 ms).

---

## Unit 14: Accessibility

- Text contrast at least 4.5:1 (WCAG AA).
- Touch targets at least 48 × 48 px.
- Every interactive element has an accessible label and a visible focus/pressed state.
- Color never carries meaning alone.
- Support Dynamic Type / font scaling up to 130%.
- Respect reduced motion (see Unit 7).

---

## Unit 15: Forbidden

Never use:

- Cool main colors: blue, purple, cyan (`bg-blue-*`, `bg-purple-*`, `bg-cyan-*`).
- Pure black `#000000` or `text-black`.
- `rounded-none`, `rounded-sm`, sharp boxes.
- `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- Gradients (`bg-gradient-*`) and gradient text.
- Neon or high-saturation colors.
- Glassmorphism or blur as a default surface.
- Nested cards.
- Side-stripe accent borders (thick left/right border).
- Bounce or elastic animation.
- High-tech look: glow, grid lines, futuristic fonts.
- Tiny uppercase tracked labels above every heading.
- Gray text on colored backgrounds.

---

## Unit 16: Implementation Notes (React Native)

- Use **NativeWind** so Tailwind classes in this file work directly.
- Put all tokens in `tailwind.config.js` (`cream`, `brown`, `sage-*`, `tan-*`) and in `theme.ts` for non-class use.
- Shadows in RN: `shadow-sm` → `{ shadowColor: '#5c4033', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: {width:0,height:1}, elevation: 1 }`. Use a brown shadow color, not black.
- Build shared components first: `Button`, `Card`, `Input`, `Badge`, `BottomSheet`, `Toast`, `Slider`. Screens only use these.
- Supabase status (loading, empty, error) must use the empty-state and toast patterns above.
- Floor plan: draw the 2.5D isometric view with `react-native-svg` or Skia. Do not use a 3D engine (no three.js or expo-gl).

---

## Unit 17: Self-Check Before Shipping

- [ ] Buttons have `px-6 py-3 rounded-full font-medium` and a 300 ms transition.
- [ ] Cards have `bg-[#faf6f1] rounded-[2rem] border border-stone-200`.
- [ ] Inputs match Unit 11.
- [ ] Headings are Lora. Body is Source Sans.
- [ ] No item from Unit 15 appears.
- [ ] Contrast and touch targets pass.
- [ ] Reduced motion works.
- [ ] The screen still looks warm, earthy, and handmade at a glance.
