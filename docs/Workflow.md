# App Workflow

This document shows how a user moves through the app, step by step. It also shows how data moves between the React Native app and Supabase.

Feature IDs (AUTH-01, SIM-02, etc.) come from `Feature_Requirements.md`.

---

## 1. Main User Journey

```mermaid
flowchart TD
    A[Open app] --> B{Logged in?}
    B -- No --> C[Login or Sign Up]
    C --> D[Onboarding questions]
    B -- Yes, onboarding not done --> D
    B -- Yes, onboarding done --> F
    D --> E[Set up the room and appliances]
    E --> F[Simulator]
    F --> G[Bin: scan waste with AI]
    F --> H[Scanner: upload a bill]
    G --> I[Community]
    H --> I
    F --> I
```

Order for a new user:

1. Sign up or log in (AUTH-01).
2. Answer onboarding questions: schedule, house layout, appliances (ONB-01 to ONB-03).
3. See the room in the Simulator and try swaps (SIM-01 to SIM-04).
4. Scan waste with AI (BIN-01, BIN-02).
5. Scan a bill (SCN-01 to SCN-03).
6. Join the Community: points and voting (COM-01, COM-02).

---

## 2. Data Flow Rules

| Part | Role |
|---|---|
| React Native app | Shows screens. Does the bill calculation on the device (SIM-01, SIM-04). Sends and reads data. |
| Supabase Auth | Sign up, login, saved session. |
| Supabase Database | Stores all user data. Row Level Security (RLS): a user can only read and write their own household data. |
| Supabase Storage | Stores bill files (photo or PDF) and waste photos. |
| Supabase Edge Functions | Call the Gemini API (waste sorting, bill reading). The API key is stored as a Supabase secret, never in the app. The model name is one config value, so it can change without an app update. |
| Scheduled job (pg_cron) | Month-start and month-end notifications, and month-end points settlement and reward result. |

Rules:

- The app never talks to Gemini directly. It always goes through an Edge Function.
- Points are written by the database or an Edge Function, never directly by the app. This stops cheating.
- Onboarding saves after each step. The user can leave and come back.
- Simulated swaps ("Try swap") live in app memory only. They are not saved.

**Points rules:**

| Source | Points | When |
|---|---|---|
| Recycling (Bin) | +10 per recyclable item | After the user taps "I threw it". General waste gives 0. |
| Energy saving (Scanner) | +50 | When a real electricity bill is lower than the Simulator estimate for the same month. Once per billing month. |

Voting in Community does not use points.

---

## 3. Workflows by Feature

Participants in the diagrams:

- User
- App = React Native app
- Auth = Supabase Auth
- DB = Supabase Database
- Storage = Supabase Storage
- EF = Supabase Edge Function
- AI = Gemini API

### W1. Login and Sign Up (AUTH-01)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Auth
    participant DB

    User->>App: Open app
    App->>Auth: Check saved session
    alt Session is valid
        Auth-->>App: Session
        App->>DB: Read profile.onboarding_done
        alt onboarding_done = true
            App-->>User: Show Simulator
        else onboarding_done = false
            App-->>User: Show Onboarding
        end
    else No session
        App-->>User: Show Login / Sign Up
        alt New user
            User->>App: Enter email and password (min 8 characters)
            App->>Auth: signUp
            Auth-->>App: Session
            App->>DB: Create profile and household
            App-->>User: Show Onboarding
        else Returning user
            User->>App: Enter email and password
            App->>Auth: signInWithPassword
            Auth-->>App: Session
            App->>DB: Read profile.onboarding_done
            App-->>User: Show Simulator or Onboarding
        end
    end
```

Error cases:

- Wrong password: show a clear message, stay on the login screen.
- Email already used: show a message with a link to log in.
- No internet: show a toast and a retry button.

### W2. Onboarding (ONB-01, ONB-02, ONB-03)

Steps in order: Schedule → House layout → Appliances.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB

    App-->>User: Step 1 Schedule
    User->>App: Add not-at-home time ranges
    App->>App: Check ranges (end after start, no overlap)
    App->>DB: Save schedule rows (weekday / weekend ranges)

    App-->>User: Step 2 House layout
    User->>App: Number of living rooms, bedrooms, kitchens, bathrooms, residents
    App->>DB: Save household and room rows

    App-->>User: Step 3 Appliances
    User->>App: Pick type, brand, model or wattage, place on floor plan
    App->>DB: Save appliance rows (type, brand, model, wattage, star rating, room, position)

    App->>DB: Set profile.onboarding_done = true
    App-->>User: Show Simulator
```

Rules:

- If the range check fails, show an error under the field and do not save.
- If a model is not found, the user types the wattage by hand.
- The star rating is 1 to 5. If the user picks "Not sure", the app saves 3 stars.
- If the user closes the app in the middle, the next login resumes at the first step that is not done.

### W3. Simulator (SIM-01 to SIM-04)

**3a. Open the Simulator and calculate the bill (SIM-01)**

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB

    User->>App: Open Simulator
    App->>DB: Read schedules, rooms, appliances, My day, tariff rates
    DB-->>App: Data
    App->>App: Calculate monthly bill with user presence
    App-->>User: Show floor plan and bill card
    User->>App: Move an appliance
    App->>DB: Save new position
    App->>App: Recalculate bill
```

Calculation steps (on the device):

1. Split each day into 30-minute slots. Mark each slot "home" or "away" using the schedule (ONB-01). Weekdays and weekends use their own schedules.
2. For each appliance and each slot, decide on or off:
   - Always-on appliances (fridge, router): on.
   - Any other appliance in an "away" slot: **off**. Presence always wins over My day.
   - Any other appliance in a "home" slot, **before the user answers any My day question**: on. This gives the "max" bill.
   - Any other appliance in a "home" slot, **after My day is saved**: on only if the block active in that slot lists the appliance as on. With no active block, only the living room lights are on, and only when dark (19:00 – 07:00).
3. Water heater (not slot based): kWh per day = showers per person per day × number of residents × minutes per shower ÷ 60 × wattage ÷ 1000. Default: 2 showers per person, 10 minutes.
4. kWh per day = sum of (wattage × hours on ÷ 1000) for all appliances. A month is 30 days (5/7 weekdays, 2/7 weekend days).
5. Convert the monthly kWh to RM with the TNB tariff (generation, capacity, network, retail, AFA). See `Feature_Requirements.md`, Appendix A.
6. A swap (SIM-02) changes the wattage only. Presence and My day stay the same. Swap saving = old monthly bill − new monthly bill.

**3b. Swap & Compare (SIM-02) and Solar suggestion (SIM-03)**

```mermaid
sequenceDiagram
    participant User
    participant App

    User->>App: Tap an appliance
    App->>App: Is it frequently used? Is the star rating below 5?
    alt Yes
        App->>App: Pick a higher star rating (air conditioner: Inverter)
        App->>App: Calculate monthly saving
        App-->>User: Show suggestion at the bottom
        alt User taps Try swap
            App->>App: Replace appliance in memory
            App->>App: Recalculate bill
            App-->>User: Show new bill
        else User taps Not now
            App-->>User: Close suggestion
        end
    else No
        App-->>User: Show appliance info only
    end

    App->>App: After any bill change, check bill >= RM 500
    opt Bill >= RM 500 and not closed before in this session
        App-->>User: Show Solar suggestion at the bottom
    end
```

**3c. Time Fast-Forward with animation (SIM-04)**

```mermaid
sequenceDiagram
    participant User
    participant App

    User->>App: Drag the slider and let go on 1M, 6M, or 1Y
    App->>App: Months = 1, 6, or 12. Total savings = monthly saving × months
    App->>App: Start the animation (4 s, 6 s, or 8 s)
    loop Until the calendar reaches the end date
        App-->>User: Move the date label forward
        App-->>User: Cycle the day and night colors
        App-->>User: Avatar plays one typical weekday
        App-->>User: Count the savings number up with the calendar
    end
    App-->>User: Show the total savings
    opt User drags the slider again
        App->>App: Stop and start a new animation
    end
```

Rules:

- The monthly saving is calculated with presence and My day (3a). The animation only shows the number. It never changes it.
- The avatar loop is one typical weekday: leaves, home turns energy-saving, comes back, lights on, goes to bed.
- If "reduce motion" is on, skip the animation. Show the final date and savings.
- No data is read or written during the animation.

**3d. Avatar follows the schedule (SIM-06)**

```mermaid
sequenceDiagram
    participant User
    participant App

    App->>App: Read the phone clock, schedule, and My day
    alt Slot is away
        App-->>User: Avatar leaves, home shows the energy-saving look
    else Slot is home
        App->>App: Find the active block and its room
        App-->>User: Avatar walks to the room, the block's appliances are on
    end
    App->>App: Check again at the next 30-minute slot and when the app opens again
```

Where the avatar is in a home slot (first match wins):

1. A shower block: bathroom.
2. The block active at that time: its room (sleep: first bedroom, meal: kitchen, evening: living room, work or study: the room the user picked).
3. No block: living room.

Before the user answers any My day question, the default blocks (see 3e) are used only to place the avatar. The bill still uses the max rule.

The active block also decides which appliances are on. This is the same data used in 3a, so the picture and the bill always agree.

**3e. My day: Quick setup and timeline (SIM-07)**

*Quick setup (first time)*

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB

    User->>App: Open the Simulator for the first time
    App-->>User: Suggestion area asks "Answer a few quick questions?" (Start or Later)
    User->>App: Tap Start
    App->>DB: Read appliances and number of residents
    DB-->>App: Data
    loop Each card (cards for appliances the user does not have are skipped)
        App-->>User: Show one question with tap choices and the bill change
        User->>App: Choose an answer, or tap Skip
        App->>App: Update the day blocks and calculate the new bill
        App->>DB: Save the answer
    end
    App-->>User: Show the new bill, the avatar, and the savings
```

| Card | Question | Choices | Saved as |
|---|---|---|---|
| 1. Sleep | When do you sleep? | Bed time 22:00 / 23:00 / 00:00 / Other. Wake time 06:00 / 07:00 / 08:00 / Other. | Sleep block |
| 2. Sleeping aircon (only with a bedroom air conditioner) | Aircon while you sleep? | No / All night / About 3 hours / About 5 hours. Runs from bed time. With a bedroom fan: "Fan while you sleep?" On / Off. | Appliances on in the sleep block, and how long |
| 3. Evening in the living room | When are you in the living room in the evening? | 19:00 – 22:00 / 20:00 – 23:00 / 21:00 – 24:00 / Not much. With a TV: "Do you watch TV?" Yes / No. With an air conditioner or fan there: switches "Aircon on?" "Fan on?" | Evening block |
| 4. Showers (only with a water heater) | Showers per person per day | Stepper 0 to 4 (default 2) | Showers per person |

*Timeline (any time)*

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB

    User->>App: Tap "My day"
    App->>DB: Read day blocks, appliances, schedule
    DB-->>App: Data
    App-->>User: Show the 24-hour timeline (away blocks are locked)
    User->>App: Tap a block, change times or appliance switches
    App->>App: Check overlaps and show the new bill
    User->>App: Tap Save
    App->>DB: Save day blocks
    App->>App: Recalculate the bill, avatar, and savings
    App-->>User: Update the bill card and canvas
```

Default blocks (used for skipped cards and "Reset to default"):

| Block | Room | Time | Appliances on |
|---|---|---|---|
| Sleep | All bedrooms (avatar in the first bedroom) | 23:00 – 07:00 | Bedroom air conditioner and fan. Lights off. |
| Breakfast | Kitchen | 07:00 – 07:30 | Kitchen lights |
| Lunch | Kitchen | 12:00 – 12:30 | Kitchen lights |
| Dinner | Kitchen | 19:00 – 19:30 | Kitchen lights |
| Evening | Living room | 20:00 – 23:00 | Lights, TV, air conditioner, fan |
| Showers | Bathroom | 07:15 and 20:30, 10 minutes each | Water heater (counted by the shower formula, not by time) |
| Away | none | From the schedule | Locked. Only always-on appliances run. |

Data saved: each block has a type (sleep, meal, evening, shower, work, other), a room, a start time, an end time, and the appliances that are on. Showers per person and minutes per shower are saved with the household.

Rules:

- Until the user answers at least one question, the bill is the max bill.
- Blocks cannot overlap. Overnight is allowed only for Sleep.
- A block inside an away range is ignored (presence wins), and the app tells the user.
- Only appliances in the block's room are listed as switches.
- The user can add a block (work or study, other) with a room, times, and switches. The user can delete any block except Sleep.
- My day is the same on weekdays and weekends. Only the away blocks change.

### W4. Bin: AI Waste Scanner (BIN-01, BIN-02)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Storage
    participant EF
    participant AI
    participant DB

    User->>App: Open Bin and point camera at waste
    User->>App: Take photo
    App->>Storage: Upload photo
    App->>EF: classify_waste (photo path)
    EF->>AI: Send image
    AI-->>EF: Item name, bin type (paper, plastic, glass_metal, general), recyclable yes or no, confidence
    EF->>DB: Save waste_scans row
    EF-->>App: Result
    alt Confidence is high
        App-->>User: Show which bin (recyclable or general waste)
        User->>App: Tap "I threw it"
        App->>EF: confirm_disposal (scan id)
        EF->>DB: Add points to household monthly points
        EF-->>App: New points total
        App-->>User: Show points updated
    else Confidence is low
        App-->>User: Ask user to retake the photo
    end
```

Error cases:

- Camera permission denied: show a message with a button to open settings.
- AI fails or times out: show a retry button.
- Photo not clear: ask the user to retake.

Points rule: +10 points for each recyclable item (paper, plastic, glass and metal). General waste gives 0. The Edge Function adds the points, so the app cannot change them.

### W5. Scanner: Bill Analyzer (SCN-01, SCN-02, SCN-03)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Storage
    participant EF
    participant AI
    participant DB

    User->>App: Take photo or pick PDF of bill
    App->>Storage: Upload file
    App->>EF: read_bill (file path)
    EF->>AI: Read bill
    AI-->>EF: Bill type, billing month, usage, amount
    EF-->>App: Extracted values
    App-->>User: Show values to check and correct
    User->>App: Confirm
    App->>DB: Save bills row and file path
    App->>DB: Read last month bill and Simulator estimate
    DB-->>App: Data
    App->>App: Compare (for example water up 200 percent)
    alt Unusual usage
        App->>DB: Save alert (a database trigger creates a notification)
        App-->>User: Show warning (possible water leak)
    else Normal
        App-->>User: Show "Normal"
    end
    opt Electricity bill is lower than the Simulator estimate and no energy points yet for this billing month
        App->>EF: award_energy_points (bill id)
        EF->>DB: Add 50 points
        EF-->>App: New points total
        App-->>User: Show +50 points
    end
    App-->>User: Show result and an "Analyzing..." card
    App->>EF: analyze_bill (bill id, Simulator estimate)
    EF->>DB: Read earlier bills, appliances, My day, schedule
    EF->>EF: Calculate history numbers (vs last month, 3-month average, same month last year, rank, streak)
    EF->>AI: Send the bill data and the history numbers
    AI-->>EF: Summary, reasons, tips
    EF->>DB: Save the analysis on the bill
    EF-->>App: Analysis
    App-->>User: Show the AI Analysis card (SCN-03)
```

Rules:

- The user always checks and can correct the numbers before saving.
- Saved bills show in the archive list, newest first.
- The first bill has no last month to compare. Compare only with the Simulator estimate.
- Energy points (+50) are given once per billing month, even if the user uploads the same month again.
- The warning is decided by the app's rules (for example water up 200%). The AI only explains it.
- The Edge Function sends the AI only the numbers it needs. The AI must not make up RM amounts or percents. Every number in the text comes from the data sent.
- **History comparison:** The Edge Function calculates the history numbers from the saved bills (change vs last month, difference vs the 3-month average, difference vs the same month last year, rank in the last 6 months, and the up or down streak). The AI only explains them.
- Only bills of earlier months than the new bill are used. Numbers that need more history are left out.
- "Analyze again" on Bill Detail runs the analysis again with the current history (for example after the user adds older bills).
- The analysis is saved in `bills.analysis`. Opening an old bill reads it from there and does not call the AI again.
- The result screen shows the status and warning first. The analysis loads after, so the user never waits for it.
- If the AI fails, the card shows "Try again". The bill is already saved.

### W6. Community (COM-01, COM-02)

**6a. View points and vote (COM-01)**

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB

    User->>App: Open Community
    App->>DB: Read household points, this month rewards, household vote
    DB-->>App: Data
    App-->>User: Show points progress and reward cards
    alt Household has not voted
        User->>App: Tap a reward and vote
        App->>DB: Insert vote (one per household per month)
        DB-->>App: OK
        App-->>User: Show vote saved
    else Already voted
        App-->>User: Show current vote
    end
```

Voting does not use points. Each household has one vote per month.

**6b. Month-end settlement (COM-02)**

```mermaid
sequenceDiagram
    participant Job as Scheduled job
    participant DB
    participant App
    participant User

    Job->>DB: At month end, add up household points
    Job->>DB: Count votes and pick the winning reward
    Job->>DB: Check points target
    alt Target reached
        Job->>DB: Mark reward unlocked
    else Target not reached
        Job->>DB: Mark reward locked
    end
    User->>App: Open Community
    App->>DB: Read result
    App-->>User: Show reward result and start a new month
```

### W7. Notifications (NOT-01)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB
    participant Job as Scheduled job

    Note over DB: Bill alert: a trigger adds a notification when an alert is saved
    Job->>DB: Start of month: add "Voting open" notification
    Job->>DB: End of month: add "Month result" notification
    User->>App: Open the app or tap the bell
    App->>DB: Read notifications
    DB-->>App: List and unread count
    App-->>User: Show bell dot and list
    User->>App: Tap a notification
    App->>DB: Mark as read
    App-->>User: Open the linked screen
```

Version 1 is an in-app list only. There are no phone push messages.

---

## 4. Data Summary (Screen → Supabase)

| Screen | Reads | Writes | Other |
|---|---|---|---|
| Login / Sign Up | profile | profile, household | Auth |
| Onboarding | schedules, rooms, appliances | schedules, households, rooms, appliances, profile.onboarding_done | |
| Simulator | schedules, rooms, appliances, day_blocks, tariff_rates | appliances (position, edits), day_blocks, showers per person | Bill, avatar, and animation run in the app |
| Bin | household points | waste_scans, points | Storage (photo), Edge Function, Gemini |
| Scanner | bills (with analysis), appliances, day_blocks | bills (with analysis), alerts, points (energy) | Storage (file), Edge Function, Gemini |
| Community | points, rewards, votes | votes | Scheduled job for month end |
| Notifications | notifications | notifications (read flag) | Database trigger, scheduled job |

Detailed tables and columns go in `Database_Schema.md`.

---

## 5. Open Items

Decided: star rating in ONB-03, points values (+10 recycling, +50 energy saving), voting does not use points, Gemini for AI, 2.5D floor plan, TNB tariff (see `Feature_Requirements.md`, Appendix A).

Not decided yet:

1. **Monthly points target:** How many points unlock the monthly reward?
2. **AFA value:** It changes every month. Someone must update `tariff_rates` each month.
3. **Generation charge above 1,500 kWh:** Sources disagree if the higher rate applies to all kWh or only to the kWh above 1,500. Version 1 uses only the kWh above 1,500.
4. **Gemini model name:** `gemini-2.5-flash` was shut down on 16 October 2026 and returns a 404 error. Use a current Flash model (Google lists `gemini-3.5-flash` as the replacement). Keep the model name in one config value, because Google retires models often.
5. **Solar "See how":** Where does the button go?
6. **Push notifications:** Not in version 1.
7. **One account per household:** Several members sharing one household are not covered.
8. **My day defaults:** Sleep 23:00 – 07:00 with air conditioner and fan on, meals at 07:00 / 12:00 / 19:00 for 30 minutes, evening 20:00 – 23:00 with everything on, 2 showers of 10 minutes per person. Please confirm.
   Also confirm: sleep uses the first bedroom, showers at 07:15 and 20:30 (avatar only), and work or study blocks need a room picked by the user.
9. **One avatar for the household:** Several people with different routines are not shown.
10. **Avatar uses the phone clock:** The user can only see other times of day through the fast-forward animation.
11. **Limit on "Analyze again":** Each run calls Gemini. Should there be a daily limit per user?
