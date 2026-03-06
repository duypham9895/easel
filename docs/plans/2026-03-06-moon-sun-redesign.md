# Easel — Moon & Sun Redesign
**Date:** 2026-03-06
**Status:** Approved
**Authors:** Product (Edward), Senior Writer, Senior UI/UX, Senior Frontend, Senior Backend

---

## 1. Vision

Easel is a shared cycle-awareness app for couples of any gender or orientation. One partner tracks their menstrual cycle (**Moon**); the other shows up for them with intelligence and care (**Sun**). The app helps both partners feel more connected, understood, and prepared — every day of the cycle.

---

## 2. Terminology

| Old | New | Internal role key |
|---|---|---|
| Girlfriend | **Moon** | `moon` |
| Boyfriend | **Sun** | `sun` |

- All UI copy uses **Moon** and **Sun** — never gendered terms
- Pronouns removed; replaced with names or neutral "they/them"
- Works for all relationship types: straight, same-sex, non-binary, polyamorous

---

## 3. Visual Theme

### Moon UI (cycle tracker)
| Token | Value | Usage |
|---|---|---|
| Background | `#0D1B2A` | Main screen background |
| Surface | `#1A2B3C` | Cards, sheets |
| Accent primary | `#B39DDB` | Soft lavender — buttons, active states |
| Accent secondary | `#E0E0F0` | Moonlight silver — highlights |
| Text primary | `#F0F0FF` | Headlines |
| Text secondary | `#8899AA` | Body, captions |

- Phase orb shifts with cycle: deep indigo (menstrual/new moon) → bright pearl (ovulatory/full moon)
- Subtle star particle ambient background
- Dark, intimate, celestial feel

### Sun UI (supportive partner)
| Token | Value | Usage |
|---|---|---|
| Background | `#FFF8F0` | Main screen background |
| Surface | `#FFFFFF` | Cards |
| Accent primary | `#F59E0B` | Golden amber — buttons, active states |
| Accent secondary | `#FF7043` | Coral — alerts, SOS |
| Text primary | `#1A1008` | Headlines |
| Text secondary | `#6B5B45` | Body, captions |

- Warm gradient glows, sunrise-feel cards
- Bright, warm, protective feel

### Shared
- Same app binary — theme applied at login based on role
- App icon: half moon / half sun split design
- Phase accent colors remain consistent across both themes for data continuity

---

## 4. User Flows

### 4.1 Moon — First Launch
```
Download app
  → Sign up / Sign in
  → Role selection: "I am the Moon"
  → Health Sync permission screen (see Section 7)
  → If granted: import cycle history → pre-populate settings
  → If skipped: manual cycle data input
    - Last period start date
    - Average cycle length (days)
    - Average period length (days)
  → Avatar upload (optional)
  → Main Moon Dashboard
```

### 4.2 Moon — Daily Usage
```
Open app
  → Dashboard: current phase, day in cycle, AI greeting
  → Daily check-in: log mood + symptoms
  → AI insight generated after check-in
  → Whisper: send a need to Sun (anytime)
  → Settings: manage cycle data, health sync, notification controls
```

### 4.3 Sun — First Launch (Unlinked)
```
Download app
  → Sign up / Sign in
  → Role selection: "I am the Sun"
  → "You're ready — now find your Moon" screen
  → Benefits screen: what linking unlocks
    - See Moon's cycle in real time
    - Know exactly how to show up each day
    - Get AI advice tailored to her phase
    - Receive Whisper alerts when she needs you
    - Smart notifications before her period starts
  → [Enter partner code] or [Invite Moon via link/deep link]
```

### 4.4 Sun — First Launch (Linked)
```
Enter Moon's 6-digit code
  → Linking confirmed screen: "You're connected"
  → Sun Dashboard: Moon's current status + AI advice
```

### 4.5 Sun — Daily Usage
```
Open app
  → Dashboard: Moon's phase, day in cycle, AI advice card
  → Whisper alerts when Moon sends a need
  → Notifications: AI-timed cycle alerts
  → Settings: notification preferences
```

### 4.6 Partner Linking Flow
```
Moon: Settings → Share with your Sun
  → 6-digit code displayed (expires 48h)
  → [Copy code] + [Invite via link] buttons
  → Deep link: easel://link?code=XXXXXX
  → Deep link opens app → auto-fills code → links instantly

Sun: Enter partner code
  → Manual 6-digit input OR tap deep link
  → Verification → linked
```

---

## 5. Moon Feature Set

### 5.1 Cycle Tracking
- Last period start date input
- Average cycle length (21–45 days)
- Average period length (2–10 days)
- AI prediction improves with each logged cycle
- Confidence meter displayed: *"AI is 87% confident about your next cycle"*

### 5.2 Health App Sync
- First-launch permission screen (not cold native popup)
- iOS: Apple HealthKit — reads `HKCategoryTypeIdentifierMenstrualFlow`
- Android: Health Connect — reads menstrual cycle records
- Read-only: never writes back to health app
- Imports: period start/end dates, flow intensity, cycle history
- Pre-populates cycle settings; AI starts calibrated from day 1
- Settings: toggle sync on/off, sync now, last synced timestamp

### 5.3 Daily Check-In
- Mood rating (1–5 scale)
- Symptom logging (multi-select chips)
- AI insight generated immediately after submission
- Insight reflects current phase + logged mood + symptoms

### 5.4 Whisper (Signal to Sun)
- Always shows exactly 4 options
- Options are AI-generated per current cycle phase:
  - Menstrual: Hug, Heating pad, Chocolate, Quiet time
  - Follicular: Movie night, Surprise me, Long walk, Cook together
  - Ovulatory: Date night, Compliments, Dance with me, Adventure
  - Luteal: Snacks, Space, Cuddle, Kind words
- Option order = most frequently selected by this Moon (personalized)
- Custom input field: Moon types anything she needs
- Autocomplete: suggests from her own Whisper history as she types
- All custom inputs remembered and added to her personal vocabulary
- Sun receives: Whisper notification card + AI-generated action tip

### 5.5 AI Insights
- Phase-aware daily greeting (AI-generated)
- Post check-in insight (validates mood/symptoms, connects to phase)
- Self-care tip per phase
- All insights: warm, empathetic, non-clinical

### 5.6 Avatar Upload
- Photo picker → upload to Supabase Storage
- Displayed in Moon dashboard header and Sun's view of Moon

### 5.7 Share with Sun
- Settings section: "Share with your Sun"
- 6-digit partner code (stored in `couples` table, expires 48h)
- [Copy code] button
- [Invite] button: native share sheet with deep link
- Deep link: `easel://link?code=XXXXXX`

### 5.8 Notification Controls (Moon's Settings)
- Toggle: Let AI decide timing *(default)*
- Manual override: slider 1–7 days before period
- Individual toggles:
  - [ ] Period approaching notification
  - [ ] Period started notification
  - [ ] Period ended notification
  - [ ] Whisper delivery confirmation
- Privacy note: *"Your Sun only knows what you allow"*

---

## 6. Sun Feature Set

### 6.1 Unlinked State — Benefits Screen
Shown until partner code is entered:
- Emotional benefits list with icons
- Blurred Moon dashboard preview ("what you're missing")
- [Enter partner code] CTA
- [Invite Moon] button: native share sheet

### 6.2 Linked State — Sun Dashboard
- Moon's current phase + day in cycle
- Phase orb with visual context
- Days until next period (AI-predicted)
- AI advice card: specific, actionable, phase-aware
- Whisper alert card (when Moon sends a signal)

### 6.3 AI Advice
- Generated per Moon's current phase
- Phase-appropriate energy: quiet during menstrual, adventurous during follicular
- Warm, friend-like tone — never clinical or generic
- Refreshes daily / when phase changes

### 6.4 Smart Notifications
Timing determined by AI based on Moon's cycle data:
- **High prediction confidence (regular cycle):** notify 2 days before
- **Medium confidence:** notify 4–5 days before
- **Low confidence (irregular):** notify 7 days before, softer language
- **Not enough data yet:** fixed 3-day default

Notification types:
| Trigger | Copy example |
|---|---|
| Period approaching | *"Moon's period may start in ~3 days — here's how to prepare"* |
| Period started | *"Moon's period has started. She may need extra care today."* |
| Period ended | *"Moon's period has ended. She's entering a new phase."* |
| Whisper received | *"Moon sent you a Whisper — she needs [Hug] right now"* |

### 6.5 Confidence Transparency
- Prediction confidence shown on Sun dashboard
- Honest language: "approximately" vs "predicted"
- Calibration message: *"Log 2 more cycles to unlock smarter predictions"*

---

## 7. Health Sync — Detail

### First-Launch Permission Screen
**Not** a cold native permission dialog. A custom warm screen shown after role selection:

```
Title:   "Want smarter predictions from day one?"
Body:    "We can read your cycle history from Apple Health to
          predict your next period more accurately — right away.
          We never write to or share your health data."

CTA 1:  [ Sync with Apple Health ]   (primary)
CTA 2:  [ Skip for now ]             (secondary, text button)
```

### Data Read (Read-Only)
- Period start dates
- Period end dates
- Flow intensity (light / medium / heavy)
- Cycle length history
- Nothing is ever written back

### Settings — Health Sync Section
- Connected / Disconnected status indicator
- Last synced timestamp
- [ Sync Now ] button
- [ Disconnect ] option
- Privacy explanation: always visible, non-dismissible

### Packages
- iOS: `react-native-health`
- Android: `react-native-health-connect`

---

## 8. Data Model Changes

### Profiles table
```sql
ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('moon', 'sun'));
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN display_name TEXT;
```

### Whisper history table (new)
```sql
CREATE TABLE whisper_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  selected_count INTEGER DEFAULT 1,
  last_selected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Notification preferences table (new)
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  period_approaching BOOLEAN DEFAULT TRUE,
  period_started BOOLEAN DEFAULT TRUE,
  period_ended BOOLEAN DEFAULT TRUE,
  whisper_alerts BOOLEAN DEFAULT TRUE,
  use_ai_timing BOOLEAN DEFAULT TRUE,
  manual_days_before INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Couples table (existing — update)
```sql
-- role keys update: 'girlfriend' → 'moon', 'boyfriend' → 'sun'
-- link_code expiry: add expires_at column (48h)
ALTER TABLE couples ADD COLUMN IF NOT EXISTS link_code_expires_at TIMESTAMPTZ;
```

---

## 9. AI Routes (Proxy)

| Route | Purpose |
|---|---|
| `POST /api/greeting` | Moon daily greeting |
| `POST /api/partner-advice` | Sun phase advice |
| `POST /api/sos-tip` | Whisper response tip for Sun |
| `POST /api/daily-insight` | Moon post check-in insight |
| `POST /api/whisper-options` | Generate 4 Whisper options for Moon's current phase |
| `POST /api/predict-cycle` | AI cycle prediction + confidence score |

---

## 10. Push Notifications

- Platform: Expo Push Notifications (`expo-notifications`)
- Token storage: `push_tokens` table (existing)
- Notification scheduler: Supabase Edge Function (cron) runs daily
  - Reads cycle predictions
  - Computes notification timing per Moon
  - Sends to Sun's push token
- Whisper alerts: sent immediately on Whisper submission (real-time)

---

## 11. Implementation Phases

### Phase 1 — Foundation
- Rename all `girlfriend`/`boyfriend` to `moon`/`sun` in codebase
- Apply dual theme (Moon dark / Sun warm) based on role
- Update app icon

### Phase 2 — Moon Features
- Health sync (HealthKit + Health Connect)
- Avatar upload (Supabase Storage)
- Whisper feature (replace SOS)
- Moon notification controls in settings

### Phase 3 — Sun Features
- Unlinked benefits/invite screen
- Sun dashboard redesign with new theme
- AI-timed smart notifications (Edge Function cron)

### Phase 4 — AI & Intelligence
- Whisper options AI route
- Cycle prediction with confidence scoring
- All AI copy updated to Moon/Sun/gender-neutral

### Phase 5 — Polish
- Animations, micro-interactions
- Onboarding flows (both roles)
- App Store assets, screenshots

---

## 12. Out of Scope (v1)

- Web app
- Multiple partners
- Doctor/health professional integration
- Period product ordering
- In-app chat between Moon and Sun
