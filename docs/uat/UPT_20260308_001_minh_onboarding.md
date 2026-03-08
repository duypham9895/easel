# User Persona Test: Minh's Sun Onboarding Experience

```yaml
session_id: UPT_20260308_001
persona: Minh
role: Sun (boyfriend)
age: 28
occupation: Software sales
tech_comfort: High
language: Vietnamese (primary), English (comfortable)
date: 2026-03-08
tester: Claude Opus 4.6 (Phase 2 — Narrative Walkthrough)
app_version: v1.5.1
```

---

## Executive Summary

Minh is a pragmatic, high-tech-comfort guy who has never used a health or relationship app. His girlfriend Linh asked him to join. This narrative traces every step of his Sun onboarding, from receiving the invite through his first full session. The experience is largely positive but surfaces several friction points, an unclear value proposition during auth, and a calendar tab that feels empty. His first genuine "this helps me" moment comes on the UnlinkedScreen, which does an excellent job selling the app's purpose before he even connects.

**Final emotional state: Cautiously bought in.** He sees the value but needs a week of Whispers and SOS signals to fully commit.

---

## Step 1: Receiving the Invite

Linh texts me a message. She says something like "Anh oi, em dang dung cai app nay, anh tai di roi nhap ma nay nha" and pastes a 6-digit number. No link to the App Store. Just a number.

Honestly my first thought was: "App gi vay?" Linh doesn't explain what the app does. She just says "em gui ma cho anh roi." I Google "Easel app" — the name tells me nothing. "Easel" sounds like an art app. Zero immediate association with relationships or health.

**Observation:** The invite flow relies entirely on Linh doing the selling. The app itself provides a Share sheet message (`"Anh dang dung Easel de hieu va ho tro em tot hon. Tai app va chia se ma voi anh de ket noi nhe: https://easel.app"`) but Linh probably just sent the code, not the full message. If she had shared the full text, it would have been better — it at least says "hieu va ho tro em" (understand and support you). But "easel.app" still doesn't scream purpose.

**Friction:** App name is opaque. No App Store deep link in the share message — just a website URL.

**Did I almost give up?** No — Linh asked, so I'll do it. But if a buddy told me to download this, I'd ignore it.

---

## Step 2: App Download & First Open

I download from the App Store and open it. First thing I see: a splash screen with a spinner on a light background (`Colors.background: #FBFBFD`). It's a single `ActivityIndicator` in `Colors.menstrual` (pink, `#FF5F7E`).

Honestly my first thought was: "Pink spinner. Great. This is definitely a girl's app." The very first visual cue is a pink loading indicator. It lasts maybe 1-2 seconds while `bootstrapSession()` runs, but the first impression is already coded feminine.

Since I'm not logged in, I get redirected to `/auth`.

**Masculinity comfort check:** The pink spinner is subtle but sets a tone. Not a dealbreaker, but it primes me to expect a period tracker for women, not an app that has something for me.

**Technical observation:** The splash-to-auth redirect is fast. No unnecessary animation. Good.

---

## Step 3: Authentication (auth.tsx)

The auth screen opens. I see:

- A heart icon (`Feather: heart`) inside a circle with a faint pink background (`Colors.menstrual + '18'`)
- "Easel" in big bold text (32px, weight 700)
- Tagline: "Bat dau hanh trinh cung nhau." (Start your journey together) — since I'm on Sign Up mode
- Email field, password field, "Tao tai khoan" (Create Account) button

**First-person reaction:** The tagline "Bat dau hanh trinh cung nhau" is actually nice. It implies togetherness, not "track your period." The heart icon is universal enough. The dark text on light background feels clean. This looks like a modern auth screen — comparable to any SaaS app I've used.

I type my email, set a password. The password strength meter appears (3 segments: red/yellow/green with labels "Yeu"/"Trung binh"/"Manh"). I go with something strong because I'm a tech guy. I tap "Tao tai khoan."

I get the email verification screen: a big mail icon, "Kiem tra hop thu," my email displayed, and a hint to tap the confirmation link. The "Gui lai email" (Resend) link is there if I need it.

**Observations:**
- The auth screen uses Moon theme colors (pink accent) even though I haven't chosen a role yet. This makes sense — the app doesn't know who I am yet — but it reinforces the "girl's app" feel before I've even had a chance to see the Sun side.
- Password minimum is 6 characters (validated client-side: `password.length >= 6`). Fine.
- The "Quen mat khau?" (Forgot password) link is nicely positioned but only shows on Sign In mode, not Sign Up. Makes sense.
- Email verification is mandatory — I can't skip it. I have to go to my email, click the link, come back.

**The Skip Test:** Can I skip anything here? No. Email + password are required. Email verification is required. This is the one place the app correctly blocks fast-tapping. But the email verification step adds friction — I have to context-switch to my email app and back. Some users will drop off here.

**Did I almost give up?** No, but the email verification is annoying. I'm used to apps that let me in immediately and verify later.

---

## Step 4: Role Selection (onboarding.tsx)

After confirming my email and signing in, I land on the onboarding screen. I see:

- "Chao mung den" (Welcome to)
- "Easel" in massive 48px bold text
- "Chon vai tro de ca nhan hoa trai nghiem. Hieu nhau bat dau tu day." (Choose your role to personalize your experience. Understanding each other starts here.)
- Two cards:
  1. **Moon icon** (crescent moon, pink `#FF5F7E`): "Em la Moon" / "Theo doi chu ky & thi tham voi Sun khi em can"
  2. **Sun icon** (sun, blue `#70D6FF`): "Anh la Sun" / "Luon dong dieu & biet cach xuat hien dung luc cho Moon"

- Footer: "Ban co the doi vai tro bat cu luc nao trong Cai dat."

**First-person reaction:** OK, this is the moment I understand the concept. Moon = girlfriend, Sun = boyfriend. The Vietnamese copy is actually good — "Anh la Sun" uses "Anh" (boyfriend/older male pronoun), which immediately tells me this role is for me. The subtitle "Luon dong dieu & biet cach xuat hien dung luc cho Moon" translates to "Stay in tune & know exactly how to show up for Moon." That's compelling. It tells me the app helps ME know what to do.

The Sun card uses blue (`Colors.follicular: #70D6FF`), not pink. This is a relief. The icon is a sun. The card has a chevron suggesting "tap to continue." Clean, clear, one tap.

I tap "Anh la Sun." I feel a medium haptic feedback (`Haptics.impactAsync(Medium)`). Nice touch — it feels deliberate.

**Masculinity comfort check:** The Sun card is blue, uses masculine Vietnamese pronouns, and frames the value as actionable ("biet cach xuat hien" = know how to show up). This feels like it was designed for me, not just tacked on. No pink, no hearts, no period vocabulary. Good.

**The Skip Test:** There's nothing to skip here — it's a binary choice. One tap and I'm through. This is excellent for my 2-tap-max tolerance. But there's also no explanation of what happens next. I just tapped and got whisked away.

**What I understood:** The app helps me understand Linh's cycle so I know how to act. The copy doesn't say "period tracker" — it says "dong dieu" (in tune) and "xuat hien dung luc" (show up at the right time). Smart framing.

**First Value Moment candidate:** This screen is where I first think "ok, this might actually be useful" — but it's still abstract. I haven't seen the actual value yet.

---

## Step 5: Unlinked State (UnlinkedScreen.tsx)

After selecting Sun, `router.replace('/(tabs)')` fires. The tab layout renders with three tabs: "Hom nay" (Today), "Lich" (Calendar), "Cai dat" (Settings). The tab bar uses Moon theme colors (`tabBarActiveTintColor: Colors.menstrual` = pink). That's a bit odd for Sun, but I notice the active tab icon turns pink when selected.

The Today tab loads `SunDashboard`, which checks `isPartnerLinked`. Since I haven't entered Linh's code yet, it shows the `UnlinkedScreen`.

**What I see:**

1. **Hero section:** A big sun icon (amber `#F59E0B`) in a soft amber circle. The heading reads "Tro thanh nguoi ban doi co ay xung dang" (Be the partner she deserves). The subtitle: "Easel giup anh hieu chu ky cua co ay theo thoi gian thuc de luon biet cach xuat hien — ngay ca khi co ay khong the giai thich." (Easel gives you real-time insight into her cycle so you always know how to show up — even when she can't explain it.)

2. **Four benefit cards:**
   - Eye icon: "Khong bao gio bi bat ngo" (Never be caught off guard) — "Biet chinh xac co ay dang o dau trong chu ky — truoc khi cam xuc dang cao."
   - Zap icon: "Biet phai lam gi, moi ngay" (Know what to do, every day) — "Nhan meo duoc AI ca nhan hoa ve cach the hien dua tren giai doan chinh xac cua co ay."
   - Bell icon: "Thi tham khi co ay can anh" (Whispers when she needs you) — "Co ay co the gui tin hieu nhe nhang khi can ho tro — khong can cuoc tro chuyen kho xu."
   - Heart icon: "It xung dot, nhieu ket noi" (Less conflict, more connection) — "Hieu chu ky cua co ay bien va cham thanh su dong cam — tu dong."

3. **Divider:** "Ket noi voi doi tac" (Connect with your partner)

4. **Code input:** Label "NHAP MA 6 CHU SO CUA CO AY" (Enter her 6-digit code), a big centered text input (30px, bold, letter-spaced), and a hint: "Nho doi tac mo Easel va chia se ma 6 ky tu voi anh."

5. **Connect button:** "Ket noi voi co ay" (Connect to her) — amber-colored, disabled until 6 digits entered.

6. **Invite section:** "Co ay chua co Easel?" (She doesn't have Easel yet?) + "Moi co ay dung Easel" (Invite her to Easel) button.

**First-person reaction:** THIS is the screen that sells me. Honestly, "Khong bao gio bi bat ngo" (never be caught off guard) is exactly the pitch that works for someone like me. I've been blindsided by Linh's mood before and had no idea why. The benefit cards are concise, scannable, and speak to my actual pain points.

The warm amber color scheme (`SunColors.background: #FFF8F0`, `accentPrimary: #F59E0B`) feels completely different from the pink auth screen. This is a warm cream background with amber accents — masculine, warm, not clinical. It reminds me of a premium coffee app, not a health tracker.

**FIRST VALUE MOMENT: This is it.** The "Never be caught off guard" + "Know what to do, every day" benefit cards make me think "Oh wait, this actually helps me." Before this, the app was abstract. Now I see the concrete value: I'll know what's going on with Linh before things get tense.

**Masculinity comfort check:** Perfect. The whole screen is in amber/cream. The language is action-oriented: "biet phai lam gi" (know what to do), "xuat hien" (show up). It positions me as an active, caring partner, not a passive observer. The word "Thi tham" (whisper) is intimate but not saccharine.

**The Skip Test:** I could theoretically skip entering the code and go to other tabs. But the dashboard would still show this UnlinkedScreen every time I open the app. There's no "skip for now" button — the code input is the only forward path on this tab. The Calendar and Settings tabs are accessible though.

**One-handed usability:** The code input is centered and big (68px height, 30px font). Easy to reach with a thumb. The connect button is 60px tall with a 30px border radius — good tap target. The benefit cards are scrollable. All good for one-handed use.

**Technical observation:** The code input strips non-digits (`t.replace(/\D/g, '')`), so I can't accidentally type letters. Number pad keyboard (`keyboardType="number-pad"`) appears. The connect button only enables when `code.length === 6`. Clean validation.

---

## Step 6: Partner Linking

I type in the 6-digit code Linh sent me. The input border changes from light (`SUN.border: #FFE0B2`) to amber (`SUN.accentPrimary: #F59E0B`) when I hit 6 digits. Nice visual confirmation.

I tap "Ket noi voi co ay." The button shows a loading spinner. Behind the scenes, `linkToPartnerByCode()` runs:

1. It finds the couple row matching this code
2. Validates the code isn't expired (24h window), isn't already used, and isn't my own code
3. Atomically updates the couple record: sets `boyfriend_id`, changes status to `linked`, clears the code

If it fails, I get contextual Vietnamese error messages:
- Expired: "Ma nay da het han. Nho co ay tao ma moi."
- Already used: "Ma nay da duoc su dung."
- Own code: "Day la ma cua anh — hay nhap ma cua co ay."
- Generic: "Ma khong hop le. Vui long kiem tra va thu lai."

On success, I feel a strong haptic (`notificationAsync(Success)`). The screen immediately transitions — `isPartnerLinked` becomes true in the store, and the `UnlinkedScreen` is replaced by the full `SunDashboard`.

**First-person reaction:** This was smooth. Type code, tap connect, haptic buzz, done. The whole linking took maybe 10 seconds. No confirmation dialog, no extra steps. The haptic on success is a nice celebratory touch.

**What could go wrong:** If Linh's code expired (24h TTL) or she didn't generate one yet, I'd be stuck. The error messages are helpful but the hint says "Nho doi tac mo Easel va chia se ma 6 ky tu voi anh" — it tells me to ask her. That's the right fallback.

**Did I almost give up?** No. This was the fastest part of the whole flow.

---

## Step 7: First Dashboard View (SunDashboard.tsx)

The UnlinkedScreen disappears and I see the full Sun dashboard. The background is warm cream (`SunColors.background: #FFF8F0`). Here's what's on screen:

1. **Header greeting:** "Chao, Sun" (Hey, Sun) — or my display name if I set one. Below: "Luon ben canh Moon" (Be there for Moon).

2. **Moon Status Card:** A big card with:
   - A **phase orb** — a 72px colored circle with the current cycle day number in big white text (28px, weight 800). The orb color matches the current phase (e.g., pink for menstrual, blue for follicular).
   - **Phase name** in the phase color (e.g., "Kinh nguyet" in pink)
   - **Phase tagline** (e.g., "Nghi ngoi & Phuc hoi")
   - **Cycle day** in small text: "Ngay X trong chu ky cua Moon"
   - A **countdown badge** on the right: big number showing days until next period, with label "ngay nua den ky kinh"

3. **Today's Guide section:**
   - "Huong dan hom nay" (Today's Guide) header
   - **"Tam trang Moon luc nay"** (Moon's mood right now) — GuideCard with activity icon, showing phase-specific mood description. E.g., for menstrual: "Co ay co the cam thay met moi va de xuc dong hon binh thuong. Co the dang lam viec rat vat va."
   - **"Cach the hien"** (How to show up) — GuideCard with star icon, showing partner advice. Static fallback loads instantly, then AI-generated advice replaces it (title changes to "Cach the hien ✦ AI" when AI loads). E.g., "Pha do uong am, nau mon ngon, va don gian la o ben co ay."

4. **Phase chips row:** Four small chips at the bottom showing all four phases (Kinh nguyet, Nang trung, Rung trung, Hoang the). The current phase is filled with its color; others are faded.

**First-person reaction:** OK, now I'm getting somewhere. The status card is immediately useful — I can see what day of Linh's cycle it is and how many days until her next period. That's a dashboard I'd actually check. The big number in the orb is scannable — I can open the app, glance at "Day 14" in a gold circle, and know she's in ovulatory phase without reading anything.

The "Huong dan hom nay" section is the real value. "Tam trang Moon luc nay" tells me what she might be feeling. "Cach the hien" tells me what to DO. These are the actionable instructions I was promised on the UnlinkedScreen.

**Genuine interest:** The phase orb + countdown badge is genuinely useful. I can check this in 2 seconds flat. "5 ngay nua den ky kinh" — ok, I should probably be extra patient this week. That's the kind of info I never had before.

**Confusion:** The greeting says "Chao, Sun" — not my name. I haven't set a display name yet. It falls back to "Sun" which feels impersonal. I'd want it to say "Chao, Minh" but there was no prompt to set my name during onboarding.

**AI label:** When the AI advice loads, the title changes from "Cach the hien" to "Cach the hien ✦ AI". The "✦ AI" badge is subtle. I notice it but don't care — I just want to know what to do. The product design rule says "no AI terminology in UI" but the code does show "✦ AI" in the title. This is a minor inconsistency with the stated design rule, though the Vietnamese user might not register "AI" as jargon.

**Masculinity comfort check:** The Sun theme is excellent. Warm cream background, amber accents, dark text. No pink anywhere on this screen (except phase-specific colors which are contextual). The language is consistently action-oriented: "Cach the hien" (how to show up), "Luon ben canh" (always be there). This feels like a coaching app, not a period tracker.

**One-handed usability:** Everything is in a ScrollView. The status card is at the top — no need to scroll to see the key info. Guide cards are below the fold but accessible. Phase chips at the bottom are small (11px text) but I don't need to tap them — they're informational.

**The Skip Test:** There's nothing to skip or interact with on this screen. It's purely informational. I read (or skim) and close the app. That's actually perfect for my use case — I just want to glance and know.

---

## Step 8: First Calendar View (calendar.tsx)

I tap the "Lich" (Calendar) tab. As a Sun user, I get a simplified view:

- **Header:** "Lich chu ky" (Cycle Calendar) + "Chu ky cua Moon trong tam mat" (Your Moon's cycle at a glance)
- **Content:** A centered card with:
  - A moon icon (40px, pink)
  - Title: "Da dong bo chu ky Moon" (Moon's cycle is synced) — if linked. Or "Chua lien ket" (Not linked yet) if not.
  - Body: "Du doan va lich giai doan cua Moon se hien o day khi co ay cap nhat chu ky trong Cai dat." (Moon's predictions and phase calendar will appear here once she logs her cycle in Settings.)

**First-person reaction:** Wait, that's it? I expected to see an actual calendar with Linh's cycle marked on it. Instead I get a placeholder message saying predictions will appear "when she logs her cycle in Settings." This is confusing because I just linked — shouldn't her cycle data already be here?

Honestly, this feels empty. The dashboard gave me so much useful info (phase, day, countdown, mood, advice), but the calendar tab is just a message saying "coming soon, depends on her." I feel like I tapped into an unfinished feature.

**Confusion:** The calendar tab for Sun users doesn't show an actual calendar — it shows a static informational card. The actual `Calendar` component (react-native-calendars) only renders for Moon users. Sun users get the `sunEmptyCard` view, which is centered text with an icon. Even when linked and cycle data is available (the dashboard already shows phase/day data from `partnerCycleSettings`), the calendar tab doesn't use it to render a visual calendar.

**Technical observation:** The code checks `role === 'sun'` and returns early with the empty card view, regardless of whether `partnerCycleSettings` exists. The dashboard proves the cycle data IS available — so the calendar could theoretically show it. This feels like a deliberate product choice or an unimplemented feature.

**The Skip Test:** Nothing to skip. I tap in, see the message, tap back to Today. This tab adds no value for Sun users currently.

**Impact:** This is a missed opportunity. A visual calendar showing Linh's predicted periods, fertile windows, and ovulation days would be extremely useful. I'd want to check "is next weekend going to be a bad time to plan a trip?" The dashboard gives me today's info; the calendar would give me future planning capability.

---

## Step 9: Settings Exploration (settings.tsx)

I tap the "Cai dat" (Settings) tab. Here's what I see as a Sun user:

**ACCOUNT section:**
- Avatar picker (default user icon, "Nhan de doi anh" = tap to change photo)
- Email: my email address (read-only display)
- Display Name: text input with "Ten cua ban" placeholder + checkmark to save
- Language: toggle between EN/VI (currently shows "VI" badge + "Tieng Viet")
- Role: shows "Sun" with a chevron — tapping shows a destructive confirmation: "Doi vai tro / Dieu nay se dat lai trai nghiem. Ban co chac khong?" (Change Role / This will reset your experience. Are you sure?)

**PARTNER section (Sun-only):**
- If not linked: "Ket noi voi Moon de xem chu ky va nhan Thi tham." (Connect with your Moon to see her cycle and receive Whispers) + "Ket noi ngay" button
- If linked: Green checkmark badge "Da ket noi Moon" (Moon connected), current phase display (e.g., "Kinh nguyet - Day 3"), and days until next period

**No other sections for Sun.** Moon users get Health Data, Cycle Settings, and Notifications sections, but these are all hidden behind `role === 'moon'` conditionals. Sun users only see Account + Partner.

**Sign Out button** at the bottom in red.

**First-person reaction:** The settings are minimal for Sun. Account info, language toggle, partner status. That's fine — I don't need to configure cycle lengths or notifications because that's Linh's domain.

The partner section when linked is nice — it mirrors the dashboard's phase info. The green "Da ket noi Moon" badge gives me confidence the connection worked.

**What surprised me:** No notification settings for Sun. The code comment in CLAUDE.md says "Sun notifications are ALWAYS ON" — so there's no toggle. But I wasn't told this anywhere. I'd expect at least a display saying "Notifications: Always on" so I know what to expect. Instead, there's just... nothing about notifications. I'll get push notifications without ever being asked or informed.

**Display name issue:** I notice the display name input has a placeholder "Ten cua ban" (Your name) but it wasn't part of onboarding. I have to discover this in Settings. The dashboard greeting currently says "Chao, Sun" because I never set my name. This should have been part of the onboarding flow — even one extra field asking "What should we call you?" would make the dashboard feel personal from the start.

**Language toggle:** Tapping the language row toggles between EN and VI instantly. No confirmation, no reload. The whole UI redraws in the new language. This is slick. I tap it to English and back to Vietnamese to confirm it works. Good i18n implementation.

**The Skip Test:** I can skip Settings entirely and never come back. Everything works without touching it. The display name defaults to "Sun" which is functional. But I'd miss the chance to personalize my greeting.

---

## Overall Assessment

### Value Proposition Clarity

Can I articulate what the app does for me? **Yes, after the UnlinkedScreen.** The four benefit cards made it crystal clear: (1) see her cycle status, (2) get daily advice, (3) receive her whisper signals, (4) reduce conflict. The dashboard then delivers on promises 1 and 2 immediately. Promises 3 and 4 require ongoing use.

Before the UnlinkedScreen, the value was unclear. The auth screen says "Start your journey together" which is vague. The onboarding screen says "Stay in tune & know how to show up" which is better but still abstract. The UnlinkedScreen is where the pitch actually lands.

### Notifications Prompt Reaction

I was **never asked** about notifications during onboarding. The app presumably requests notification permissions at some point (likely in `_layout.tsx` via `useNotifications` hook), but I didn't observe it during this flow walkthrough. As a Sun user whose notifications are "always on," I'd expect:

1. A system notification permission prompt (iOS standard)
2. Some context about WHY I should allow notifications ("You'll be notified when Moon needs you")

Without context, I might deny the prompt, which would break the core Whisper/SOS feature. This is a significant gap.

### The Complete Skip Test Summary

| Step | Can I skip? | What do I miss? |
|------|-------------|-----------------|
| Auth | No | N/A — required |
| Email verification | No | N/A — required |
| Role selection | No | N/A — required (one tap) |
| UnlinkedScreen | Partially — can go to other tabs | Miss the value pitch, but can enter code later |
| Partner code entry | Yes, can delay | Dashboard stays on UnlinkedScreen |
| Display name | Yes | Greeting says "Sun" instead of my name |
| Settings exploration | Yes | Miss language toggle, partner status |

**If I tap as fast as possible:** Auth (2 taps) -> email verify (1 tap in email) -> role select (1 tap) -> enter code (type 6 digits + 1 tap) -> done. About 5 taps + typing. That's fast. I can use the app fully without reading anything except the code input label.

### Emotional Journey

| Step | Emotion | Intensity |
|------|---------|-----------|
| Receiving invite | Mild curiosity | Low |
| App name/icon first impression | Slight skepticism | Low |
| Pink splash spinner | "Girl's app" suspicion | Medium |
| Auth screen | Neutral — standard | Low |
| Email verification | Mild annoyance | Medium |
| Role selection | "Oh, there's a role for me" | Medium-positive |
| UnlinkedScreen benefits | "This actually makes sense" | High-positive |
| Code entry + link | Satisfying haptic | Medium-positive |
| First dashboard | "OK, this is useful" | High-positive |
| Calendar tab | Disappointment | Medium-negative |
| Settings | Neutral, minimal | Low |

### Key Issues Found

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | HIGH | No notification permission prompt context — Sun user may deny notifications, breaking core Whisper/SOS feature | Onboarding flow |
| 2 | HIGH | Calendar tab is empty for Sun users despite cycle data being available — missed opportunity for planning | `app/(tabs)/calendar.tsx` lines 36-56 |
| 3 | MEDIUM | No display name prompt during onboarding — dashboard greeting defaults to generic "Sun" | `onboarding.tsx` / `SunDashboard.tsx` |
| 4 | MEDIUM | Tab bar active color is pink (`Colors.menstrual`) even for Sun users — should use amber (`SunColors.accentPrimary`) | `app/(tabs)/_layout.tsx` line 13 |
| 5 | MEDIUM | First app impression (splash spinner) uses pink accent before role is known — could use neutral color | `app/index.tsx` |
| 6 | LOW | "✦ AI" label in guide card title contradicts "no AI terminology in UI" design rule | `SunDashboard.tsx` lines 156-157 |
| 7 | LOW | App name "Easel" gives no indication of purpose — affects cold organic discovery | Branding |
| 8 | LOW | Share invite message contains URL `https://easel.app` but no App Store deep link | `partner.json` inviteMessage |

### Recommendations

1. **Add a notification primer screen** after role selection for Sun users: explain that Whisper and SOS alerts require notifications, show what they look like, THEN trigger the iOS permission prompt. Frame it as: "Moon can send you quiet signals when she needs you. Allow notifications so you never miss one."

2. **Build a real calendar for Sun users** using `partnerCycleSettings` data. Show predicted periods, fertile windows, and ovulation days on an actual calendar. This enables forward planning, which is a top use case for boyfriends.

3. **Add a display name step to onboarding** — a single screen after role selection: "What should Moon call you?" One text input, one button. Makes the dashboard personal from minute one.

4. **Theme the tab bar per role** — Sun users should see amber (`#F59E0B`) active tab icons, not pink. The dashboard and UnlinkedScreen already use `SunColors` correctly; the tab bar is the only holdout.

5. **Use a neutral splash color** — the initial loading spinner could use `Colors.textHint` (grey) instead of `Colors.menstrual` (pink) since the role is unknown at that point.

### Final Verdict

**Emotional state: Cautiously bought in.**

The UnlinkedScreen and first dashboard view genuinely impressed me. The amber Sun theme feels like my space, not a bolt-on to a period app. The daily guide cards give me actionable intel I've never had before. But the empty calendar tab and the missed notification setup are real gaps. If Whisper/SOS alerts work well over the next week — if Linh sends me a "need a hug" signal and I actually get notified — I'll be a convert. If notifications were silently blocked because I wasn't primed to accept them, I'll think the app is broken and delete it within a week.

The app has about 7 days to prove itself before it lands in my "unused" folder.
