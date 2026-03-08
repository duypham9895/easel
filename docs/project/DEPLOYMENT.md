# Easel — Deployment Guide

Complete steps to deploy all services and run the app from scratch.

---

## Architecture Overview

```
app/          → Expo/React Native app (iOS + Android)
proxy/        → Vercel serverless proxy (AI API key protection)
app/supabase/ → Supabase project (DB + Auth + Realtime + Edge Functions)
```

---

## Prerequisites

Install these tools before starting:

```bash
# Node.js 20+
node --version

# Expo CLI
npm install -g @expo/cli eas-cli

# Supabase CLI
brew install supabase/tap/supabase   # macOS
# or: npm install -g supabase

# Vercel CLI
npm install -g vercel
```

---

## Step 1 — Supabase Project Setup

### 1.1 Create a new Supabase project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Choose an organization, enter a project name (e.g. `easel`), set a database password, choose a region close to your users
4. Wait ~2 minutes for the project to provision

### 1.2 Get your API credentials

Dashboard → **Settings → API**

Copy these values — you will need them later:

| Value | Used in |
|---|---|
| Project URL (`https://xxxx.supabase.co`) | `EXPO_PUBLIC_SUPABASE_URL` |
| `anon` public key | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` secret key | Edge Function env var (never in app) |

### 1.3 Run the database migration

Dashboard → **SQL Editor** → New query

Open `app/supabase/migrations/001_initial_schema.sql`, paste the entire contents, and click **Run**.

This creates:
- 8 tables: `profiles`, `couples`, `cycle_settings`, `period_logs`, `daily_logs`, `sos_signals`, `push_tokens`, `user_preferences`
- RLS policies on every table
- Helper functions `my_couple_id()` and `my_partner_id()`
- Trigger to auto-create a profile on signup
- Realtime publication for `sos_signals` and `cycle_settings`

Verify in Dashboard → **Table Editor** that all 8 tables exist.

### 1.4 Enable email auth

Dashboard → **Authentication → Providers**

Ensure **Email** provider is enabled. For development, you can disable "Confirm email" under Auth → Settings so you don't need to verify email addresses.

---

## Step 2 — Deploy the Vercel Proxy

The proxy protects your MiniMax API key — it never touches the app binary.

### 2.1 Get a MiniMax API key

1. Sign up at https://www.minimax.io
2. Go to API Keys and create a new key

### 2.2 Generate a client token

This is a shared secret between the app and the proxy:

```bash
openssl rand -hex 32
# Example output: a3f8c2e1d4b7...
# Save this — you'll need it in both Vercel and the app .env
```

### 2.3 Set up environment variables

```bash
cd proxy
cp .env.example .env
```

Edit `.env`:
```
MINIMAX_API_KEY=<your MiniMax key>
MINIMAX_MODEL=MiniMax-M2.5
CLIENT_TOKEN=<the hex string from openssl above>
```

### 2.4 Deploy to Vercel

```bash
cd proxy
npm install
vercel --prod
```

During the first deploy:
1. Log in or create a Vercel account
2. When prompted: link to existing project → **No** → create new project named `easel-proxy`
3. When asked for the root directory: press Enter (`.`)

After deployment, Vercel prints the production URL:
```
Production: https://easel-proxy-xxxx.vercel.app
```
Save this URL.

### 2.5 Add environment variables in Vercel Dashboard

Go to https://vercel.com → your `easel-proxy` project → **Settings → Environment Variables**

Add all three variables from `.env`:
- `MINIMAX_API_KEY`
- `MINIMAX_MODEL`
- `CLIENT_TOKEN`

Then redeploy: `vercel --prod`

### 2.6 Test the proxy

```bash
curl -X POST https://your-proxy.vercel.app/api/greeting \
  -H "Content-Type: application/json" \
  -H "X-Client-Token: <your CLIENT_TOKEN>" \
  -d '{"phase":"follicular","dayInCycle":7,"phaseTagline":"Rising energy"}'
```

Expected response: `{"greeting":"..."}`

---

## Step 3 — Deploy the Edge Function

The `notify-sos` Edge Function sends push notifications to the boyfriend when the girlfriend sends an SOS.

### 3.1 Link Supabase CLI to your project

```bash
cd app
supabase login
supabase link --project-ref <your-project-ref>
```

Find `project-ref` in Dashboard → Settings → General → Reference ID (looks like `abcdefghijklmno`).

### 3.2 Set the service role secret for the Edge Function

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
```

The `SUPABASE_URL` is automatically injected by Supabase — you don't need to set it.

### 3.3 Deploy the function

```bash
supabase functions deploy notify-sos
```

Verify in Dashboard → **Edge Functions** that `notify-sos` appears with status **Active**.

### 3.4 Set up the Database Webhook

Dashboard → **Database → Webhooks** → Create a new webhook:

| Field | Value |
|---|---|
| Name | `sos-signal-push` |
| Table | `sos_signals` |
| Events | `INSERT` |
| Type | `Supabase Edge Functions` |
| Function | `notify-sos` |

Click **Create webhook**.

---

## Step 4 — Configure the Expo App

### 4.1 Get your EAS Project ID

```bash
cd app
npm install
eas login
eas init
```

This creates an EAS project and adds `extra.eas.projectId` to `app.json`. Copy the project ID shown.

Alternatively, find it in https://expo.dev → your project → **Project ID**.

### 4.2 Create the app environment file

```bash
cd app
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_EAS_PROJECT_ID=<your EAS project ID>
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
EXPO_PUBLIC_PROXY_URL=https://easel-proxy-xxxx.vercel.app
EXPO_PUBLIC_CLIENT_TOKEN=<same CLIENT_TOKEN from Step 2.2>
```

### 4.3 Update app.json with EAS project ID

Open `app/app.json` and add the `extra` field:

```json
{
  "expo": {
    ...
    "extra": {
      "eas": {
        "projectId": "<your EAS project ID>"
      }
    }
  }
}
```

---

## Step 5 — Run the App Locally

### 5.1 Install dependencies

```bash
cd app
npm install
```

### 5.2 Start the dev server

```bash
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) to open the app on your device.

> **Note:** Push notifications require a physical device. They will not work in a simulator/emulator.

### 5.3 Verify everything is connected

1. Open the app → **Sign Up** with an email + password
2. Complete onboarding (select role: Girlfriend or Boyfriend)
3. GF: go to Settings and save your cycle dates — this writes to `cycle_settings` in Supabase
4. GF: generate a link code (Settings screen)
5. BF: enter the link code on a second device — you should see "Linked!" status
6. GF: tap **Send a signal to him** → choose an SOS type → BF should receive:
   - An in-app alert (if BF app is open — via Realtime)
   - A push notification (if BF app is closed — via Edge Function + Expo Push)

---

## Step 6 — Build for Distribution (optional)

To distribute via TestFlight (iOS) or Google Play (Android):

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli
eas login

cd app

# iOS build (requires Apple Developer account)
eas build --platform ios --profile preview

# Android build
eas build --platform android --profile preview
```

> For production builds, configure `eas.json` with your signing credentials and app store details.

---

## Environment Variables Reference

### `app/.env`

| Variable | Where to get it |
|---|---|
| `EXPO_PUBLIC_EAS_PROJECT_ID` | `eas init` output or expo.dev |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `EXPO_PUBLIC_PROXY_URL` | Vercel deployment URL |
| `EXPO_PUBLIC_CLIENT_TOKEN` | Same value as `CLIENT_TOKEN` in Vercel |

### `proxy/.env` (also set in Vercel Dashboard)

| Variable | Where to get it |
|---|---|
| `MINIMAX_API_KEY` | minimax.io → API Keys |
| `MINIMAX_MODEL` | `MiniMax-M2.5` (default, don't change) |
| `CLIENT_TOKEN` | Your `openssl rand -hex 32` output |

---

## Troubleshooting

**Push notifications not received**
- Must be on a physical device (not simulator)
- Check `push_tokens` table in Supabase — should have a row for the user
- Check Dashboard → Edge Functions → `notify-sos` → Logs for errors
- Verify the Database Webhook is set to trigger on `sos_signals` INSERT

**AI greetings not loading (shows static text)**
- Check `EXPO_PUBLIC_PROXY_URL` has no trailing slash
- Test the proxy directly with curl (Step 2.6)
- Verify `EXPO_PUBLIC_CLIENT_TOKEN` matches `CLIENT_TOKEN` in Vercel env vars exactly

**"User not found" or auth errors**
- Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Dashboard → Authentication → Users — new signups should appear here
- If profile doesn't auto-create: verify the `on_auth_user_created` trigger exists in Database → Functions

**Partner link not working**
- Link codes expire after 24 hours — regenerate if expired
- Both users must be logged in on their respective devices
- Check `couples` table in Supabase — a row should appear after GF generates a code

**RLS policy errors (403 from Supabase)**
- Usually means the migration wasn't fully applied
- Re-run `001_initial_schema.sql` in SQL Editor — the `CREATE OR REPLACE` and `IF NOT EXISTS` patterns make it safe to re-run
