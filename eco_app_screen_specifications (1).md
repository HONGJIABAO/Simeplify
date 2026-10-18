# Eco-App Screen Specifications

This document outlines the screen specifications based on the provided UI mockups, categorized by main user flows.

## 1. Authentication Flow

### 1.1 Login Screen
**Purpose:** Allow returning users to access their accounts.
**UI Components & Elements:**
*   **Header:** App Logo/Icon, "Welcome" title, Subtitle ("Save energy, sort waste, grow your community.").
*   **Segmented Control / Tabs:** "Log in" (active) and "Sign up".
*   **Form Fields:** 
    *   Email input field.
    *   Password input field with an eye icon to toggle visibility.
*   **Primary Action:** "Log in" button.
*   **Alternative Login:** "Log in with Google" button.
**States:**
*   **Default:** Empty fields with placeholders.
*   **Error State:** Red border on fields, red error message text below password ("Email or password is wrong").

### 1.2 Sign Up Screen
**Purpose:** Onboard new users and collect location data for accurate utility tariff calculations.
**UI Components & Elements:**
*   **Header & Tabs:** Same as Login, with "Sign up" tab active.
*   **Account Details:** Email and Password (min 8 characters) fields.
*   **Location Section ("Where do you live?"):**
    *   "Use my location" auto-detect button.
    *   State dropdown (e.g., Selangor, Sabah).
    *   City or area input field.
    *   Street address input field (Optional).
*   **Primary Action:** "Create account" button.
**States:**
*   **Success/Valid:** Green checkmarks on valid inputs (e.g., Email).
*   **Error State:** Red highlights on missing/invalid location fields ("Choose your state", "Enter your city or area").
*   **Warning State (Specific Location Logic):** Informational banner when certain states are selected (e.g., choosing Sabah triggers a warning: "Your bill estimate uses the TNB tariff (Peninsular Malaysia). It may be different in your area.").

---

## 2. Community & Voting Flow

### 2.1 Community Home (New Letter)
**Purpose:** Alert the user to a new monthly community decision.
**UI Components & Elements:**
*   **Hero Image:** Mailbox illustration with a "New letter" badge.
*   **Call to Action:** "This month's vote" section showing time remaining (e.g., "4 days remaining").
*   **Button:** "Open letter".

### 2.2 Voting Letter
**Purpose:** Present the voting options for the monthly community reward.
**UI Components & Elements:**
*   **Header:** "Official Ballot" and month/issue number.
*   **Options List (Radio-button style):**
    *   Option 1: Plant a tree in our community.
    *   Option 2: 50% off organic food at Sime Darby Mall.
    *   Option 3: Community tool & seed library.
*   **Progress Bar:** "Household Turnout" showing current votes vs. goal.
*   **Actions:** "Submit vote" (Primary) and "Later" (Secondary).

### 2.3 Voted & Waiting Status
**Purpose:** Confirm vote submission and show results status.
**UI Components & Elements:**
*   **Status Badges:** "Ballot Sealed", "Letter collected".
*   **Confirmation Message:** "Vote saved. Result arrives tomorrow."
*   **User's Choice Summary:** Shows the option the user selected with a "Submitted" badge.
*   **Timeline/Next Steps:** "What happens next" section detailing collection time and announcement time.
*   **Community Stats:** Number of neighbors who have voted so far.

### 2.4 Community Home (Hero Leaf & Goal Tracking)
**Purpose:** Main community dashboard showing collective progress and individual impact.
**UI Components & Elements:**
*   **Visual Tracker:** Circular progress tracker showing a "Living Leaf" thriving based on collective actions.
*   **Impact Stats:** Personal/Community energy saved (kWh) and points earned.
*   **Task List ("Recommended for you"):** Actionable cards like "Recycle 1 item" or "Upload lower bill".
*   **Initiatives updates:** e.g., "Oakridge Tree Planting" participant counts.

### 2.5 Reward Unlocked
**Purpose:** Announce the winning vote and allow the user to claim their reward.
**UI Components & Elements:**
*   **Announcement:** "Reward unlocked" banner.
*   **Winning Reward Card:** Details of the chosen reward (e.g., "Plant a tree in our community") with a specific allocation (e.g., "Plot #48").
*   **Action:** "Claim reward" button.
*   **Milestone Summary:** "Together, Our Neighborhood Did It" showing final stats (Active homes, kWh saved, Green Points).

---

## 3. Simulator Flow (Energy Savings)

### 3.1 Floor Plan & Appliance Selection
**Purpose:** Allow users to tap appliances in a 3D floor plan to simulate energy savings.
**UI Components & Elements:**
*   **Header Stats:** Estimated monthly bill, Optimal range, and potential savings.
*   **Interactive Map:** Isometric floor plan highlighting selectable appliances (Fridge, Washer, TV, AC, Fan).
*   **Bottom Sheet:** Prompt to "Select an Appliance" indicating how many are active.

### 3.2 Appliance Simulations (Detail Views)
**Purpose:** Provide specific tweaking and simulation for individual appliances.
**Shared Elements:** Before/After impact calculations (Standard vs. Simulated Impact in RM/mo).
*   **Living Room AC:** Toggle Eco-Inverter status, adjust units in room.
*   **Kitchen Refrigerator:** Toggle on/off, select compressor tech (Non-inverter vs. Eco Inverter 5-star), adjust target thermostat.
*   **Living Room TV:** Screen running duration, Power Profile Mode (Standard vs. Eco Sensor Mode). Displays "Phantom standby" insights.
*   **Washing Machine:** Adjust wash frequency, water temperature mode (Cold Eco vs. Warm Normal).
*   **Ceiling Fan:** Adjust fan speed (1 to 5), simulate motor efficiency (AC Induction vs. DC Inverter).
*   **Actions:** "Apply Simulation" button to save settings to the baseline.

### 3.3 Simulator Flow (My Day & Scheduling)
**Purpose:** Enable users to map out their daily routines and simulate energy usage based on time-of-day and active appliances.
**UI Components & Elements:**
*   **Floor Plan Editor:**
    *   **Header:** Estimated Bill (e.g., RM 0 / mo) and a High Usage warning badge.
    *   **Interactive Map:** Top-down 2D floor plan layout containing different rooms (Living room, Kitchen, Bedroom, Bathroom).
    *   **Editing Tray:** An "Edit" mode triggers a bottom drag-and-drop tray with tabs for "Appliances" (Air cond., Fridge, Lights, TV) and "Furniture" to populate the empty floor plan.
*   **My Day Timeline:**
    *   **Header:** Forecast Bill comparison (e.g., RM 248 / RM 348 est.).
    *   **Schedule Tabs:** Toggle view between "Weekdays" and "Weekends".
    *   **Time Blocks:** Chronological daily routines (e.g., "00:00 - 06:30 - Sleep", "08:30 - 17:30 - Away (Office)"). Some blocks like "Away" can be locked.
    *   **Inline Editing:** Expandable time blocks (e.g., "Living Room Unwind") to quickly toggle specific room appliances on/off and adjust start/end times directly from the timeline overview.
    *   **Actions:** Buttons to "Add time block", "Reset to default", and "Save schedule".
*   **Edit Time Block Detail:**
    *   **Configuration:** Set the Routine Name (e.g., "Sunday Movie & Leisure"), application frequency (e.g., "Sundays only", "Every Weekend"), and specific Start/End times.
    *   **Appliance Control List:** Detailed granular controls for "Room appliances in use". Includes toggles for power, AC target temperature adjustments, and Fan speed options (Low/Med/High).
    *   **Impact Summary:** Displays a "Live Intensity Rating" and an estimated cost for the specific time block, comparing it to standard baselines.
    *   **Actions:** "Cancel", "Apply changes", and a red text option to "Remove [Day] time block".

---

## 4. Bin & Scanner Flow

### 4.1 Scanner (Bill Analyzer)
**Purpose:** Upload and analyze utility bills for anomalies.
**UI Components & Elements:**
*   **Upload Area:** "Upload utility bill" (Take photo or Upload PDF).
*   **Alerts:** "Anomaly Detected" banner warning about potential leaks.
*   **Data Visualization:** Bar chart showing Monthly Usage (Electricity vs. Water) across past billing cycles.
*   **AI Analysis Module:** Breakdown of peak electricity vs. base water usage, with AI-generated recommendations to lower usage ("Try this next").

### 4.2 Bin (Waste Sorting)
**Purpose:** Guide users on how to properly sort waste to earn points.
**UI Components & Elements:**
*   **Progress Dashboard:** Total points earned, diverted total, CO2 prevented, and progress bar to next milestone.
*   **Scan Action:** "Scan Your Waste" using Gemini AI Scanner or upload from gallery.
*   **Sorting Directory:** Categorized list (Paper & Cardboard, Plastic, Glass & Metals, General Waste) showing points per category.
*   **Recent Scans:** History log of previously scanned items and points awarded.

### 4.3 AI Scanner Result (Material Breakdown)
**Purpose:** Show AI identification results and provide specific sorting instructions.
**UI Components & Elements:**
*   **AI Confirmation:** e.g., "AI Confirmed - 98% match".
*   **Item Identification:** e.g., "Plant-based Beverage Carton".
*   **Sorting Instruction:** Which bin to use (e.g., Paper & Carton Bin) and specific advice (e.g., "Rinse cleanly... unscrew the plastic cap").
*   **Action Buttons:** "I threw it (+10 pts)" or "Retake photo".