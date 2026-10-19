# Environment Setup

How to set up your computer, the Expo app, and Supabase for Simeplify / EcoTwin.

**About versions:** this guide does not pin exact versions, because Expo, NativeWind, and Gemini models change often. Where a version matters, it tells you where to check. Use `npx expo install` (not plain `npm install`) for Expo-related packages, so you get versions that match your Expo SDK.

Read `AGENT.md` for the project rules. Read `Workflow.md` section 2 for how the app, Supabase, and Gemini fit together.

---

## 1. What you need on your computer

| Tool | Why | Check |
|---|---|---|
| Node.js (LTS) | Runs Expo and the tooling. Each Expo SDK has a minimum Node version: see the version table at https://docs.expo.dev/versions/latest/ | `node -v` |
| npm (comes with Node) | Packages | `npm -v` |
| Git | Version control | `git --version` |
| Docker Desktop | Needed to run Supabase locally | `docker --version` |
| Supabase CLI | Local database, migrations, Edge Functions | `npx supabase --version` |
| VS Code (or another editor) | Editing | |
| Expo Go app on your phone | Quick testing (iOS App Store or Google Play) | |
| Android Studio and/or Xcode | Only if you want an emulator or simulator. Xcode needs a Mac. | |

Windows users: use WSL2 for Docker and the Supabase CLI if you have problems.

---

## 2. Accounts and keys

| Service | What to get | Where it goes |
|---|---|---|
| Supabase | A project. Copy the **Project URL**, the **anon key**, and the **project ref** | App `.env` (URL and anon key only). Project ref for `supabase link`. |
| Google AI Studio (Gemini) | A Gemini API key | **Supabase secret only.** Never in the app, never in git. |
| Expo (EAS) | A free account | Only when you build a test app or release |

The **service role key** of Supabase is a secret too. Never put it in the app.

---

## 3. Create the app

```bash
npx create-expo-app@latest simeplify
cd simeplify
npx expo start
```

Scan the QR code with Expo Go to check that the empty app runs. The default template uses Expo Router and TypeScript. Keep it.

If the Expo docs tell you to add a `--template` flag for the newest SDK, follow the docs: https://docs.expo.dev/more/create-expo/

---

## 4. Install the packages

Expo-related packages (use `npx expo install`):

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-svg react-native-safe-area-context
npx expo install expo-font @expo-google-fonts/lora @expo-google-fonts/source-sans-3
npx expo install expo-camera expo-image-picker expo-document-picker
npx expo install @react-native-async-storage/async-storage react-native-url-polyfill
```

Other packages:

```bash
npm install @supabase/supabase-js lucide-react-native
```

| Package | Used for |
|---|---|
| `react-native-reanimated` | Slow, soft motion (design.md Unit 7) |
| `react-native-gesture-handler` | Dragging appliances on the floor plan |
| `react-native-svg` | 2.5D floor plan, avatar, charts. Do not use a 3D engine. |
| Lora and Source Sans 3 | The two fonts. No other fonts. |
| `expo-camera` | Bin scanner |
| `expo-image-picker`, `expo-document-picker` | Bill photo and PDF |
| `@supabase/supabase-js` | Backend |
| `lucide-react-native` | Icons (stroke 1.5) |

Optional: Skia for the floor plan. Check first whether it works with Expo Go for your SDK. If not, you will need a development build (section 9).

### NativeWind (Tailwind classes)

Follow the official installation page for your Expo SDK, because the steps (Babel, Metro, `global.css`, `tailwind.config.js`) depend on the NativeWind and Tailwind versions: https://www.nativewind.dev/

Then put the design tokens in `tailwind.config.js` and `theme.ts`:

- Colors: `cream #faf6f1`, `brown #5c4033`, `sage-50` to `sage-600`, `tan-100`, `tan-300`, `tan-400`, `tan-600` (hex values are in `design.md`, Unit 4).
- Fonts: `Lora` for headings and numbers, `Source Sans 3` for body.
- Brown shadow color for `shadow-sm` (design.md Unit 16).

Load the fonts with `useFonts` in the root layout and keep the splash screen until they are ready.

---

## 5. Environment variables

Create `.env` in the app root:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- Variables that start with `EXPO_PUBLIC_` are visible inside the app. Use them only for the URL and the anon key.
- Add `.env` to `.gitignore`. Commit a `.env.example` with empty values.
- Restart `npx expo start` after you change `.env`.

Supabase client (`lib/supabase.ts`) outline:

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }
);
```

The saved session keeps the user logged in (AUTH-01).

---

## 6. Supabase: local setup

```bash
npx supabase init
npx supabase start        # needs Docker running
```

`supabase start` prints a local API URL, a local anon key, and a Studio link. Use them in a separate `.env.local` while you develop.

Project folders:

```
supabase/
  migrations/      tables, RLS, triggers, pg_cron jobs
  functions/       Edge Functions (one folder each)
  seed.sql         tariff_rates and sample rewards
```

Create migrations with `npx supabase migration new <name>`. Apply them locally with `npx supabase db reset`.

### Tables to plan for

Detailed columns go in `Database_Schema.md` (not written yet). From `Workflow.md` section 4, you will need at least: profiles, households, schedules, rooms, appliances, day_blocks, tariff_rates, waste_scans, bills (with `analysis`), alerts (with `level`), points, deeds, rewards, votes, notifications.

### Rules for every table

1. Turn on Row Level Security.
2. A user can read and write only their own household's rows.
3. **Points and deeds: the app can read, but cannot insert or update.** Only Edge Functions (service role) and database functions write them.
4. A database trigger creates a notification when an alert with level Leak or Major is saved.

### Storage buckets

| Bucket | Content | Access |
|---|---|---|
| `bills` | Bill photos and PDFs | Private, own household only |
| `waste-photos` | Waste scan photos | Private, own household only |

### Timezone

Deed days and month end use **Malaysia time (Asia/Kuala_Lumpur)**. Make the database functions and the pg_cron jobs use that timezone on purpose. pg_cron runs in UTC by default, so convert.

### Seed data

- `tariff_rates`: the TNB values from `Feature_Requirements.md` Appendix A. AFA default 0. Someone must update AFA every month.
- A few sample rewards for the voting screen.

---

## 7. Supabase: Edge Functions and Gemini

Functions from `Workflow.md`: `classify_waste`, `confirm_disposal`, `read_bill`, `analyze_bill`, `award_energy_points`.

```bash
npx supabase functions new classify_waste
```

### Secrets

Local (`supabase/functions/.env`, add to `.gitignore`):

```bash
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-3.5-flash
```

Run locally:

```bash
npx supabase functions serve --env-file supabase/functions/.env
```

Production:

```bash
npx supabase secrets set GEMINI_API_KEY=your-gemini-key
npx supabase secrets set GEMINI_MODEL=gemini-3.5-flash
```

**Model name:** the product notes say `gemini-2.5-flash` was shut down on 16 October 2026 and returns a 404 error, and that `gemini-3.5-flash` is the replacement. I could not confirm this from here, so check the current list at https://ai.google.dev/gemini-api/docs/models before you set it. The model name is only read from `GEMINI_MODEL`, never written in code, so you can change it without an app update.

### Function rules

- The app calls the function. The function calls Gemini. The app never calls Gemini.
- Check the user's login inside each function (`Authorization` header).
- Send Gemini only the data it needs. The AI must not invent RM amounts or percents.
- Deed cap: `award_energy_points` and `confirm_disposal` count today's deeds and give points only for the first 3 (Malaysia time).

---

## 8. Scheduled jobs (pg_cron)

Enable the `pg_cron` extension in the Supabase dashboard (Database, Extensions), then add the jobs in a migration:

| Job | When (Malaysia time) | What |
|---|---|---|
| Voting open | Start of month | Add "Voting open" notifications |
| Month settlement | End of month | Add up points, count votes, pick the winner, unlock or lock the reward, add "Month result" notifications |

---

## 9. Run and test

| Method | Good for | Limits |
|---|---|---|
| Expo Go on your phone | Fast check of most screens | Some native modules may not work. Check if one fails. |
| Android emulator / iOS simulator | Testing without a phone | Needs Android Studio or Xcode |
| Development build (EAS) | When a package needs native code (for example Skia) | Needs an EAS account and a build |

```bash
npx expo start            # run
npx tsc --noEmit          # type check
npm test                  # unit tests
```

Phone and computer must be on the same Wi-Fi for Expo Go. If it cannot connect, try `npx expo start --tunnel`.

### Permissions to set in `app.json`

- Camera (Bin scanner and bill photo): add a clear usage text.
- Photo library (bill upload).

Test the "permission denied" screens too (see `Workflow.md` W4).

---

## 10. `.gitignore` must include

```
.env
.env.local
supabase/functions/.env
node_modules/
.expo/
```

Check that no key was committed before your first push: `git log -p | grep -i "api_key"`.

---

## 11. Setup checklist

- [ ] Node, Git, Docker, and the Supabase CLI are installed.
- [ ] Supabase project created. URL, anon key, and project ref saved.
- [ ] Gemini API key saved in a Supabase secret (not in the app).
- [ ] App runs in Expo Go.
- [ ] Packages installed with `npx expo install`.
- [ ] NativeWind works and the tokens from `design.md` are in `tailwind.config.js`.
- [ ] Lora and Source Sans 3 load.
- [ ] `.env` and `.env.example` exist. `.env` is in `.gitignore`.
- [ ] `supabase start` works. Migrations apply with `db reset`.
- [ ] RLS is on for every table. The app cannot write points or deeds.
- [ ] Storage buckets `bills` and `waste-photos` are private.
- [ ] `tariff_rates` is seeded. AFA update owner is named.
- [ ] `GEMINI_MODEL` is a current model.
- [ ] pg_cron jobs use Malaysia time.
- [ ] Camera and photo permissions are in `app.json`.

---

## 12. Common problems

| Problem | Try |
|---|---|
| Expo Go cannot connect | Same Wi-Fi, or `npx expo start --tunnel` |
| Changes in `.env` do not appear | Restart Expo with `npx expo start -c` |
| Styles do not apply | Check the NativeWind steps for your version (Babel, Metro, `global.css` import) |
| Reanimated error | Check the Babel plugin setup in the Reanimated docs for your SDK, then clear the cache |
| `supabase start` fails | Docker must be running. Free ports or restart Docker. |
| Edge Function returns 404 from Gemini | The model name is retired. Update `GEMINI_MODEL`. |
| User can write points from the app | RLS is wrong. Remove insert and update policies on `points` and `deeds`. |
