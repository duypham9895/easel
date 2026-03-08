# User Persona Testing Report

---
session: UPT_20260308_001
persona: Linh
date: 2026-03-08
tester: Claude Opus 4.6 (persona simulation)
app_version: v1.5.1
language: Vietnamese (vi)
platform: iOS
flow: Moon onboarding (first-time user)
device_context: iPhone in bed, low brightness, dark mode expected
---

## Persona Profile

**Linh**, 26, graphic designer, works from home. Medium tech comfort — uses apps daily but skips instructions. Prefers Vietnamese for personal apps. Emotionally expressive, detail-oriented about health, impatient with complex UI. Tried Flo and Clue but found them too clinical. Fears data exposure and partner weaponizing data. Checks phone in morning, logs in bursts, 147 unread notifications. Uses phone in bed with low brightness.

---

## 1. App Opening — First Impression

My first thought was: "Oh, it's loading." A plain white screen with a small pink spinner in the center. No logo, no branding, no splash art — just `#FBFBFD` background with a `#FF5F7E` ActivityIndicator.

**What I understood:** The app is loading something. Okay, fine.

**What confused me:** Nothing yet, but it felt... empty? Flo has this whole branded splash with their flower. Clue has their ring. This is just a spinner on off-white. At low brightness in bed, the white background is literally blinding. I squint and wait.

**Emotional reaction:** Neutral, slightly disappointed. For an app called "Easel" (which sounds artsy?), the first impression is surprisingly bare.

**Technical observation:** The splash/index screen (`app/index.tsx`) uses `Colors.background` which is `#FBFBFD` — a nearly-white color. At low brightness on an OLED display in a dark room, this is a flash-bang grenade to my eyes. There is no dark mode support at this entry point. The `MoonColors.background` (`#0D1B2A`) exists but isn't applied until after role selection.

**Duration:** Maybe 1-2 seconds, but it feels longer because there's nothing to look at.

> **Issue [P2]:** Splash screen has no branding and uses light theme regardless of system dark mode preference. First impression is a white flash in a dark room.

---

## 2. Authentication — Sign Up

The screen loads and I see a heart icon inside a soft pink circle, the word "Easel" in big bold letters, and below it: **"Bat dau hanh trinh cung nhau."** Wait — it says "Bat dau hanh trinh cung nhau." in Vietnamese.

Okay, actually let me re-read: "Bat dau hanh trinh cung nhau." — "Start your journey together." That's... cute. The tagline switches between "Chao mung tro lai." (Welcome back) for sign-in and "Bat dau hanh trinh cung nhau." (Start the journey together) for sign-up. I like "hanh trinh cung nhau" — it implies this is a couples thing right away.

**Vietnamese quality check:** "Bat dau hanh trinh cung nhau" — natural Vietnamese. "Dia chi email" for email address — correct. "Mat khau" for password — correct. "Dang ky" for Sign Up — correct. "Chua co tai khoan?" — natural phrasing. The Vietnamese here reads like a native wrote it, not Google Translate. I'm impressed.

**What I did:** I tap "Dang ky" (Sign Up) at the bottom. I type my email. The keyboard pops up. I tap the password field — the `returnKeyType="next"` on email lets me hit Next to jump to password, which is nice. I type a password.

**Password strength indicator:** As I type "linh2000", I see a strength bar appear — three segments. Two light up orange, and it says "Trung binh" (Fair). I add a "!" and it turns green: "Manh" (Strong). This is helpful — I didn't have to guess what makes a "strong" password. The Vietnamese labels (Yeu/Trung binh/Manh) are natural.

**What confused me:** The minimum password length is 6 characters (from `password.length >= 6`), but the strength indicator doesn't tell me this. If I type "abc", I see "Yeu" (Weak) but I don't know the button is disabled because my password is too short. The disabled state is just `opacity: 0.4` — at low brightness, I might not notice the difference.

**What felt right:** The pink accent color (#FF5F7E) feels warm, not clinical. The gradient glow in the top-left corner is subtle. This already feels different from Flo's sterile blue/white.

**Privacy moment:** None yet. I'm giving my email and password — standard stuff. No social login, no Google/Apple sign-in. Just email. This is both reassuring (no third-party data sharing) and slightly inconvenient (I have to remember yet another password).

**After submission:** The app shows a verification screen — a big mail icon in a pink circle, "Kiem tra hop thu" (Check your inbox), and my email highlighted in pink. Below: "Nhan vao link trong email de xac minh tai khoan, sau do quay lai dang nhap." This is clear. There's a "Chua nhan duoc? Gui lai email" resend link. Good.

**Emotional reaction:** Mildly annoyed at email verification (I just want to use the app!), but it's standard. The screen looks nice.

> **Issue [P3]:** No indication of minimum password length requirement. The disabled button at 0.4 opacity is hard to distinguish at low brightness.
>
> **Issue [P3]:** No Apple/Google sign-in option. For a personal app, email-only auth adds friction.

---

## 3. Role Selection — Choosing Moon

After verifying my email and signing back in, I land on the onboarding screen. My first thought: "Oooh."

The screen says "Chao mung den" (Welcome to) in small gray text, then **"Easel"** in huge 48px bold text, and below: "Chon vai tro de ca nhan hoa trai nghiem. Hieu nhau bat dau tu day." (Choose your role to personalize your experience. Understanding each other starts here.)

**Vietnamese quality:** "Hieu nhau bat dau tu day" is a beautiful phrase — "Understanding each other starts here." It's warm, relational, and doesn't sound translated. This is the first moment I think, "Oh, this app gets it."

**The two cards:**

1. **"Em la Moon"** (I am Moon) — moon icon, pink tint, subtitle: "Theo doi chu ky & thi tham voi Sun khi em can" (Track your cycle & whisper to your Sun when you need them)
2. **"Anh la Sun"** (I am the Sun) — sun icon, blue tint, subtitle: "Luon dong dieu & biet cach xuat hien dung luc cho Moon" (Stay in tune & know exactly how to show up for your Moon)

**My reaction:** I love this. The Moon/Sun metaphor is immediately clear. I'm the Moon — I'm the one being tracked, being cared for. My boyfriend is the Sun — he's the one who shows up. The gendered language ("Em" for girlfriend, "Anh" for boyfriend) is perfect Vietnamese — it uses the natural intimate pronouns couples use. This feels like it was made for Vietnamese couples.

**What I noticed:** The word "thi tham" (whisper) is intriguing. I don't know what it means in this context yet, but it sounds intimate, not medical. "Whisper to your Sun when you need them" — that's so much better than "Send your partner a notification."

**What confused me:** Nothing. This screen is clear, beautiful, and fast. Two choices, tap one, done.

**Hesitation moment:** I did pause for one second — the subtitle for Sun says "Luon dong dieu" (stay in tune). I wondered briefly if my boyfriend would actually install this. But that's a relationship concern, not a UX one.

**Footer note:** "Ban co the doi vai tro bat cu luc nao trong Cai dat." (You can change your role anytime in Settings.) — Good to know, reduces commitment anxiety.

I tap "Em la Moon." I feel a haptic tap. Satisfying.

> **Positive:** Role selection is the strongest screen so far. The Moon/Sun metaphor, Vietnamese pronouns, and "whisper" language are emotionally resonant. This is where I first felt the app understood me.

---

## 4. Health Sync Flow — All Sub-Screens

### 4a. Education Screen

The screen shifts to a **dark indigo background** (`#0D1B2A`). Wait — the whole aesthetic just changed. It went from bright white to deep dark blue. This is the Moon theme.

**My immediate reaction:** "Oh, this is pretty." The dark theme feels like nighttime, like something private and intimate. A heart icon with a phone badge sits in a soft purple circle. Below:

**"Du doan chinh xac hon bat dau tu du lieu cua ban"** (Better predictions start with your data)

Then: "Easel co the doc du lieu chu ky tu Apple Health de dua ra du doan chinh xac ngay tu ngay dau tien." (Easel can read your past cycle data from Apple Health to give you accurate predictions from day one.)

**Three bullet points:**
- "Chi doc du lieu chu ky kinh nguyet" (We only read menstrual cycle data) — check-circle icon
- "Du lieu luon o tren thiet bi cua ban" (Your data stays on your device) — lock icon
- "Ban co the ngat ket noi bat cu luc nao trong Cai dat" (You can disconnect anytime in Settings) — settings icon

**Privacy moment — THIS IS IT.** This is when I first thought about who sees my data. The bullet points are exactly what I needed to see. "Chi doc" (read-only), "luon o tren thiet bi" (stays on your device), "ngat ket noi bat cu luc nao" (disconnect anytime). Three concerns, three answers.

At the very bottom, a small privacy badge: "Chi doc · Rieng tu · Du lieu cua ban, quyen cua ban" (Read-only · Private · Your data, your choice). The shield icon next to it is a nice touch.

**Vietnamese quality:** Excellent. "Du lieu cua ban, quyen cua ban" (Your data, your choice) is natural and empowering.

**Two buttons:**
1. Primary (purple, full width): "Tiep tuc voi Apple Health" (Continue with Apple Health)
2. Secondary (underlined text): "Nhap thu cong" (Enter manually instead)

**My decision:** I tap "Nhap thu cong" (Enter manually). Why? Because:
1. I don't trust apps with health data access on first use — I want to see the app first, then maybe grant access later
2. The secondary option being there without guilt or pressure is perfect. It doesn't say "Skip" (which implies I'm missing out) — it says "Enter manually instead" (which implies I'm still getting the full experience)

**What I appreciated:** No guilt trip. No "Are you sure?" popup. No dark pattern. Just a clean choice.

> **Positive [Critical]:** The privacy communication on this screen is outstanding. Three concise bullet points with icons address the exact fears I have. The "enter manually" option respects my autonomy without making me feel like a second-class user.

### 4b. Manual Cycle Input

New screen: **"Chia se ve chu ky cua ban"** (Tell us about your cycle)

**Three input sections:**

**1. Last period start date:**
"Ky kinh gan nhat bat dau khi nao?" (When did your last period start?)

A date picker button shows a pre-filled date (2 weeks ago). I tap it, and a dark-themed iOS spinner appears (`themeVariant="dark"`). Good — it matches the dark background.

When I pick a date, it shows: "8 thang 3, 2026" in Vietnamese locale format. Wait, actually it would format as a Vietnamese long date. That looks natural.

**2. Cycle length:**
"Do dai chu ky trung binh" (Average cycle length)
Helper text: "So ngay tu ngay dau ky kinh nay den ngay dau ky tiep theo" (Days from the start of one period to the start of the next)

A stepper control: minus button, "28" in large text, "ngay" (days) below, plus button.

**My reaction:** I know roughly that my cycle is about 30 days. I tap plus twice. Easy.

**But wait — do I actually know this?** The helper text explains what "cycle length" means. Good. Without it, I might confuse "cycle length" with "period length." Flo never explained this to me clearly.

**3. Period length:**
"Do dai ky kinh trung binh" (Average period length)
Helper: "Ky kinh thuong keo dai bao nhieu ngay" (How many days your period usually lasts)

Default is 5 days. Mine is usually 4-5, so I leave it.

**"Not sure" checkbox:**
"Toi khong chac ve chu ky" (I'm not sure about my cycle)

I tap this out of curiosity. It checks, and the steppers dim (opacity 0.4). An explanation appears: "Khong sao! Chung toi se dung gia tri trung binh (chu ky 28 ngay, kinh 5 ngay) va cai thien du doan khi ban ghi nhan them." (No worries! We'll use typical averages and improve predictions as you log more data.)

**My emotional reaction:** "Khong sao!" (No worries!) — this one phrase made me relax. Period tracking apps always make me feel like I should know my exact numbers. This one says "it's fine if you don't." I unchecked it because I do know my numbers, but I love that the option exists.

**Prediction preview:**
A highlighted card at the bottom shows: "Ky kinh tiep theo du kien khoang [date]" (Next period expected around [date])

**First Value Moment:** THIS. Right here. I entered three numbers and immediately got a prediction. No "complete 3 months of tracking first." No "we need more data." Just an instant answer. My first thought was: "Oh, this is actually useful."

I tap "Tiep tuc" (Continue).

> **Positive [Critical]:** The "not sure" toggle with "Khong sao!" is an empathy masterpiece. The instant prediction preview delivers immediate value.
>
> **Issue [P3]:** The "Done" button on the iOS date picker spinner says "Done" in English, not Vietnamese. This is hardcoded in `ManualCycleInput.tsx` line 152: `<Text style={styles.doneDateText}>Done</Text>`. Should be "Xong".

### 4c. Cycle Data Review

New screen: **"Tom tat chu ky"** (Your cycle summary)

A badge says "Nhap thu cong" (Entered manually) with a pen icon. Below, a summary card:

| | |
|---|---|
| Ky kinh gan nhat | 22 thang 2, 2026 |
| Do dai chu ky | 30 ngay |
| Do dai ky kinh | 5 ngay |

Then a highlighted prediction card: "Ky kinh tiep theo du kien khoang" followed by a large purple date.

**Confidence indicator:** A badge says "Do tin cay thap" (Low confidence) in pink, with: "Dua tren du lieu han che — du doan cai thien khi ban ghi nhan them ky kinh" (Based on limited data — predictions improve as you log more periods).

**My reaction:** The confidence indicator is honest. It's not pretending to be accurate with one data point. The pink color for "low confidence" is attention-getting without being alarming.

**"How does this work?" toggle:** I see "How does this work?" — wait, this is in English! The expandable toggle says "How does this work?" and "Hide" in English, not Vietnamese.

**Issue found!** In `CycleDataReview.tsx` lines 131-133:
```
<Text style={styles.explanationToggleText}>
  {showExplanation ? 'Hide' : 'How does this work?'}
</Text>
```
These strings are hardcoded in English and not passed through `t()`.

When I expand it, the explanation IS in Vietnamese: "Du doan dua tren do dai chu ky trung binh 30 ngay cua ban..." — this is well-written and clear.

**Two buttons:**
- "Chinh sua" (Edit) — underlined, secondary
- "Dung roi, bat dau thoi!" (Looks good, let's go!) — purple primary button

"Dung roi, bat dau thoi!" is a delightful CTA. It's informal, enthusiastic, and feels like a friend saying "Let's do this!" I tap it.

> **Issue [P1]:** "How does this work?" and "Hide" are hardcoded in English in `CycleDataReview.tsx`. Must be localized.
>
> **Issue [P3]:** "Done" button in date picker (ManualCycleInput.tsx) is hardcoded English.
>
> **Positive:** "Dung roi, bat dau thoi!" (Looks good, let's go!) is warm and delightful copy.

---

## 5. First Dashboard View

The dashboard loads. Deep dark indigo background. At the top:

**Greeting:** A loading spinner appears briefly, then a greeting replaces it. The static fallback would be something like "Nghi ngoi cung la lam viec hieu qua. Hay nhe nhang voi ban than hom nay." (Rest is productive. Let today be gentle.) — this is for menstrual phase. But depending on which phase I'm in based on my input, I'll see the appropriate greeting.

If the AI proxy is configured, the greeting is replaced with a personalized AI version, marked with a small "AI" label below. The label shows as a tiny gray text.

**Phase tagline chip:** A colored pill shows the current phase name and tagline, like "Kinh nguyet · Nghi ngoi & Phuc hoi" (Menstrual · Rest & Restore) or "Nang truong · Nang luong dang trao" (Follicular · Rising Energy).

**Vietnamese phase names:**
- Kinh nguyet (Menstrual)
- Nang truong (Follicular)
- Rung truong (Ovulatory)
- Hoang the (Luteal)

**My reaction to phase names:** "Nang truong" and "Hoang the" are medical terms. I don't use these words in daily life. "Kinh nguyet" I know — that's common. "Rung truong" I've heard. But "Nang truong" (follicular) and "Hoang the" (luteal) are textbook terms. The taglines help: "Nang luong dang trao" (Rising Energy), "Lang diu" (Wind Down) — these explain the phase in human language.

**Invite Sun banner:** A subtle card with a link icon: "Chia se ma voi Sun de ket noi" (Share your code with your Sun to connect). With a chevron arrow.

**Partner invitation — how did it feel?** It's a soft nudge, not a gate. I can use the entire app without inviting my boyfriend. The banner is one line, low-key, and tappable. It doesn't block anything. No popup, no "INVITE YOUR PARTNER NOW!" urgency.

But I do pause here. My first thought: "If I share my code with him... what exactly will he see?" The app doesn't explain this at the banner level. I'd want to know: Will he see my mood? My symptoms? Just my phase? Everything?

**The Phase Wheel:** A large circular visualization dominates the center of the screen. A 240px colored circle shows the phase name at the top, a huge day number in the center (like "14"), and a pill badge at the bottom: "Con X ngay" (X days left). The circle pulses gently with an animated glow. The progress ring shows how far through the cycle I am.

**My emotional reaction:** Beautiful. This is the centerpiece of the app and it looks like jewelry. The pulsating animation is subtle and calming. The phase color fills the entire circle. At low brightness in bed, the dark background with the glowing circle looks stunning. This is the "ooh" moment.

**Whisper button:** Below the wheel, a full-width rounded button in the phase color: "Thi tham voi Sun" (Whisper to your Sun) with a send icon. This is prominent — you can't miss it.

**Insight cards:** Two side-by-side cards:
1. "Kha nang thu thai" (Conception Chance) — shows "Thap" (Low), "Trung binh" (Medium), or "Rat cao" (Very High)
2. "Cham soc ban than" (Self-Care) — shows phase-specific advice like "Co the ban xung dang duoc nghi ngoi..." (Your body deserves rest...)

**Phase description card:** "Ve giai doan nay" (About this phase) — with a detailed paragraph. For menstrual: "Ban co the cam thay met moi va de xuc dong hon binh thuong. Co the ban dang lam viec rat vat va." (You may feel tired and more emotional than usual. Your body is working very hard.)

**Vietnamese quality of phase content:** The moonMood translations are natural and empathetic. "Co the ban dang lam viec rat vat va" (Your body is working very hard) — this personifies my body as doing labor, not just bleeding. I feel seen.

**Daily Check-In:** At the bottom, a card: "Hom nay ban cam thay the nao?" (How are you feeling today?)

Five mood options: Te (Bad) / Binh thuong (Meh) / On (Okay) / Tot (Good) / Tuyet (Great) — numbered 1-5.

Symptom chips: Dau bung (Cramps), Day hoi (Bloating), Dau dau (Headache), Met moi (Fatigue), Nhay cam (Tender), Thay doi tam trang (Mood swings), Ra mau nhe (Spotting), Them an (Cravings).

**My reaction:** The symptom chips are exactly the right level of detail. Not too many (Flo has like 50 options), not too few. "Them an" (Cravings) — yes, that's me. I tap Mood 3 (On) and Cravings, then hit "Ghi nhan & nhan goi y" (Log & get insight).

The button text includes a sparkle symbol. After tapping, it saves and shows "Dang suy nghi ve ngay cua ban..." (Thinking about your day...) with a spinner, then an AI insight appears.

**Vietnamese quality of check-in:** All symptom labels are natural, colloquial Vietnamese. "Them an" (Cravings) is more natural than the formal "Thay doi khau vi." Good.

> **Positive [Critical]:** The Phase Wheel is the visual centerpiece and it's gorgeous. This is the screenshot I'd share with friends. The dark theme works beautifully at low brightness.
>
> **Issue [P2]:** The "AI" label in the greeting shows as plain text with a sparkle character. At font size 11 (Typography.tiny), this is very small and may be invisible at low brightness. Consider whether this badge needs to exist for Moon users at all — the product rule says "No AI terminology in UI."
>
> **Issue [P2]:** The invite-your-partner banner doesn't explain what data the partner will see. This is a privacy concern — I need to know before I share.
>
> **Issue [P3]:** "Hoang the" (Luteal) and "Nang truong" (Follicular) are medical terms most young Vietnamese women don't use casually. The taglines compensate, but a tooltip or simpler label option would help.

---

## 6. First Calendar View

I tap the "Lich" (Calendar) tab at the bottom.

**Tab bar:** Three tabs — "Hom nay" (Today), "Lich" (Calendar), "Cai dat" (Settings). The active tab is pink (#FF5F7E). The tab bar background is white (`Colors.card = #FFFFFF`).

**Wait — white tab bar on dark dashboard?** The dashboard background is dark indigo (#0D1B2A), but the tab bar uses `Colors.card` which is `#FFFFFF`. This is the shared light theme card color, not the Moon theme card color (`#162233`). The contrast is jarring — dark screen, bright white bottom bar.

The calendar screen loads. Title: "Lich chu ky" (Cycle Calendar). Subtitle: "Du doan cho 3 chu ky tiep theo" (Predictions for the next 3 cycles).

**The calendar itself:** A standard month calendar view on a white card background. The theme uses `calendarBackground: Colors.card` which is white (#FFFFFF). On the dark background page, this white calendar card stands out strongly.

**Color-coded dates:**
- Pink dots = predicted period days
- Blue dots = fertile window
- Orange dots = ovulation day
- Dark dot = today

**Legend:** Below the calendar, a card explains each color:
- "Ky kinh (du doan)" (Period - predicted) — pink
- "Cua so thu thai" (Fertile window) — blue
- "Ngay rung truong" (Ovulation day) — orange
- "Hom nay" (Today) — dark

**My reaction:** The color coding is clear. I can immediately see when my next period is predicted. The legend is right there — I don't have to guess. "Cua so thu thai" (Fertile window) is a term I know from sex ed. Good.

**Tapping a day:** I tap on a predicted period day. A modal slides up from the bottom with:
- The date formatted in Vietnamese: "Thu hai, ngay 24 thang 3" (Monday, March 24)
- "Ngay 14 cua chu ky" (Day 14 of cycle)
- Phase badge with color
- "Dang dien ra" (What's happening) section with mood description
- "Meo cham soc ban than" (Self-care tip) section

**My reaction:** This is wonderful. Tapping any day gives me phase info AND a self-care tip. I tapped tomorrow out of curiosity and got a personalized tip for that phase. This is the kind of forward-looking info that makes me want to check back daily.

**First Value Moment (reinforced):** The calendar with predicted dates 3 cycles ahead is deeply valuable. I can plan vacations, dates, even workouts around my predicted phases. This goes beyond Flo's basic "your period is in X days."

> **Issue [P1]:** Tab bar uses white `Colors.card` (#FFFFFF) while the Moon dashboard/calendar use dark `MoonColors.background` (#0D1B2A). This creates a harsh white strip at the bottom of an otherwise beautiful dark UI. The tab bar should use `MoonColors.card` (#162233) for Moon users.
>
> **Issue [P2]:** Calendar card background is white (`Colors.card`) on a dark page. Should use Moon theme colors for consistency.
>
> **Positive:** Day detail modal is rich and useful. The self-care tips per day are a differentiator.

---

## 7. First Settings View

I tap "Cai dat" (Settings).

**Title:** "Cai dat" in large bold text.

**Account section (TAI KHOAN):**
- Avatar picker (generic user icon, "Nhan de doi anh" — Tap to change photo)
- Email row showing my email
- Display name input with placeholder "Ten cua ban" (Your name) — there's a check icon to save
- Language toggle: Shows "VI" badge in red, "Tieng Viet" with a chevron
- Role: Shows "Moon" with a chevron to change

**My reaction:** Clean layout. The language toggle is a single tap — it switches between VI and EN. No dropdown, no separate screen. One tap. Nice.

**Display name observation:** The placeholder says "Ten cua ban" (Your name). I type "Linh" and tap the check mark. It saves. But I notice the placeholder text — previously there was a reported bug about it being truncated and letter-spaced on this screen. If that's fixed, good.

**Partner Link section (LIEN KET DOI TAC):**
"Chia se ma 6 chu so nay voi Sun de cung theo doi chu ky." (Share this 6-digit code with your Sun to track the cycle together.)

A button: "Tao ma lien ket" (Generate link code). I tap it, a spinner appears, and then a large 6-digit code displays with letter-spacing 8. Below: "Bao anh ay nhap ma nay trong Easel" (Tell him to enter this code in Easel).

A share button: "Chia se ma" (Share code) — opens the native share sheet with a pre-written message: "Ma ket noi Easel cua em la: XXXXXX. Tai Easel va nhap ma nay de ket noi voi em nhe." (My Easel connection code is: XXXXXX. Download Easel and enter this code to connect with me.)

**Partner invitation — how it felt:** Much better now that I can see the mechanism. It's a code I share, not an email invite that exposes my email. The share message is written in Vietnamese using couple pronouns ("em"/"anh"). The tone is natural — it sounds like a text I'd actually send my boyfriend.

**But my privacy concern lingers:** I still don't know exactly what he'll see when connected. Will he see my daily mood logs? My symptoms? Just my phase? The settings screen doesn't have a "What your partner sees" explanation anywhere.

**Health Data section (DU LIEU SUC KHOE):**
"Dong bo lai lich su chu ky tu Apple Health de cai thien du doan." (Re-sync cycle history from Apple Health to improve predictions.)

This is where I could connect Health later — fulfilling the promise from the education screen. Good.

**Cycle Settings section (CAI DAT CHU KY):**
Three fields — cycle length, period length, last period start date. A "Luu cai dat chu ky" (Save cycle settings) button.

The date picker here uses a spinner (iOS). The date displays in Vietnamese locale: "24 thang 2, 2026".

**Notifications section (THONG BAO):**
Four toggles:
1. "Sap den ky kinh" (Period approaching) — ON
2. "Da bat dau ky kinh" (Period started) — ON
3. "Da ket thuc ky kinh" (Period ended) — ON
4. "Nhac nho thong minh" (Smart timing) — ON

When I toggle "Nhac nho thong minh" OFF, a new row appears: "So ngay truoc ky kinh" (Days before period) with a minus/plus stepper showing "3".

**My reaction:** "Nhac nho thong minh" (Smart timing) — this is the AI timing feature, but it doesn't say "AI." It says "Smart timing." That follows the product design rule: no AI terminology in UI. Good.

**What I noticed:** There's no toggle for Whisper alerts or SOS alerts. The product rule says these are always on. But as a first-time user, I didn't even know what Whispers or SOS were yet — so not seeing toggles for them here is fine. They haven't been explained yet.

**Sign Out button:** At the very bottom, "Dang xuat" (Sign out) in red. Standard.

**Overall settings reaction:** Comprehensive without being overwhelming. The section labels in ALL CAPS gray text (TAI KHOAN, LIEN KET DOI TAC, etc.) help scan quickly. Vietnamese section labels are natural.

> **Issue [P2]:** No explanation anywhere of what the partner can see when linked. This is a critical privacy communication gap for a couples app.
>
> **Issue [P3]:** Settings background uses `Colors.background` (#FBFBFD — light) while the rest of Moon's experience uses `MoonColors.background` (#0D1B2A — dark). The settings page is a jarring switch back to light mode.
>
> **Positive:** Share code mechanism with pre-written Vietnamese couple message is thoughtful. Language toggle is fast (single tap).

---

## Summary Scorecard

### Emotional Journey Map

| Step | Emotion | Score (1-5) | Notes |
|------|---------|-------------|-------|
| Splash | Neutral/Blinded | 2 | White flash in dark room |
| Auth | Standard | 3 | Clean but no Apple Sign-In |
| Email Verification | Mildly annoyed | 3 | Standard but adds friction |
| Role Selection | Delighted | 5 | Moon/Sun metaphor is beautiful |
| Health Education | Reassured | 5 | Privacy messaging is perfect |
| Manual Input | Empowered | 5 | "Not sure" toggle, instant prediction |
| Review | Confident | 4 | Confidence indicator is honest |
| Dashboard | Amazed | 5 | Phase Wheel is stunning |
| Calendar | Impressed | 4 | Useful but theme mismatch |
| Settings | Satisfied | 3 | Functional but light mode jarring |

### First Value Moment

**Screen:** Manual Cycle Input — prediction preview card
**Timestamp in flow:** ~3 minutes into onboarding
**Trigger:** Entering basic cycle info and immediately seeing "Ky kinh tiep theo du kien khoang [date]"
**Emotion:** "Oh, this is actually useful — I can plan around this"

### Privacy Journey

| Moment | Concern Level | App Response |
|--------|---------------|--------------|
| Email signup | Low | Standard auth, no social login exposure |
| Health sync education | High | Three bullet points + privacy badge = excellent |
| Manual data entry | Medium | Data feels contained to device |
| Partner invite banner | High | No explanation of what partner sees |
| Partner code sharing | Medium | Code-based (not email), good mechanism |
| Settings | Medium | No "what your partner sees" section |

### Vietnamese Translation Quality

| Area | Quality | Notes |
|------|---------|-------|
| Auth screen | Excellent | Natural phrasing, proper Vietnamese |
| Onboarding roles | Exceptional | "Em"/"Anh" pronouns, "thi tham" (whisper) |
| Health sync flow | Excellent | "Khong sao!" empathy, clear medical terms |
| Phase names | Good | Medical terms (Hoang the, Nang truong) offset by human taglines |
| Dashboard | Excellent | Greeting fallbacks are poetic and warm |
| Calendar | Excellent | "Cua so thu thai" properly localized |
| Settings | Excellent | Section labels, code sharing message natural |
| **Overall** | **9/10** | Reads like native Vietnamese, not translation |

### Bugs Found

| ID | Severity | Screen | Description |
|----|----------|--------|-------------|
| B1 | P1 | CycleDataReview | "How does this work?" and "Hide" hardcoded in English (line 131-133) |
| B2 | P1 | Tab bar (_layout.tsx) | White tab bar (#FFFFFF) on dark Moon theme creates harsh contrast |
| B3 | P2 | Splash/Index | No dark mode support — white flash in dark room |
| B4 | P2 | Dashboard | "AI" label violates "No AI terminology in UI" product rule |
| B5 | P2 | Dashboard + Settings | No explanation of what partner sees when linked |
| B6 | P2 | Calendar | Calendar card uses light theme Colors.card on dark background |
| B7 | P2 | Settings | Entire settings screen uses light theme, jarring from Moon dark |
| B8 | P3 | ManualCycleInput | "Done" button on date picker hardcoded in English (line 152) |
| B9 | P3 | Auth | No minimum password length indication; disabled state hard to see |
| B10 | P3 | PermissionDeniedScreen | "Open Settings" link text hardcoded in English (line 58) |

### Onboarding Duration

**Estimated total time:** 3-5 minutes (sign up + email verify + role + manual input + review)
**Felt like:** About right. Not too long. The education screen added 30 seconds but was worth it for the trust it built.
**Where it dragged:** Email verification is the only friction point. Everything else flows fast.

### What Would Make Linh Come Back Tomorrow

1. The Phase Wheel — I want to see my day number change
2. The daily check-in with AI insight — I'm curious what it says about my symptoms
3. The prediction accuracy — I want to see if it's right
4. The "Whisper to Sun" button — I want to try it once my boyfriend connects

### What Almost Made Linh Give Up

1. The white splash screen flash in bed at night (minor, but it was the first impression)
2. Email verification (standard friction but still annoying)
3. Nothing else. The onboarding flow is genuinely smooth.

### Recommendations

1. **[P1] Fix hardcoded English strings** — CycleDataReview "How does this work?", ManualCycleInput "Done", PermissionDeniedScreen "Open Settings"
2. **[P1] Apply Moon theme to tab bar** — Use `MoonColors.card` for Moon role users
3. **[P2] Add "What your partner sees" explainer** — Before the share code, or as an expandable FAQ in settings
4. **[P2] Dark splash screen** — Use system color scheme detection or default to dark for Moon
5. **[P2] Remove or hide AI label** — Per product rule, no AI terminology in user-facing UI
6. **[P2] Moon-theme the calendar and settings** — Consistent dark experience throughout
7. **[P3] Add tooltip for medical phase names** — "Hoang the" needs a one-line plain-language explanation
8. **[P3] Show password requirements** — "At least 6 characters" below the password field during signup
