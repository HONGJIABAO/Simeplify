# AGENT.md

Instructions for AI coding agents working on this project (Simeplify / EcoTwin).
Read this file first. Then read the spec files listed below before you write code.

---

## 1. What the app is

A mobile app for Malaysian households. Five tabs:

| Tab | What it does |
|---|---|
| Simulator | 2.5D floor plan of the home, estimated electricity bill, appliance swap, solar suggestion, fast-forward savings, resident avatar, My day |
| Bin | Camera scan of waste. Gemini says which bin. Recyclable items give points. |
| Community | One vote per household per month, daily green deeds, Living Leaf, monthly points target |
| Scanner | Upload electricity and water bills, anomaly alert, AI analysis, bill archive |
| Profile | Account, address, household, appliances, schedule, log out |

Plus: Login / Sign Up, Onboarding, Notifications (bell in the header).

---

## 2. Source of truth (read these, do not guess)

| File | Use it for | Wins over |
|---|---|---|
| `Feature_Requirements.md` | What each feature must do. Feature IDs (AUTH-01, SIM-04, COM-03 ...). Tariff (Appendix A). Water alert levels (Appendix B). | Everything about behavior |
| `Workflow.md` | Step-by-step flows, data flow, points rules, who writes what, Open Items | Everything about flow and data |
| `design.md` | All UI rules: colors, fonts, spacing, components, motion, Forbidden list | `screen_spec.md` when they disagree |
| `screen_spec.md` | Screen-by-screen detail and example content | Nothing. Use it for layout detail only. |

Rules:

- If two files disagree, follow the order in the table (`design.md` over `screen_spec.md` for look, `Feature_Requirements.md` and `Workflow.md` for behavior).
- Do not guess a missing number. Check **Workflow.md, section 5 (Open Items)**. If the item is not decided, use a clearly named constant and a `TODO(open-item N)` comment. Do not invent a value silently.
- Mention the feature ID in commit messages and in file header comments (for example `SIM-04`).
- When you change behavior, update the matching md file in the same change.

---

## 3. Stack

- React Native with Expo, TypeScript.
- NativeWind (Tailwind classes). Tokens in `tailwind.config.js` and `theme.ts`.
- Backend: Supabase (Auth, Postgres with RLS, Storage, Edge Functions, pg_cron).
- AI: Gemini, only through Supabase Edge Functions. Model name is one config value.
- Animation: `react-native-reanimated`. Icons: `lucide-react-native` (stroke 1.5).
- Fonts: Lora (headings, numbers), Source Sans 3 (body).
- Floor plan: `react-native-svg` or Skia. **No 3D engine** (no three.js, no expo-gl).

---

## 4. Hard rules (never break)

**Security and data**

1. The app never calls Gemini directly. Always use an Edge Function. The API key lives in a Supabase secret, never in the app or in git.
2. **Points and deeds are written only by the database or an Edge Function**, never by the app. This includes recycling points, energy points, and green deeds.
3. Every table has Row Level Security. A user can read and write only their own household data.
4. Do not send the AI more than it needs. The AI must never invent RM amounts or percents. Every number in AI text comes from numbers the app or Edge Function calculated.
5. "Try swap" in the Simulator lives in memory only. Do not save it.
6. Onboarding saves after each step. Resume at the first step that is not done.

**Logic**

7. The bill is calculated on the device. Presence (away time) always wins over My day. Before any My day answer, use the "max" bill. See `Workflow.md` 3a.
8. The fast-forward animation only shows a number. It never changes it, and it reads and writes no data.
9. The avatar is only a picture of the data. It never changes the bill.
10. Water alert level = the higher of the MoM level and the volume level. The bill amount (RM) does not decide the level. See Appendix B.
11. The alert level is decided by app rules. The AI only explains it.
12. Max 3 green deeds per household per day give points. Day = Malaysia time (Asia/Kuala_Lumpur).
13. One vote per household per month. Voting uses no points.
14. Energy points (+50) once per billing month, even if the same month is uploaded again.
15. Keep tariff values (including AFA) in `tariff_rates`, not in code.

**UI** (full list in `design.md`, Unit 15 Forbidden)

16. Mood: Natural Organic. Warm, earthy, calm.
17. Never use: blue, purple, or cyan as a main color; `#000000`; gradients; neon; glow; glassmorphism; `rounded-none`; `shadow-lg` and bigger; bounce or elastic motion; tiny uppercase tracked labels above every heading.
18. Cards: `bg-[#faf6f1] rounded-[2rem] border border-stone-200 p-6`. Nested cards are allowed **one level only**, using the mini card style (`bg-white rounded-[1.25rem] border border-stone-200 p-4`, no shadow).
19. Buttons and inputs are `rounded-full`. Touch targets at least 48 × 48 px. Text at least 12 px.
20. Color never carries meaning alone. Always add an icon and text.
21. Motion: 300 to 700 ms, ease-in-out. Check `AccessibilityInfo.isReduceMotionEnabled` and turn movement off when it is on.
22. Money format: `RM 1,500`. Water uses `sage-500`. Electricity uses `tan-400`.
23. Build shared components first (`Button`, `Card`, `MiniCard`, `Input`, `Badge`, `BottomSheet`, `Toast`, `Slider`). Screens use only these.

---

## 5. Easy-to-miss behavior

- **Simulator layout is fixed:** header, then bill card (left) and the round fast-forward button (right), then the floor plan, then the suggestion area, then the tab bar. The fast-forward panel opens under the top row and pushes the floor plan down. It never covers the floor plan.
- **Fast-forward button:** first tap opens the 1M / 6M / 1Y selector. Second tap plays. Letting go of the slider does not play. Tap or drag during playback stops it. Icon changes: fast-forward, play, stop.
- **Suggestion area:** one suggestion at a time, no scrim, floor plan stays tappable. A closed Solar suggestion does not return in the same session.
- **Water alert levels:** Normal (no alert), Minor drip (tip line only), Leak detected (amber banner + notification), Major pipe burst (terracotta top alert + notification). Demo: 18 m³ and +48% gives Leak detected.
- **Living Leaf:** Dry (0 deeds), Healthy (1), Lush (2 to 3). Resets at midnight, Malaysia time.
- **Profile:** no row of summary numbers (money saved, total points, eco rating). It was removed.
- **Notifications:** in-app list only. No push messages in version 1.

---

## 6. Suggested folder layout

Adjust to the real repo. Keep one folder per tab.

```
app/                    Expo Router screens (tabs: simulator, bin, community, scanner, profile)
components/             Shared UI (Button, Card, MiniCard, Input, Badge, BottomSheet, Toast, Slider)
features/
  simulator/            floorplan, avatar, billCalc, myDay, fastForward
  bin/
  community/            livingLeaf, voting, dailyTasks
  scanner/              billUpload, anomaly, aiAnalysis
  profile/
lib/                    supabase client, theme.ts, formatters (money, dates)
supabase/
  migrations/           tables + RLS
  functions/            classify_waste, confirm_disposal, read_bill, analyze_bill, award_energy_points
docs/                   the four md spec files
```

Keep the pure logic (bill calculation, water alert level, deed counting) in plain TypeScript functions with no UI imports, so it is easy to test.

---

## 7. Commands

Fill in or correct these for the real repo.

```bash
npm install
npx expo start            # run the app
npx tsc --noEmit          # type check
npm test                  # unit tests (bill calculation, water level, deed cap)
npx supabase start        # local Supabase
npx supabase db reset     # apply migrations
npx supabase functions serve
```

---

## 8. Tests to write first

These have clear rules in the docs, so test them before the UI:

1. **Bill calculation** (`Feature_Requirements.md` Appendix A): kWh to RM with TNB tariff, with and without AFA, below and above 600 and 1,500 kWh.
2. **Presence and My day:** away slots turn off person-dependent appliances. Before My day, max bill. After My day, only the active block's appliances.
3. **Water level** (Appendix B): rounding of MoM percent, scaling by residents, first bill with no last month, 18 m³ and +48% gives Leak detected, +100% gives Major.
4. **Deed cap:** the 4th deed of the day gives 0 points. Leaf stage by deed count.
5. **Energy points:** once per billing month, even when the same month is saved again.

---

## 9. How to work

- Small steps. One feature ID per change.
- Before you start a screen, list which spec sections you are using.
- If a rule is unclear or an Open Item blocks you, stop and ask. Do not fill the gap with a guess.
- Do not add libraries, fonts, or colors that are not in `design.md` without asking.
- Every loading, empty, and error state uses the patterns in `design.md` (skeleton, empty state, toast).

## 10. Work in stages
- Do only the stage I name in my message. Do not start the next stage.
- After each stage, run tsc, lint, and tests, report, and stop.
- Every stage ends with something I can open and check