# Implementation Review Prompt: Simeplify / EcoTwin

Paste this whole file into your AI coding agent after the UI is built.

---

Review the implementation against `frontend/docs/SCREEN_SPEC.md`, `frontend/docs/DESIGN.md`, and `frontend/docs/UI_REQUIREMENTS.md`.

List:

1. What matches well.
2. What still differs from the screen spec.
3. The smallest changes needed to improve the match.

**Do not edit files yet.**

---

## How to review

**Read-only.** Do not edit, create, delete, format, or install anything. You may run read-only checks to collect evidence: `npx tsc --noEmit`, `npx expo lint`, `npm test`, and `rg` searches. Do not run a formatter with auto-fix.

Which file is which:

| File | Role |
|---|---|
| `SCREEN_SPEC.md` | The refined page-by-page spec (`page_refined.md`, screens S1 to S9). It wins for layout, content, copy, and states. It already lists what was dropped on purpose (section 4) and what is still open (section 5). |
| `DESIGN.md` | Colors, fonts, radius, spacing, motion, components, and the Forbidden list (Unit 15). It wins for anything visual. |
| `UI_REQUIREMENTS.md` | Build order, tech, shared components, the screen list, and the self-check (section 9). |
| `AGENT.md`, `Feature_Requirements.md`, `Workflow.md` | Behavior rules. Use them only when a screen needs a behavior check (bill, water level, deeds, fast-forward). |
| `screen_spec.md` (older) | Do not review against it. Use it only for screens `SCREEN_SPEC.md` lists as "not seen yet". |

If `SCREEN_SPEC.md` and `DESIGN.md` disagree, `SCREEN_SPEC.md` has already recorded the choice (see its section 0 and section 4). Do not report a deliberate choice as a mismatch. Report it only if the code does not follow it.

Do **not** count these as defects. They are decided, or open on purpose:

- Anything marked "Not in v1" or "Dropped" in `SCREEN_SPEC.md` (for example Claim reward, the Profile summary row, "Tariff Band A", the Edit Block temperature, timer, and fan speed controls). Their **absence** is correct.
- Open items behind a named constant with `TODO(open-item N)` (Google sign-in, floor plan style, Furniture tab, High usage badge, CO₂ card, voting window, leaf dial cap). Check that the constant exists and that the default matches `frontend_Implementation.md` section 9. Do not argue for another value.
- Mock data and mock services. Check that they are isolated in `lib/mockData.ts` and `lib/services/`, not that they are real.

## What to check

Go screen by screen through `SCREEN_SPEC.md` section 2 (S1 to S9) and each state it names. For each screen, check the screen against the spec and against `DESIGN.md`.

**Spec match (`SCREEN_SPEC.md`)**
- Layout order, blocks, and copy. No title bar on Simulator, Bin, Community, Profile. Scanner title block. Sub-page back arrow and title.
- Every state listed for the screen exists and can be opened (dev gallery).
- Items the spec says to drop are absent, and items it says to keep are present.
- Layout bugs the spec lists are not copied (clipped text, cards past a sheet edge, a stray chevron, scrim that stops short).
- Simulator: fixed screen, nothing over the floor plan, the fast-forward panel pushes the plan down, the two-tap fast-forward behavior, the suggestion area shows one card at a time.
- Counts and numbers come from the mock data and logic, not typed in the screen (RM amounts, percents, deeds, turnout).

**Design match (`DESIGN.md`)**
- Tokens: colors, Lora and Source Sans 3, card radius 32, mini card style and one nesting level, `rounded-full` buttons and inputs, shadow none or `shadow-sm` with the brown color.
- Shared components are used instead of one-off styles. Screens do not define their own button or card.
- Forbidden list (Unit 15): no blue, purple, cyan, `#000000`, gradients, glow, glassmorphism, `rounded-none`, big shadows, bounce, uppercase tracked labels, side-stripe borders, deeper nesting.
- Motion 300 to 700 ms ease-in-out, reduced motion respected.
- Accessibility: touch targets 48 px, text 12 px or more, labels on icon-only buttons, font scaling to 130%, color never the only signal (icon and text).

**Requirements match (`UI_REQUIREMENTS.md`)**
- Shared components exist: `Button`, `Card`, `MiniCard`, `Input`, `Badge`, `BottomSheet`, `Toast`, `Slider`, `ProgressBar`, `ListItem`, `EmptyState`, `Skeleton`, `TabBar`, `Header`.
- Build rules: mock data in one `mockData.ts`, a navigation file or gallery that opens every screen, no Supabase or Gemini calls, no library outside the approved list.
- Section 9 self-check, item by item.

## Output format

Use exactly these three headings.

### 1. What matches well
Short bullets, grouped by screen or area. Name the file for each point. Only list things you checked.

### 2. What still differs from the screen spec
A table. One row per difference.

| # | Screen and state | Spec says (section) | Code does (file and line) | Severity |
|---|---|---|---|---|

Severity:
- **High:** breaks a rule in `AGENT.md` or `Feature_Requirements.md`, a Forbidden item, a missing screen or state, or a screen that writes points or deeds.
- **Medium:** wrong layout, copy, or token that a user would notice.
- **Low:** small spacing, naming, or polish.

Put differences with `DESIGN.md` (not `SCREEN_SPEC.md`) in the same table and say so in the "Spec says" column.

### 3. The smallest changes needed to improve the match
A numbered list, ordered by severity. For each change: the row number from section 2, the file to change, and the one-line change. Prefer a change that fixes several rows. Do not suggest a refactor, a rename, a new library, or a folder move unless a High item needs it.

At the end, add:

- **Could not check:** anything you could not verify (and why).
- **Needs your decision:** any difference that is really an open item in `SCREEN_SPEC.md` section 5, not a code defect.

Do not edit any file. Wait for approval before making a change.
