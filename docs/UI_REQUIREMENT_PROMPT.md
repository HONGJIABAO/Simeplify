# UI Requirement Prompt

Paste this whole file into your AI coding or UI tool. Attach `design.md`, `Feature_Requirements.md`, `Workflow.md`, and `screen_spec.md` with it.

---

## 1. Your role

You are a senior mobile UI engineer. Build the screens of **Simeplify / EcoTwin**, a home energy, waste, and bill app for Malaysian households.

Build the UI only. Use mock data. Do not connect Supabase or Gemini yet. Put mock data in one `mockData.ts` file so it is easy to replace later.

## 2. Inputs and which one wins

| File | Use it for |
|---|---|
| `design.md` | All look and feel. **It wins over `screen_spec.md` for anything visual.** |
| `Feature_Requirements.md` | What each feature must do |
| `Workflow.md` | Flows, states, and rules |
| `screen_spec.md` | Screen layout detail and example content only |

If a number is not decided (see `Workflow.md`, section 5), use a named constant with a `TODO` comment. Do not invent a value silently.

## 3. Tech

React Native (Expo), TypeScript, NativeWind, `react-native-reanimated`, `lucide-react-native` (stroke 1.5), `react-native-svg` for the floor plan (no 3D engine). Fonts: Lora (headings and numbers), Source Sans 3 (body). Mobile only, portrait, 360 to 430 px wide.

## 4. Design system in short

Mood: **Natural Organic**. Warm, earthy, calm, handmade. Slow and soft motion.

- Screen background `#faf6f1`. Screen padding `px-6`. Section gap `gap-8`. Item gap `gap-4`.
- Colors: `cream #faf6f1`, `paper #ffffff`, `brown #5c4033`, sage ramp (`sage-400 #8b9d77` main), tan ramp (`tan-400 #d4a373`), stone grays. Text `stone-600`, headings `stone-800`.
- Water data `sage-500`. Electricity data `tan-400`.
- Card: `bg-[#faf6f1] rounded-[2rem] border border-stone-200 p-6`.
- **Mini card (nested, one level only):** `bg-white rounded-[1.25rem] border border-stone-200 p-4`, no shadow.
- Buttons and inputs `rounded-full`. Primary `bg-stone-800 text-stone-50`. Accent `bg-[#8b9d77] text-stone-800`.
- Shadow: none, or `shadow-sm`. Motion: 300 to 700 ms ease-in-out. No bounce.
- Bottom tab bar: 5 fixed tabs, in order: Simulator, Bin, Community, Scanner, Profile.
- Header: plain, title on the left, bell on the right (`tan-600` dot when unread).

**Never use:** blue, purple, cyan as main colors, `#000000`, gradients, neon, glow, glassmorphism, `rounded-none`, big shadows, bounce, tiny uppercase labels above every heading, color as the only signal (always add an icon and text).

Accessibility: contrast 4.5:1, touch targets 48 × 48 px, text at least 12 px, font scaling to 130%, labels on every icon-only button, reduced motion supported.

## 5. Build order

1. `theme.ts` and `tailwind.config.js` with all tokens.
2. Shared components: `Button`, `Card`, `MiniCard`, `Input`, `Badge`, `BottomSheet`, `Toast`, `Slider`, `ProgressBar`, `ListItem`, `EmptyState`, `Skeleton`, `TabBar`, `Header`.
3. Screens, in the order of section 6.
4. A simple navigation file that links all screens, so every screen can be opened and checked.

Screens use only the shared components.

## 6. Screens to build

Build every screen listed here, with each state named.

### 6.1 Login and Sign Up
- Login: email, password, "Log in". States: default, wrong password (error text with icon), no internet (toast + retry).
- Sign up: email, password (min 8 characters), home address ("Where do you live?"). States: default, filled, email already used (message with a link to log in).
- No header, no tab bar.

### 6.2 Onboarding (one question per screen, no header, no tab bar)
Leaf-dot progress at the top. "Back" and "Next" at the bottom.
1. Schedule: not-at-home time ranges, weekdays and weekends, copy to other days. Error: end before start, overlap.
2. House layout: counts of living rooms, bedrooms, kitchens, bathrooms, residents (steppers).
3. Household size can sit with step 2 as in the spec.
4. Appliances: pick type, brand, model or wattage, 5-star rating picker with "Not sure", place on floor plan.

### 6.3 Simulator (fixed screen, does not scroll)
Layout, top to bottom: header, top row (bill card on the left, **round fast-forward button** on the right), fast-forward panel (only when open), floor plan, suggestion area, tab bar.

- **Bill card:** "Estimated monthly bill", `RM 1,234` in Lora, counts up or down in 700 ms. Tap opens the bill breakdown sheet (populated and empty states). A note shows when the bill is the max bill.
- **Fast-forward button (48 px, `stone-800`):** first tap opens the panel with the 1M / 6M / 1Y slider and "Save RM x"; second tap plays the animation. Icon changes: fast-forward, play, stop. Tap or drag during playback stops it. Letting go of the slider does not play. The panel closes on a tap outside or 10 s after the end.
- **Floor plan:** 2.5D isometric, hand-drawn look, draggable appliances, `sage-400` ring on tap. Read-only date pill and "Out · back at 18:00" label only. No buttons or cards on top.
- **Avatar:** one resident, poses: stand, walk, sit, lie, cook, shower. Leaves and returns through the door.
- **Home looks:** light on, light off, nobody home ("Energy saving" pill), appliance on, backdrop by time of day.
- **Fast-forward animation:** date pill counts forward, day and night cycle, avatar plays one weekday, 4 s / 6 s / 8 s. Reduced motion: skip and show the result.
- **Suggestion area (docked, no scrim), one at a time:** idle ("My day" button), first-time ("Start" / "Later"), Swap & Compare ("Try swap" / "Not now"), Solar (bill at or above RM 500, "See how" / "Later").
- **My day:** Quick setup bottom sheet (4 cards: sleep, sleeping aircon, evening, showers, each with the bill change line, "Skip" / "Next" / "Done"). Timeline bottom sheet (Weekdays | Weekends toggle, 24-hour strip, block list, expand to edit, away blocks locked, "Add block", "Save", "Reset to default"). Add and edit block sheets. Errors: overlap. Note: block inside away time.

### 6.4 Bin
- Camera view with a rounded viewfinder and a hint pill.
- Result sheet: bin icon, bin name, one tip line, "I threw it" button. Four bins: Paper, Plastic, Glass & Metal, General waste, each with icon and text.
- Low confidence: "Retake the photo". Camera permission denied: message and "Open settings". AI error: "Try again".
- Points card: monthly points, progress bar. "+10" confirmation after "I threw it".

### 6.5 Community (households only, one vote per household)
- Neighbourhood line (for example "Oakridge Commons • Sector 4B") and month name.
- **Living Leaf:** round dial, "1 / 3 deeds today", stage pill: Dry (0), Healthy (1), Lush (2 to 3), stage stepper. All three stages must be shown in the mock data.
- Monthly progress card: bar toward the target, mini cards for recycling points and energy points, "240 households contributing".
- "Recommended for you": horizontal task cards (Recycle 1 item, Upload a lower bill, Simulator action), each with To do / Done and a "Go to ..." button.
- Voting: new-letter state, ballot bottom sheet (reward cards, selected state with check), voted state (your vote mini card, turnout bar), month result announcement, reward unlocked (soft leaf animation, no confetti).

### 6.6 Scanner
- Home: upload card ("Take photo", "Upload PDF"), water anomaly alert area, monthly chart with filter (All / Electricity / Water) and a Trend line, AI Analysis card, archive list (newest first).
- **Water alert levels** (icon + text each): Normal (no alert), Minor drip (one tip line in the result, no banner), Leak detected (amber banner, "Anomaly detected", example "Water bill up 48% vs September"), Major pipe burst (terracotta top alert, advice to consider closing the main valve). Build all four in the mock data.
- Check-and-correct screen after reading a bill.
- Bill detail: file, values, status, history comparison, saved AI analysis, "Analyze again", delete with confirmation.
- AI Analysis card states: loading (skeleton, "Analyzing your bill..."), loaded, error ("Try again"), first bill (no history).

### 6.7 Profile
- Avatar face in a blob frame (tap opens the Resident sheet with the full avatar and a status pill), name, address, household line.
- List: Account, Address, Household, Appliances, Notifications, Log out.
- **No row of summary numbers** (money saved, total points, eco rating).

### 6.8 Notifications
- Today and Earlier groups, unread dot, "Mark all as read". Types: unusual water bill (Leak or Major only), voting is open, month result is ready. Empty state: "You are all caught up."

## 7. Mock data to use

Household: Mei Ling Tan, Petaling Jaya, 3 residents, Semi-D. Bills (RM): Jun 310, Jul 325, Aug 350, Sep 380, Oct 420. October water: 18 m³, +48% vs September (Leak detected). Estimated bill: RM 233 with My day answered, a higher max bill before. Points example: 340 / 500 (example numbers only, the real target is not decided).

## 8. Output format

- Give the file list first, then the code, one file at a time.
- After each screen, write a short note: which spec sections you used, and any `TODO` you left.
- If a rule is unclear or two files disagree, say so and follow section 2. Do not guess.

## 9. Self-check before you finish

- [ ] Every screen and state in section 6 exists and can be opened.
- [ ] Only shared components are used. Nested cards are one level and use the mini card style.
- [ ] Nothing from the "Never use" list appears.
- [ ] Every status has an icon and text, not color alone.
- [ ] Touch targets 48 px, text at least 12 px, reduced motion works.
- [ ] The Simulator never scrolls and nothing sits on top of the floor plan.
- [ ] The screen looks warm, earthy, and handmade at a glance.
