# Easel — Customer Journeys & Use Cases

Easel is a couples period tracking app. Two people share one experience: the **Girlfriend (GF)** tracks her cycle and wellbeing; the **Boyfriend (BF)** receives context-aware guidance on how to support her. All data is private to the couple — no one else can read it.

---

## Actors

| Actor | Who they are | What they want |
|---|---|---|
| **Girlfriend (GF)** | The person tracking their menstrual cycle | Understand her cycle, log how she feels daily, reach her partner when she needs support |
| **Boyfriend (BF)** | The partner | Understand what she's going through, know what to do, be notified when she needs him |
| **AI (MiniMax M25)** | The AI layer via Vercel proxy | Personalize greetings, advice, and insights based on cycle phase and logged data |
| **Supabase Realtime** | Infrastructure | Deliver in-app SOS alerts instantly to BF without polling |
| **Expo Push API** | Infrastructure | Deliver SOS notifications to BF's device when the app is closed |

---

## Use Case Map

```mermaid
graph TB
    subgraph GF ["Girlfriend"]
        UC1[Sign up & set cycle data]
        UC2[Generate partner link code]
        UC3[View current phase & cycle status]
        UC4[Read AI-personalized greeting]
        UC5[Send SOS signal to boyfriend]
        UC6[Log daily mood & symptoms]
        UC7[Read AI daily insight]
        UC8[Update cycle settings]
    end

    subgraph BF ["Boyfriend"]
        UC9[Sign up]
        UC10[Link to girlfriend via code]
        UC11[View girlfriend's phase status]
        UC12[Read AI partner advice]
        UC13[Receive SOS alert in-app]
        UC14[Receive SOS push notification]
        UC15[Acknowledge SOS signal]
    end

    subgraph AI ["AI Layer"]
        UC4
        UC7
        UC12
        UC16[Generate SOS-specific action tip]
    end

    UC5 --> UC13
    UC5 --> UC14
    UC13 --> UC15
    UC14 --> UC15
    UC13 --> UC16
    UC14 --> UC16
    UC2 --> UC10
```

---

## Journey 1 — First-Time Setup (Both Users)

Both users go through this once before anything else works.

```mermaid
sequenceDiagram
    actor GF as Girlfriend
    actor BF as Boyfriend
    participant App as Easel App
    participant Supabase as Supabase Auth + DB

    Note over GF,Supabase: GF sets up first
    GF->>App: Opens app for first time
    App->>GF: Show Sign Up screen
    GF->>App: Enter email + password
    App->>Supabase: signUp(email, password)
    Supabase-->>App: Session + user ID
    Supabase->>Supabase: Trigger auto-creates profile row
    App->>GF: Show role selection screen
    GF->>App: Select "Girlfriend"
    App->>Supabase: UPDATE profiles SET role = 'girlfriend'
    App->>GF: Show cycle settings screen
    GF->>App: Enter last period date, cycle length, period length
    App->>Supabase: UPSERT cycle_settings
    App->>GF: Show GF Dashboard

    Note over GF,BF: GF generates link code
    GF->>App: Go to Settings → Generate link code
    App->>Supabase: INSERT into couples (girlfriend_id, link_code)
    Supabase-->>App: 6-digit code + 24h expiry
    App->>GF: Display code (e.g. "482917")
    GF->>BF: Share the code via any channel (text, etc.)

    Note over BF,Supabase: BF sets up and links
    BF->>App: Opens app, Sign Up
    App->>Supabase: signUp(email, password)
    Supabase-->>App: Session + user ID
    App->>BF: Show role selection
    BF->>App: Select "Boyfriend"
    App->>Supabase: UPDATE profiles SET role = 'boyfriend'
    App->>BF: Show link code entry screen
    BF->>App: Enter "482917"
    App->>Supabase: UPDATE couples SET boyfriend_id, status='linked'
    Supabase-->>App: Couple row updated
    App->>BF: Show BF Dashboard (now showing GF's phase data)
```

---

## Journey 2 — Girlfriend's Daily Loop

What GF does every day.

```mermaid
flowchart TD
    A([GF opens app]) --> B[bootstrapSession\nrestores Supabase session]
    B --> C{Already logged in?}
    C -- No --> D[Auth screen]
    C -- Yes --> E[GF Dashboard loads]

    E --> F[AI greeting fetched\nfrom Vercel proxy]
    F --> G{Proxy available?}
    G -- Yes --> H[Personalized greeting\nbased on phase + day\n✦ AI badge shown]
    G -- No --> I[Static fallback greeting]

    E --> J[Phase wheel renders\ncurrent phase + day + days until period]

    E --> K{Wants to reach BF?}
    K -- Yes --> L[Tap 'Send a signal to him']
    L --> M[SOS Sheet slides up\n4 options: Sweet Tooth / Hug / Cramps / Quiet]
    M --> N[Select an option]
    N --> O[Haptic feedback]
    O --> P[INSERT sos_signals in Supabase]

    E --> Q{Wants to log today?}
    Q -- Yes --> R[Scroll to Daily Check-in card]
    R --> S[Select mood\n1-5 emoji scale]
    S --> T[Toggle symptom chips\nCramps / Bloating / Headache / Fatigue\nTender / Mood swings / Spotting / Cravings]
    T --> U[Tap 'Log & get insight']
    U --> V[UPSERT daily_logs in Supabase]
    V --> W[POST /api/daily-insight\nto Vercel proxy with mood + symptoms + phase]
    W --> X[AI insight displayed\n✦ AI Insight label]

    E --> Y{Wants to check settings?}
    Y -- Yes --> Z[Settings tab]
    Z --> AA[Update cycle dates / lengths]
    AA --> AB[UPSERT cycle_settings]
    AB --> AC[Dashboard recalculates\nphase + day in real time]
```

---

## Journey 3 — SOS Signal Flow (Full)

The most time-critical path in the app. GF needs BF immediately.

```mermaid
sequenceDiagram
    actor GF as Girlfriend
    actor BF as Boyfriend
    participant App_GF as GF's App
    participant Supabase as Supabase DB
    participant Realtime as Supabase Realtime
    participant EdgeFn as Edge Function\n(notify-sos)
    participant ExpoAPI as Expo Push API
    participant AI as Vercel Proxy\n(MiniMax AI)

    GF->>App_GF: Tap "Send a signal to him"
    App_GF->>GF: SOS Sheet slides up (4 options)
    GF->>App_GF: Select "Cramps Alert"
    App_GF->>App_GF: Haptic feedback (success)
    App_GF->>Supabase: INSERT sos_signals\n{couple_id, sender_id, type: 'cramps_alert'}

    par BF app is OPEN (Realtime path)
        Supabase->>Realtime: Row change event
        Realtime->>BF: postgres_changes event\nvia WebSocket
        Note over BF: useSOSListener receives event
        BF->>BF: receiveSOS() updates Zustand store
        BF->>BF: SOSAlert component animates in
        BF->>AI: POST /api/sos-tip\n{sosType, phase, dayInCycle}
        AI-->>BF: Personalized action tip
        Note over BF: "Cramps alert — fill a hot water\nbottle and bring it with a warm drink"
    and BF app is CLOSED (Push Notification path)
        Supabase->>EdgeFn: Database webhook fires on INSERT
        EdgeFn->>Supabase: SELECT couples WHERE id = couple_id
        Supabase-->>EdgeFn: {boyfriend_id}
        EdgeFn->>Supabase: SELECT push_tokens WHERE user_id = boyfriend_id
        Supabase-->>EdgeFn: [{token: "ExponentPushToken[...]"}]
        EdgeFn->>ExpoAPI: POST /v2/push/send\n{title: "She needs you", body: "Cramps alert..."}
        ExpoAPI-->>BF: Push notification delivered to device
        BF->>BF: Tap notification → app opens to BF Dashboard
        BF->>BF: SOSAlert renders with AI tip
    end

    BF->>BF: Tap "Got it"
    BF->>Supabase: UPDATE sos_signals\nSET acknowledged_at = NOW()
    BF->>BF: SOSAlert dismisses
```

---

## Journey 4 — Boyfriend's Daily Loop

What BF sees and does when he opens the app.

```mermaid
flowchart TD
    A([BF opens app]) --> B[bootstrapSession]
    B --> C[BF Dashboard loads]

    C --> D[Her Status Card\nPhase name + tagline + day in cycle\nDays until next period countdown]

    C --> E[AI partner advice fetched\nPOST /api/partner-advice\nphase + dayInCycle]
    E --> F{AI available?}
    F -- Yes --> G[Personalized tip shown\n✦ AI badge on card]
    F -- No --> H[Static fallback advice\nfrom PHASE_INFO]

    C --> I{Active SOS in store?}
    I -- Yes --> J[SOSAlert banner animates in\nat top of dashboard]
    J --> K[AI SOS tip loaded\nPOST /api/sos-tip]
    K --> L[Tip displayed: exactly what to do\ne.g. 'Grab her favourite snack right now']
    L --> M{BF taps 'Got it'}
    M --> N[UPDATE sos_signals acknowledged_at\nSOSAlert dismisses]

    I -- No --> O[Her Survival Guide section\nMood description + AI advice]

    C --> P[The 4 Phases overview\nHighlights current phase chip]
```

---

## Journey 5 — Returning User (Session Restore)

What happens when either user reopens the app after closing it.

```mermaid
flowchart TD
    A([App reopens]) --> B[app/_layout.tsx mounts]
    B --> C[bootstrapSession called]
    C --> D[supabase.auth.getSession\nreads from AsyncStorage]
    D --> E{Valid session found?}
    E -- Yes --> F[Restore: isLoggedIn=true\nuserId, role, coupleId]
    F --> G{Role set?}
    G -- GF --> H[Route to GF Dashboard]
    G -- BF --> I[Route to BF Dashboard]
    G -- Null --> J[Route to Onboarding]
    E -- No --> K[Route to /auth\nShow login screen]
    E -- Expired --> L[supabase auto-refreshes token]
    L --> F
```

---

## Journey 6 — Cycle Phase Transitions Over a 28-Day Cycle

How GF's experience changes automatically as her cycle progresses.

```mermaid
gantt
    title 28-Day Cycle — Phase Timeline
    dateFormat  D
    axisFormat  Day %d

    section Phases
    Menstrual (Rest & Restore)     :done,    m, 1, 5d
    Follicular (Rising Energy)     :active,  f, 6, 9d
    Ovulatory (Peak & Glow)        :         o, 15, 3d
    Luteal / PMS (Wind Down)       :crit,    l, 18, 11d
```

```mermaid
flowchart LR
    M["Menstrual\nDay 1-5\nRed theme\n'Rest & Restore'\nBF: warm drinks + comfort food"]
    F["Follicular\nDay 6-14\nBlue theme\n'Rising Energy'\nBF: plan a date, be adventurous"]
    O["Ovulatory\nDay 15-17\nGold theme\n'Peak & Glow'\nBF: compliments + small gift"]
    L["Luteal / PMS\nDay 18-28\nPurple theme\n'Wind Down'\nBF: patience + snacks + no arguments"]

    M --> F --> O --> L --> M
```

Each phase change:
- Updates the **color theme** across both dashboards
- Changes the **AI greeting** for GF (different tone, different energy)
- Changes the **AI partner advice** for BF (phase-specific actions)
- Updates the **self-care tip** shown to GF
- Recalculates **days until next period** countdown

---

## Use Case Summary Table

| # | Use Case | Actor | Trigger | System Response |
|---|---|---|---|---|
| UC1 | Sign up | GF / BF | Open app first time | Create auth user + profile row in Supabase |
| UC2 | Set cycle data | GF | Onboarding / Settings | UPSERT `cycle_settings`; dashboard recalculates |
| UC3 | Generate link code | GF | Settings tap | INSERT `couples` row; display 6-digit code |
| UC4 | Link to partner | BF | Enter code in onboarding | UPDATE `couples` with `boyfriend_id`; status → `linked` |
| UC5 | View phase dashboard | GF | Open app | Calculate phase from cycle settings; render phase wheel |
| UC6 | View partner status | BF | Open app | Read GF's `cycle_settings` via RLS-allowed query |
| UC7 | Get AI greeting | GF | Dashboard loads | Fetch `POST /api/greeting` with phase + day |
| UC8 | Get AI partner advice | BF | Dashboard loads | Fetch `POST /api/partner-advice` with phase + day |
| UC9 | Send SOS signal | GF | Tap signal button → pick type | INSERT `sos_signals`; triggers Realtime + webhook |
| UC10 | Receive SOS (in-app) | BF | App is open | Realtime WebSocket delivers event; SOSAlert renders |
| UC11 | Receive SOS (background) | BF | App is closed | Edge Function → Expo Push → device notification |
| UC12 | Get AI SOS tip | BF | SOS alert received | Fetch `POST /api/sos-tip` with SOS type + phase |
| UC13 | Acknowledge SOS | BF | Tap "Got it" | UPDATE `sos_signals.acknowledged_at`; alert dismisses |
| UC14 | Log daily check-in | GF | Scroll to check-in card | Select mood + symptoms; tap submit |
| UC15 | Get AI daily insight | GF | After submitting check-in | UPSERT `daily_logs`; fetch `POST /api/daily-insight` |
| UC16 | Update cycle settings | GF | Settings tab | UPSERT `cycle_settings`; phase recalculates instantly |
| UC17 | Sign out | GF / BF | Settings tap | `supabase.auth.signOut()`; clear Zustand; route to auth |
| UC18 | Session restore | GF / BF | Reopen app | `bootstrapSession` reads AsyncStorage; no re-login needed |

---

## Data Flow Architecture

```mermaid
flowchart TD
    subgraph Devices
        GFApp["GF Device\nEasel App"]
        BFApp["BF Device\nEasel App"]
    end

    subgraph Supabase
        Auth["Auth\n(email/password)"]
        DB["PostgreSQL\n8 tables + RLS"]
        Realtime["Realtime\nWebSocket pub/sub"]
        EdgeFn["Edge Function\nnotify-sos (Deno)"]
    end

    subgraph Vercel
        Proxy["Serverless Proxy\n4 AI endpoints\n5-layer security"]
    end

    subgraph External
        MiniMax["MiniMax M25\nLLM API"]
        ExpoAPI["Expo Push\nNotification API"]
    end

    GFApp -- "Auth, cycle data,\ndaily logs, SOS" --> DB
    BFApp -- "Auth, push token,\nSOS acknowledge" --> DB
    DB -- "sos_signals INSERT\nvia Realtime" --> Realtime
    Realtime -- "WebSocket event" --> BFApp
    DB -- "sos_signals INSERT\nvia DB Webhook" --> EdgeFn
    EdgeFn -- "Fetch push tokens" --> DB
    EdgeFn -- "Push message" --> ExpoAPI
    ExpoAPI -- "Notification" --> BFApp
    GFApp -- "POST /api/greeting\nPOST /api/daily-insight" --> Proxy
    BFApp -- "POST /api/partner-advice\nPOST /api/sos-tip" --> Proxy
    Proxy -- "X-Client-Token validated\nRate limited" --> MiniMax
    MiniMax -- "AI text" --> Proxy
    Proxy -- "JSON response" --> GFApp
    Proxy -- "JSON response" --> BFApp
```

---

## Edge Cases & Boundary Conditions

| Scenario | Behavior |
|---|---|
| BF has no account yet when GF generates code | Code stays valid for 24h; BF can link any time within that window |
| Link code expires (>24h) | GF regenerates from Settings; old code is replaced |
| GF sends SOS, BF has no push token | Realtime still works when app is open; no push when closed (silent fail, no error to GF) |
| GF sends multiple SOS signals quickly | Each INSERT triggers Realtime + Edge Function; BF sees the latest one |
| Proxy is down / MiniMax API fails | Static fallback text shown immediately; `isAI` flag stays false; no error shown to user |
| User reopens app with expired JWT | Supabase SDK auto-refreshes token from AsyncStorage; seamless re-entry |
| Two GFs try to link to same BF | RLS + `UNIQUE (girlfriend_id)` constraint prevents one GF from being in two couples |
| Daily check-in submitted twice on same day | `UPSERT` with `ON CONFLICT (user_id, log_date)` — updates existing row silently |
