# UPT_20260308_001 — Phase 3: 30-Day Simulated Daily Usage Log

**Session:** UPT_20260308_001
**Date:** 2026-03-08
**Personas:** Linh (Moon, 26, graphic designer) + Minh (Sun, 28, software sales)
**Cycle:** 28-day, 5-day period, starting simulation at Cycle Day 10 (Follicular)

---

## Cycle Phase Map (Reference)

| Sim Day | Cycle Day | Phase | Key Events |
|---------|-----------|-------|------------|
| 1–4 | 10–13 | Follicular | Rising energy, optimism |
| 5–6 | 14–15 | Ovulatory | Peak confidence, glow |
| 7–14 | 16–23 | Luteal | Winding down, PMS begins ~Day 20 |
| 15–19 | 24–28 | Late Luteal | PMS intensifies, period approaching |
| 20–24 | 1–5 | Menstrual | Period arrives, rest & restore |
| 25–30 | 6–11 | Follicular (new cycle) | Energy returns |

**Ovulation day:** Cycle Day 14 (28 - 14 = 14). Follicular ends at Day 11 (ovulationDay - 3), Ovulatory = Days 12-16 (ovulationDay - 2 to ovulationDay + 2). Let me recalculate with the actual code:

- `getOvulationDay(28, 5)` = `28 - 14` = 14
- Menstrual: Days 1-5
- Follicular: Days 6-11 (dayInCycle <= ovulationDay - 3 = 11)
- Ovulatory: Days 12-16 (dayInCycle <= ovulationDay + 2 = 16)
- Luteal: Days 17-28

**Corrected Phase Map:**

| Sim Day | Cycle Day | Phase | Notes |
|---------|-----------|-------|-------|
| 1 | 10 | Follicular | |
| 2 | 11 | Follicular | Last follicular day |
| 3 | 12 | Ovulatory | Linh forgets to log for 2 days |
| 4 | 13 | Ovulatory | |
| 5 | 14 | Ovulatory | Actual ovulation day |
| 6 | 15 | Ovulatory | |
| 7 | 16 | Ovulatory | Minh checks app first time since onboarding |
| 8 | 17 | Luteal | |
| 9 | 18 | Luteal | |
| 10 | 19 | Luteal | Minh gets first phase-change notification |
| 11 | 20 | Luteal | |
| 12 | 21 | Luteal | Linh notices prediction accuracy |
| 13 | 22 | Luteal | |
| 14 | 23 | Luteal | Weekend together |
| 15 | 24 | Luteal | |
| 16 | 25 | Luteal | PMS intensifies |
| 17 | 26 | Luteal | |
| 18 | 27 | Luteal | Small argument |
| 19 | 28 | Luteal | Linh sends first whisper |
| 20 | 1 | Menstrual | Linh triggers SOS (cramps_alert) |
| 21 | 2 | Menstrual | Period arrives - prediction accuracy check |
| 22 | 3 | Menstrual | Post-period reflection |
| 23 | 4 | Menstrual | |
| 24 | 5 | Menstrual | Last period day |
| 25 | 6 | Follicular | Minh does something thoughtful |
| 26 | 7 | Follicular | |
| 27 | 8 | Follicular | Linh switches language EN<->VI |
| 28 | 9 | Follicular | Linh considers keeping the app |
| 29 | 10 | Follicular | |
| 30 | 11 | Follicular | Both reflect on value |

---

## Day 1 — Cycle Day 10, Follicular

### Linh (Moon)

Opened the app right after work, curious about what Day 2 of real usage looks like. The dashboard loads with the blue follicular glow gradient at the top. The PhaseWheel shows a big "10" in a `#70D6FF` circle with "NANG TRUNG" (Follicular) above it and "Con 19 ngay" (19 days left) in the pill badge below.

The greeting rotates based on `dayInCycle % 3` -- Day 10 mod 3 = 1, so she sees: "Mot chuong moi dang bat dau -- hay buoc vao." (A new chapter is beginning -- step into it.) It feels encouraging. The AI greeting loads a second later and replaces it with something more personal. She notices the tiny "AI" label beneath it. _Interesting, but what does that mean?_ She doesn't think about it much.

Below the wheel, the "Thi tham voi Sun" (Whisper to Sun) button is prominent in blue. She taps it out of curiosity. The WhisperSheet slides up showing four follicular-phase options: "Len ke hoach" (Plan something), "Nau an cung nhau" (Cook together), "Di dao" (Go for a walk), "Toi xem phim" (Movie night). Cute. She closes it without sending -- not ready yet.

She scrolls down to the daily check-in: "Hom nay ban cam thay the nao?" (How are you feeling today?). She taps mood 4 ("Tot" / Good), selects no symptoms, hits "Ghi nhan & nhan goi y" (Log & get insight). An AI insight loads: something about her rising energy matching her follicular phase. It feels surprisingly validating.

**Logged:** Mood 4, no symptoms.
**Notifications:** None yet. No notification from the app today.
**Shared with Minh:** Mentioned over dinner that the app told her she's in an "energetic phase." He nodded.
**Mood:** Good. Work was productive. App reflected that.

### Minh (Sun)

Did not open the app today. He onboarded yesterday and linked with Linh, but there is no reason to check yet. No notifications arrived. He is waiting for the app to prove itself.

**App opens:** 0
**Action taken:** None.

---

## Day 2 — Cycle Day 11, Follicular (last follicular day)

### Linh (Moon)

Quick check during lunch break. PhaseWheel shows "11" now. Greeting is the third follicular rotation: "Cam nhan duoc tia lua chua? The gioi dang cho ban." (Feel that spark? The world is waiting for you.) She smiles. It is a good day.

Self-care insight card says: "Nang luong dang tang. Day la thoi diem tuyet voi de bat dau du an moi hoac thu hoat dong moi." (Energy is building. Great time to start new projects or try new activities.) She actually has a new design project starting tomorrow -- the app feels oddly relevant.

Logged mood 4 again, no symptoms. AI insight after check-in mentions something about riding the wave of her creative energy. She screenshots it and sends it to a friend, not Minh.

**Logged:** Mood 4, no symptoms.
**Notifications:** None.
**Mood:** Upbeat, productive. App matches.

### Minh (Sun)

Still did not open. No push notification came. Linh didn't send any signal. He's busy with client calls.

**App opens:** 0.

---

## Day 3 — Cycle Day 12, Ovulatory (LINH FORGETS TO LOG FOR 2 DAYS)

### Linh (Moon)

Did not open the app. Busy day -- deadline crunch at work. The phase silently shifted from follicular to ovulatory, but she doesn't see it. No push notification reminds her to check in (the app has no daily check-in reminder notifications). This is the first crack in the habit loop.

**Logged:** Nothing.
**Notifications:** None. **BUG/GAP: No daily check-in reminder notification exists.** The app relies entirely on user initiative. For habit formation during the critical first week, this is a significant gap.
**Mood:** Stressed from work, but physically fine.

### Minh (Sun)

No open. No notification.

---

## Day 4 — Cycle Day 13, Ovulatory (still forgotten)

### Linh (Moon)

Second day without opening. Weekend vibes -- she went out with friends. The app has no mechanism to gently pull her back.

**Logged:** Nothing.
**Gap identified:** Two consecutive days without engagement at a critical juncture (ovulatory peak). The app has no re-engagement push notification, no "We missed you" prompt, nothing.

### Minh (Sun)

Did not open. The app is becoming invisible to both of them.

---

## Day 5 — Cycle Day 14, Ovulatory (actual ovulation day)

### Linh (Moon)

Opened the app in the evening, partly out of guilt for skipping two days. The PhaseWheel now shows "14" in a warm orange `#FFB347` circle. The phase tagline chip reads "Rung trung - Dinh cao & Toa sang" (Ovulatory - Peak & Glow). She notices the color change from blue to orange -- _oh, I changed phases._

The greeting for ovulatory day 14 (14 % 3 = 2, so key index 2): "Nang luong dinh cao -- hay lam dieu ban yeu thich." (Peak energy -- do what you love.) The AI version loads and says something about her being at her most radiant today.

She checks the conception chance insight card: "Rat cao" (Very High). This makes her pause. _Wait, the app shows fertility info too?_ She finds it useful but didn't expect it.

Logged mood 5 ("Tuyet" / Great), no symptoms. The AI insight after check-in talks about embracing her social peak energy. She reads the "About this phase" card: "Ban cam thay tu tin, quyen ru, va o dinh cao giao tiep. Ban dang toa sang." (You feel confident, radiant, and at your social peak. You are glowing.)

**Logged:** Mood 5, no symptoms.
**Notifications:** None. **Observation:** She would have benefited from a "You're entering your ovulatory phase" notification 2 days ago.
**Shared with Minh:** Told him she's apparently "glowing" according to the app. He laughed.
**Mood:** Great. Weekend energy. App matched perfectly.

### Minh (Sun)

Still has not opened since onboarding. Linh's comment about "glowing" amused him but didn't trigger a check. Five days in and he has zero engagement.

**Concern:** At this rate, Minh will churn. The app has no proactive value delivery for Sun without notifications or Whisper signals.

---

## Day 6 — Cycle Day 15, Ovulatory

### Linh (Moon)

Quick open, morning check while having coffee. PhaseWheel shows "15." Same ovulatory warmth. She reads the self-care tip: "Ban dang o trang thai ruc ro nhat. Hay tan huong cac su kien xa hoi va cuoc tro chuyen y nghia." (You're at your most vibrant. Embrace social events and meaningful conversations.)

Logged mood 4, no symptoms. The AI insight nudges her to connect with people who matter.

She scrolls past the Whisper button again. She considers sending "Hen ho" (Date night) but feels it's too formal for a Monday. Closes it.

**Logged:** Mood 4, no symptoms.
**Mood:** Good, slightly tired from weekend.

### Minh (Sun)

No open.

---

## Day 7 — Cycle Day 16, Ovulatory (MINH CHECKS APP FOR FIRST TIME)

### Linh (Moon)

Opened briefly, logged mood 3 (Okay), mild headache symptom. She's having an off day despite being in the "glow" phase. The AI insight acknowledges this: something about how not every day matches the textbook, and that's okay. She appreciates the nuance.

She notices the "Thi tham voi Sun" button and thinks: _I should actually use this at some point._

**Logged:** Mood 3, headache.

### Minh (Sun)

**First app open since onboarding.** He opened because Linh mentioned over the weekend that the app told her she was "glowing" and he was curious what his side looks like.

The SunDashboard loads with a warm cream `#FFF8F0` background. At the top: "Chao, Minh" (Hey, Minh) and below it: "Luon ben canh Moon" (Be there for Moon).

The status card is the centerpiece. A large orange orb shows "16" with "Rung trung" (Ovulatory) in orange text, "Dinh cao & Toa sang" (Peak & Glow) as tagline, and "Ngay 16 trong chu ky cua Moon" (Day 16 of Moon's cycle). On the right: a countdown badge showing "13" with "ngay nua den ky kinh" (days until period).

Below that, "Huong dan hom nay" (Today's Guide) with two cards:
1. **"Tam trang Moon luc nay"** (Moon's mood now): "Co ay cam thay tu tin, quyen ru, va o dinh cao giao tiep. Co ay dang toa sang." (She feels confident, radiant, and at her social peak. She is glowing.)
2. **"Cach the hien"** (How to show up): static fallback: "Mot loi khen bat ngo hoac mon qua nho se rat co y nghia luc nay. Hay xuat hien cho co ay." (A surprise compliment or small gift will go a long way right now. Show up for her.)

The AI version loads and replaces the second card with something more specific -- maybe "Send her a voice note tonight telling her something you noticed about her this week."

At the bottom: the four phase chips (Kinh nguyet, Nang trung, Rung trung [active/highlighted], Hoang the). This gives him a mini-education about the cycle.

**Minh's reaction:** "Okay, this is actually useful. I can see what phase she's in and what to do. But there's nothing for me to actually DO in the app -- I can only read." He scrolls up and down. No interaction points beyond reading. No calendar tab shows partner data. He notes the "13 days until period" countdown.

**Action taken:** After reading the advice card, he texts Linh a compliment about a design she showed him last week. He doesn't connect it to the app explicitly.

**Bug noticed:** The title for the AI advice card shows "Cach the hien AI" with "AI" visible. This violates the "no AI terminology in UI" rule noted in Phase 2.

**Notifications:** None received.
**Engagement:** Low but meaningful -- the advice actually prompted an action.

---

## Day 8 — Cycle Day 17, Luteal

### Linh (Moon)

Phase changed overnight. Dashboard now shows green `#4AD66D` for luteal. PhaseWheel: "17" in green. Tagline chip: "Hoang the - Lang diu" (Luteal - Wind Down).

Greeting for luteal day 17 (17 % 3 = 2): "Che do am ap da bat. Ban xung dang duoc binh yen." (Warm mode is on. You deserve peace.)

She notices the phase changed and reads the description: "Ban co the nhay cam hoac de cau hon. Trieu chung tien kinh nguyet co the xuat hien." (You may feel more sensitive or irritable. PMS symptoms can appear.) _Hmm, that's a week away but okay._

Self-care: "Uu tien hoat dong am cung, giam caffeine, va nhe nhang voi ban than." (Prioritize cozy activities, reduce caffeine, and be gentle with yourself.)

Logged mood 3 (Okay), fatigue. The AI insight says something about the natural slowdown being normal in this phase. She finds it reassuring.

The Whisper options have changed to luteal ones: "Mang do an vat" (Bring snacks), "Cho em khong gian" (Give me space), "Om em" (Cuddle me), "Loi diu dang" (Kind words). These feel more relevant than the follicular ones.

**Logged:** Mood 3, fatigue.
**Notifications:** None.
**Mood:** Slightly flat. App anticipated this.

### Minh (Sun)

Did not open. He checked yesterday and felt like he got the gist. No notification about the phase change.

**Critical gap:** The phase changed from ovulatory to luteal -- arguably the most important transition for Sun to know about (her energy is dropping, PMS may start). But Minh received NO notification. He has no idea her phase changed.

---

## Day 9 — Cycle Day 18, Luteal

### Linh (Moon)

Opened briefly. Mood 3, bloating symptom. AI insight mentions bloating being common in the luteal phase and suggests light movement. She nods but doesn't act on it.

**Logged:** Mood 3, bloating.

### Minh (Sun)

No open. Still no notification.

---

## Day 10 — Cycle Day 19, Luteal (MINH GETS FIRST PHASE NOTIFICATION)

### Linh (Moon)

Morning open. Mood 2 (Meh), mood swings symptom. She's starting to feel the PMS. AI insight validates the mood drop. She spends more time reading the "About this phase" description today.

**Logged:** Mood 2, mood swings.

### Minh (Sun)

**Notification scenario:** Based on the `notify-cycle` Edge Function, Minh would receive a notification when `daysUntil === notifyDaysBefore` (default 3 days before period). With period predicted at Cycle Day 29 (28 + 1), that notification would come around Cycle Day 25-26, not today.

However, for the simulation, let's assume the system sends a notification about the *phase change* -- **but actually, reviewing the code, there is NO phase-change notification.** The `notify-cycle` function only sends:
- Period approaching (X days before)
- Period started (Day 1)
- Period ended (after avgPeriodLength)

**There is no notification for phase transitions** (e.g., follicular -> ovulatory, ovulatory -> luteal). This is a significant gap. Minh has been in the dark about the ovulatory -> luteal transition for 3 days.

**Minh did not receive any notification today.** He remains unaware of Linh's phase change.

**App opens:** 0.
**Bug/Gap:** No phase transition notifications exist. Sun has no proactive way to know when Moon's phase changes, which is arguably the core value proposition.

---

## Day 11 — Cycle Day 20, Luteal

### Linh (Moon)

Mood 2, cramps symptom logged. She's feeling the PMS creep in. The app's description card mentions PMS symptoms can appear. She thinks: _At least the app predicted this._

**Logged:** Mood 2, cramps.

### Minh (Sun)

Opened the app briefly because Linh seemed quieter than usual at dinner. The dashboard now shows green (luteal). Phase orb: "20." Advice card says (static fallback): "Kien nhan, lang nghe khong phan xet. Chuan bi do an vat yeu thich va tranh tranh cai." (Be patient, listen without judgment. Stock up on her favorite snacks and avoid arguments.)

He reads this and thinks: _Oh, she's in the "wind down" phase now. That explains tonight._ He doesn't explicitly act on it but goes easier on a comment he was about to make about the dishes.

**App opens:** 1.
**Action taken:** Held back a minor criticism. Indirect app influence.

---

## Day 12 — Cycle Day 21, Luteal (LINH NOTICES PREDICTION ACCURACY)

### Linh (Moon)

Opened the app and checked the PhaseWheel countdown: "8 ngay nua" (8 days left). She does mental math -- that puts her period starting around Day 29, which in real days would be... _yeah, that lines up with how I usually feel the PMS starting around now._

She thinks: _The prediction seems about right based on the 28-day cycle I entered._ The app doesn't learn from logged data yet (no HealthKit sync active, no period log correction mechanism visible in the dashboard), so the prediction is purely based on her initial manual input. For now, it tracks.

She logs mood 2, cravings + fatigue. The AI insight mentions cravings being her body's way of asking for more nourishment during the luteal phase.

**Logged:** Mood 2, cravings + fatigue.
**Prediction accuracy:** Aligns with her expectations. She trusts it.

### Minh (Sun)

Did not open today. No notification.

---

## Day 13 — Cycle Day 22, Luteal

### Linh (Moon)

Quick log: mood 2, mood swings + cravings. She's been in a string of mood-2 days. The AI insight starts to feel repetitive -- variations of "luteal phase means sensitivity, be gentle." She wishes the insight was more varied.

**Logged:** Mood 2, mood swings + cravings.
**Fatigue point:** AI insights are becoming repetitive during the long luteal stretch (Days 17-28 = 12 days of the same phase). This is a retention risk.

### Minh (Sun)

No open. He's settling into a pattern of checking every 3-4 days.

---

## Day 14 — Cycle Day 23, Luteal (WEEKEND TOGETHER)

### Linh (Moon)

Weekend. She and Minh are spending the day together. She opens the app in the morning and sees the PhaseWheel: "23," countdown "6 ngay nua." Luteal, winding down.

She logs mood 3 (Okay) -- it's the weekend and she's with Minh, so mood is a bit better. She selects bloating as a symptom. The AI insight suggests something about weekend rest being restorative.

She scrolls to the Whisper button. It's Saturday, they're on the couch. She considers sending "Om em" (Cuddle me) as a playful test but decides to just say it verbally instead.

**Logged:** Mood 3, bloating.
**Shared:** She shows Minh the app's phase description. He reads: "Co ay co the nhay cam hoac de cau hon. Trieu chung tien kinh nguyet co the xuat hien." He says: "Oh la vay ha?" (Oh, is that so?) -- mildly interested, not deeply engaged.

### Minh (Sun)

**Linh showed him the app.** He opens his own app to compare. The Sun dashboard shows the same phase info from his perspective. He reads the "How to show up" advice card. The AI-generated version tells him something like: "Make her favorite warm drink without her asking. Small gestures mean everything right now."

He makes her a cup of tra sua (milk tea) without being asked. She notices and appreciates it.

**App opens:** 1 (prompted by Linh).
**Action taken:** Made her milk tea based on the app's suggestion. **This is the first clear value-delivery moment for Minh.** The app directly influenced a kind action.
**Engagement:** Moderate. The weekend context helped.

---

## Day 15 — Cycle Day 24, Luteal

### Linh (Moon)

Monday. Mood dips again. Logged mood 2, tender + fatigue. The countdown shows "5 ngay nua." She's starting to anticipate her period.

**Logged:** Mood 2, tender + fatigue.

### Minh (Sun)

No open. Weekend momentum didn't carry over.

---

## Day 16 — Cycle Day 25, Luteal (PMS INTENSIFIES)

### Linh (Moon)

Bad day. Mood 1 ("Te" / Terrible). Symptoms: cramps, mood swings, cravings. She opens the app and the luteal greeting feels almost too gentle: "Tu tu thoi. Ban khong can phai lam het moi thu." (Slow down. You don't need to do everything.) She almost tears up. The app feels like it understands.

The countdown: "4 ngay nua." Period approaching. She logs and the AI insight says something compassionate about PMS being real and valid.

She looks at the SOS button (accessed via tab bar, the emergency icon). She considers sending "Dau bung kinh" (Cramps Alert) but it's not period cramps yet, just PMS cramps. She hesitates -- _is SOS only for during the period?_ The app doesn't clarify when SOS is appropriate vs. Whisper.

**Logged:** Mood 1, cramps + mood swings + cravings.
**Gap:** Unclear distinction between when to use SOS vs. Whisper. SOS options include "Cramps Alert" which could apply during PMS too, but the SOS framing feels "emergency-only."

### Minh (Sun)

**Notification possibility:** If `notifyDaysBefore` is 3 (default), the "period approaching" notification should fire at Day 25 (3 days before Day 28). Let me check: `daysUntil = avgCycleLength - dayInCycle + 1 = 28 - 25 + 1 = 4`. So not today -- it fires when `daysUntil === 3`, which is Day 26.

No notification yet. Minh does not open.

---

## Day 17 — Cycle Day 26, Luteal

### Linh (Moon)

Mood 1, same symptoms cluster. She logs mechanically now. The AI insight rotation is clearly hitting similar notes. She skips reading it fully.

**Logged:** Mood 1, cramps + mood swings.
**Engagement:** Declining. Logging feels like a chore during PMS. **Retention risk.**

### Minh (Sun)

**NOTIFICATION RECEIVED:** `daysUntil = 28 - 26 + 1 = 3`, which equals `notifyDaysBefore = 3`. The `notify-cycle` Edge Function fires:
- **Moon notification (Linh):** Title: "Your period is coming" / Body: "Your period may start in 3 days. Take care of yourself."
- **Sun notification (Minh):** Title: "Moon's period is approaching" / Body: "Moon's period may start in 3 days -- be extra gentle today."

**This is Minh's first push notification from Easel.**

He reads it on his lock screen. _"Moon's period may start in 3 days -- be extra gentle today."_ His immediate thought: _Oh, that's why she's been off this week._

He opens the app. Dashboard shows "26" in green, countdown "3 ngay nua." The advice card says: "Kien nhan, lang nghe khong phan xet. Chuan bi do an vat yeu thich va tranh tranh cai." (Be patient, listen without judgment. Stock up on her favorite snacks and avoid arguments.)

**Action taken:** He stops at a convenience store on the way home and buys her favorite snacks (banh trang tron and a yogurt drink). When he gets home, he places them on the table without making a big deal. She's pleasantly surprised.

**This is the highest-value moment so far for the couple.** The push notification directly led to a thoughtful action. Minh is now a believer -- the notification timing was perfect.

**Bug noted:** The notification text is in English ("Your period is coming," "Moon's period is approaching") even though both users have their app set to Vietnamese. **The Edge Function `notify-cycle` has hardcoded English strings.** Lines 159-172 in `notify-cycle/index.ts` are all English. There is no i18n layer in the Edge Function.

---

## Day 18 — Cycle Day 27, Luteal (SMALL ARGUMENT)

### Linh (Moon)

Terrible day at work, PMS is peaking. She comes home irritable. Minh makes an innocent comment about dinner plans and she snaps at him. A small argument ensues.

She opens the app afterward, seeking comfort. Mood 1, mood swings + cramps. The AI insight says something about Day 27 being one of the hardest days in the cycle. She reads the phase description again: "Ban co the nhay cam hoac de cau hon." (You may feel more sensitive or irritable.) She thinks: _Yeah, no kidding._

She wishes she had sent Minh a Whisper BEFORE the argument -- like "Cho em khong gian" (Give me space) -- to preempt the clash. The app's Whisper feature could have prevented this, but she hasn't built the habit of using it proactively.

**Logged:** Mood 1, mood swings + cramps.
**Insight:** The argument could have been prevented if (a) Minh had checked the app today and seen the advice to "avoid arguments," or (b) Linh had used Whisper to signal her state.

### Minh (Sun)

He checked the app AFTER the argument, feeling guilty. The advice card literally says "tranh tranh cai" (avoid arguments). He thinks: _I should have read this before dinner._

He dismisses the app with a mix of guilt and appreciation. The app was right -- he just didn't check in time.

**App opens:** 1 (post-argument).
**Action taken:** After cooling down, he apologizes and brings her a blanket without being asked.
**Lesson learned:** The app needs to deliver value BEFORE conflicts, not after. A daily push at 6 PM with the day's advice would be transformative for Sun.

**Gap identified:** Sun has no daily proactive notification with phase-aware advice. The only notification is the period-approaching one. A daily 6 PM push like "Luteal Day 27: She may be extra sensitive today. Avoid big conversations, bring comfort food." would be the killer feature for Sun retention.

---

## Day 19 — Cycle Day 28, Luteal (LINH SENDS FIRST WHISPER)

### Linh (Moon)

Last day before period (predicted). She's feeling heavy, bloated, emotional. She opens the app: PhaseWheel "28," countdown "1 ngay nua." Tomorrow is Day 1.

She thinks about yesterday's argument and decides to try the Whisper feature. She taps "Thi tham voi Sun." The WhisperSheet opens with luteal options:
1. "Mang do an vat" (Bring snacks) -- shopping bag icon
2. "Cho em khong gian" (Give me space) -- wind icon
3. "Om em" (Cuddle me) -- heart icon
4. "Loi diu dang" (Kind words) -- message-circle icon

She selects **"Loi diu dang" (Kind words)**. Haptic feedback fires (success notification type). The success screen shows:
- A pulsing check circle in `#80CBC4`
- "Da thi tham voi Sun" (Whispered to Sun)
- A chip showing the wind icon + "Loi diu dang"
- "Anh ay se biet phai lam gi." (He will know what to do.)

The sheet auto-closes after 2.5 seconds. She feels a small emotional release. _I told him what I need without having to explain._

**Logged:** Mood 1, cramps + bloating + mood swings.
**Whisper sent:** "kind" (Kind words).
**Emotional state:** Vulnerable but relieved. The Whisper feature delivered on its promise.

### Minh (Sun)

**Push notification received** (via `notify-sos` Edge Function, which handles both SOS and Whisper signals):
- Title: "Moon needs kind words"
- Body: "Say something kind. Small words, big impact."

He reads it immediately. Opens the app. The dashboard now shows a **WhisperAlert card** at the top, below the status card:
- Background color: `#80CBC4`
- Badge: "THI THAM" (WHISPER)
- Title: "Moon can: Loi diu dang" (Moon needs: Kind words)
- Description (AI-generated tip or static fallback): "Send her a heartfelt message about what she means to you."

He reads the tip and sends Linh a long text message about how much she means to him and how sorry he is about yesterday. She cries (good tears). He taps "Da hieu" (Got it) to dismiss the WhisperAlert.

**App opens:** 1 (prompted by notification).
**Action taken:** Sent a heartfelt text message directly prompted by the Whisper + AI tip.
**This is THE moment the app proves its value for the couple.** A clear signal from Moon -> Sun with a concrete action -> emotional reconnection.

**Bug noted again:** Push notification text is in English. "Moon needs kind words" should be "Moon can loi diu dang" in Vietnamese.

---

## Day 20 — Cycle Day 1, Menstrual (LINH TRIGGERS SOS - CRAMPS_ALERT)

### Linh (Moon)

She wakes up with her period. The PhaseWheel resets to "1" and the color changes to red/pink `#FF5F7E`. Tagline: "Kinh nguyet - Nghi ngoi & Phuc hoi" (Menstrual - Rest & Restore).

The greeting (day 1, menstrual, 1 % 3 = 1): "Co the ban dang rat no luc -- hay tran trong no." (Your body is working very hard -- honor it.) She exhales deeply. It feels right.

**Notification received (Linh):** "Your period may have started" / "Day 1 of your cycle. Be kind to yourself today." Again, in English.

Cramps hit hard around midday. She opens the app and goes to the SOS tab. Four options:
1. "Them do ngot" (Sweet Tooth) - coffee icon, pink
2. "Can om" (Need a Hug) - heart icon, purple
3. "Dau bung kinh" (Cramps Alert) - alert-circle icon, red
4. "Can yen tinh" (Quiet Time) - moon icon, slate

She taps **"Dau bung kinh" (Cramps Alert)**. Haptic fires. The SOS is sent.

**Logged:** Mood 1, cramps + fatigue + bloating.
**SOS sent:** "pain" (Cramps Alert).

### Minh (Sun)

**Push notification received:**
- Title: "Moon needs you"
- Body: "Cramps alert -- a hot water bottle and your presence means everything."

He's in a meeting. He reads the notification, excuses himself after 10 minutes, and calls to check on her. He asks if she needs anything from the pharmacy.

Back on the app, the dashboard shows a bright red **SOSAlert card**:
- Badge: "TIN HIEU SOS" (SOS SIGNAL)
- Title: "Co ay can: Cramps Alert" (She needs: Cramps Alert) -- **Bug: SOS title uses English "Cramps Alert" instead of Vietnamese translation.** The SOS alert uses `sos.title` directly from constants which is in English, not from i18n.
- AI tip loads: something like "Heat up a hot water bottle and brew ginger tea. Stay close but don't hover."

He taps "Da hieu" (Got it) to dismiss.

**App opens:** 1 (notification-driven).
**Action taken:** Called Linh, brought home a hot water bottle, pain meds, and ginger tea.
**Value delivered:** Extremely high. The SOS -> notification -> action pipeline worked perfectly.

**Notification received (Minh, separate):** "Moon's period may have started" / "It's day 1 of Moon's cycle. Show extra love today." -- Also in English.

---

## Day 21 — Cycle Day 2, Menstrual (PERIOD ARRIVES - PREDICTION ACCURACY)

### Linh (Moon)

Second day of period. She confirms: the prediction was accurate. Period started on Day 28/1, which matches her manually entered 28-day cycle. She logs mood 1, cramps + fatigue.

She reflects: _The app knew this was coming. The countdown was right. I wish I'd paid more attention to the luteal warnings._

**Logged:** Mood 1, cramps + fatigue.
**Prediction accuracy:** Spot on. Based on manual input, so this was expected -- the real test will be next cycle.

### Minh (Sun)

Opens the app voluntarily for the first time without a notification prompt. He wants to check the advice for Day 2 of her period. The dashboard shows red, "2" in the orb, "Kinh nguyet - Nghi ngoi & Phuc hoi."

Advice card (static): "Pha do uong am, nau mon ngon, va don gian la o ben co ay. Dung len ke hoach lon hom nay." (Prepare warm drinks, comfort food, and simply be present. No big plans today.)

**App opens:** 1 (voluntary!).
**Action taken:** Cancels plans to go out with friends tonight and stays home with Linh instead. Orders delivery of her favorite pho.

---

## Day 22 — Cycle Day 3, Menstrual (POST-PERIOD REFLECTION)

### Linh (Moon)

Third day. Cramps easing. Mood 2 (slightly better). She logs cramps + fatigue but with less intensity mentally. The AI insight recognizes the slight improvement in mood from yesterday.

She reflects on the app so far: _The Whisper thing actually worked. Minh brought me tea without me having to cry about it. The predictions are right. But the daily check-in is getting repetitive -- five days of mood 1-2 feels like I'm just documenting misery._

She thinks about the calendar tab. She opens it -- sees her period days marked in red, ovulation marked, fertile window. It's visually clear. But there's no way to retroactively mark when her period actually started (Day 20 of the sim). The app assumes the prediction is correct. **Gap: No way for Moon to confirm/correct actual period start date from the dashboard.**

**Logged:** Mood 2, cramps + fatigue.
**Reflection:** App is helpful but needs more interactivity. Logging during period feels like a chore.

### Minh (Sun)

Opens briefly. Same menstrual advice. He's checked 3 days in a row now -- the period is driving engagement for Sun. He reads the mood description: "Co ay co the cam thay met moi va de xuc dong hon binh thuong." (She may feel tired and more emotional than usual.)

**App opens:** 1.
**Action taken:** Brings home her favorite dessert (che buoi).

---

## Day 23 — Cycle Day 4, Menstrual

### Linh (Moon)

Mood 2, fatigue only. Period is winding down. Logged quickly. AI insight mentions energy returning soon. She's looking forward to the follicular phase.

**Logged:** Mood 2, fatigue.

### Minh (Sun)

Opened briefly. Same content. He's starting to feel the menstrual advice is repetitive too. _"Be present, bring warm drinks"_ -- he gets it already.

**App opens:** 1.
**Engagement fatigue:** Content repetition during long phases is a problem for both personas.

---

## Day 24 — Cycle Day 5, Menstrual (last period day)

### Linh (Moon)

Last day of period (avgPeriodLength = 5). She logs mood 3 -- feeling better. No symptoms. AI insight celebrates her resilience.

**Notification possibility:** The "period ending" notification fires when `daysUntil === -avgPeriodLen`, which is `daysUntil = 28 - 5 + 1 = 24`... wait, this doesn't match the formula. Let me recalculate: `daysUntil` from `getDaysUntilNextPeriod` at Day 5 = `28 - 5 + 1 = 24`. The notify-cycle checks `daysUntil === -avgPeriodLen` (i.e., -5), which would mean 5 days PAST the predicted period start. With a new cycle starting at Day 1, the "period ending" notification fires at Cycle Day 5 of the PREVIOUS prediction, not the current cycle. This logic seems to trigger correctly at the end of the period.

**Linh notification:** "Your period is ending" / "Your cycle is wrapping up. Energy is returning -- you've got this." (English again.)
**Minh notification:** "Moon's period is ending" / "Moon's cycle is finishing up. She'll be feeling more like herself soon." (English.)

Minh reads this and feels relief.

**Logged:** Mood 3, no symptoms.

### Minh (Sun)

Received "period ending" notification. Opens app. Green hasn't appeared yet (still shows menstrual red at Day 5). He reads the notification and feels a weight lift -- _her period is ending, things go back to normal._

**App opens:** 1.
**Action taken:** Suggests going out for dinner tomorrow to celebrate the end of a tough week.

---

## Day 25 — Cycle Day 6, Follicular (MINH DOES SOMETHING THOUGHTFUL)

### Linh (Moon)

New cycle, new phase. The PhaseWheel flips back to blue `#70D6FF`: "6," "Nang trung - Nang luong dang trao" (Follicular - Rising Energy). The mood shift is palpable. Greeting: "Nang luong moi dang den. Ban lam duoc ma." (New energy is coming. You've got this.)

She logs mood 4 (Good!), no symptoms. First good mood in 10 days. The AI insight talks about her body entering recovery mode and the fresh start. She feels genuinely uplifted.

**Logged:** Mood 4, no symptoms.
**Emotional state:** Relief, optimism. The app mirrored the transition beautifully.

### Minh (Sun)

He planned ahead from yesterday. He opens the app: blue follicular phase, "6" in the orb. Advice card: "Len ke hoach hen ho! Co ay dang trong tam trang phieu luu, thich giao tiep. Goi y dieu gi do moi me." (Plan a date! She's in an adventurous, social mood. Suggest something new.)

He already made dinner reservations at a restaurant they've been wanting to try. When he tells Linh, she's delighted: "Sao anh biet em muon di an?" (How did you know I wanted to go out?) He smiles and doesn't reveal the app told him.

**App opens:** 1 (voluntary).
**Action taken:** Pre-planned a date night based on follicular phase advice. **This is the second transformative moment.** The app didn't just react to an SOS -- it proactively guided him to do the right thing at the right time.

---

## Day 26 — Cycle Day 7, Follicular

### Linh (Moon)

Still riding the follicular high. Mood 4, no symptoms. The date night last night was great. She's feeling connected to Minh. The app gets partial credit.

She reads the self-care tip: "Nang luong dang tang. Day la thoi diem tuyet voi de bat dau du an moi." She starts a new creative project at work.

**Logged:** Mood 4, no symptoms.

### Minh (Sun)

Did not open today. The date night used up his "thoughtful actions" budget for the week. He's coasting.

---

## Day 27 — Cycle Day 8, Follicular (LINH SWITCHES LANGUAGE EN<->VI)

### Linh (Moon)

She goes to Settings and switches the language from Vietnamese to English to see how the app reads in English. The dashboard immediately reloads:
- Phase tagline: "Follicular - Rising Energy"
- Greeting: "Feel that spark? The world is waiting for you."
- Self-care: "Energy is building. It's a great time to start new projects or try new activities."
- Check-in: "How are you feeling today?"

She notices the English is polished and warm. Some Vietnamese translations felt slightly formal in comparison ("Nang trung" for Follicular is the medical Vietnamese term -- there's no casual equivalent). She switches back to Vietnamese. _The Vietnamese is good enough, but the English feels more natural._

She logs mood 5 (Great!) in Vietnamese. No symptoms.

**Logged:** Mood 5, no symptoms.
**Language observation:** English copy feels warmer/more casual. Vietnamese copy is accurate but slightly clinical in phase names (this is unavoidable -- Vietnamese medical terms are formal). The non-phase content (greetings, insights) is well-localized.

**Bug confirmed from Phase 2:** The notification text from Edge Functions is hardcoded English. Switching app language doesn't affect push notifications.

### Minh (Sun)

No open.

---

## Day 28 — Cycle Day 9, Follicular (LINH CONSIDERS KEEPING THE APP)

### Linh (Moon)

She's been using the app for 4 weeks. She opens it and sees "9" in the blue follicular circle. The greeting makes her smile. She logs mood 4, no symptoms, reads the AI insight, and closes.

**Internal monologue:** _Do I keep this app?_

**Pros:**
- The cycle predictions were accurate
- The phase descriptions actually matched how she felt
- The Whisper feature worked brilliantly (Day 19)
- Minh brought snacks, made tea, cancelled plans -- the app influenced him
- The daily check-in helped her notice mood patterns over the month
- Vietnamese translation is solid

**Cons:**
- AI insights got repetitive during the long luteal phase (12 days)
- No daily check-in reminder notification -- she missed 2 days
- No way to confirm/correct when her period actually started
- SOS vs. Whisper distinction is unclear
- Push notifications are in English even when app is in Vietnamese
- No phase-change notifications for Minh -- he was blind for days
- The "AI" label still bugs her (from Phase 2 feedback)
- Calendar tab has limited value for her (no logs shown on calendar)

**Verdict:** She's keeping it. The Whisper + SOS value alone justifies the space on her phone. But she'd rate it 7/10 with significant room for improvement.

**Logged:** Mood 4, no symptoms.

### Minh (Sun)

No open today.

---

## Day 29 — Cycle Day 10, Follicular

### Linh (Moon)

Quick log, mood 4, no symptoms. Routine is forming. She opens, logs, reads insight, closes. Under 2 minutes.

**Logged:** Mood 4, no symptoms.

### Minh (Sun)

Opens briefly to check what phase she's in. Sees follicular. Advice says to plan something fun. He mentally notes to suggest a weekend hike.

**App opens:** 1.

---

## Day 30 — Cycle Day 11, Follicular (BOTH REFLECT ON VALUE)

### Linh (Moon)

Final day of the simulation. She opens, logs mood 4, no symptoms. Full cycle complete. She scrolls through the dashboard one more time. The PhaseWheel, the insights, the Whisper button -- they've become familiar.

**Final reflection:**
"The app understands my cycle better than I expected. The luteal-to-menstrual transition was the hardest part, and the app was right there with the right words. The Whisper feature saved us from at least one more argument. I just wish the AI insights were more varied and that I got nudged to log on the days I forgot. I'll keep it."

**Logged:** Mood 4, no symptoms.

### Minh (Sun)

Opens the app one last time. He's been checking semi-regularly -- not daily, but when it matters. He looks at the four phase chips at the bottom: Kinh nguyet, Nang trung, Rung trung, Hoang the. He understands what they mean now. He didn't know any of this a month ago.

**Final reflection:**
"Honestly? The period-approaching notification and the SOS cramps alert were the two moments that sold me. The app told me what to do, and I did it, and it worked. The daily advice cards are nice but I don't check them every day. If the app sent me a daily notification with the advice, I'd check every single time. Right now I forget it exists unless she sends a signal or a notification hits. I'm keeping it, but it needs to be pushier with me."

**App opens:** 1.

---

## Retention & Engagement Summary

### Linh (Moon) — 30 Day Stats

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Days opened | 25/30 | 20+ | PASS |
| Days logged | 25/30 | -- | Good |
| Days missed | 5 (Days 3-4 skipped, plus Days 8, 15, 17 quick-only) | -- | Acceptable |
| Whispers sent | 1 | -- | Low but impactful |
| SOS sent | 1 | -- | Right when needed |
| Language switch | 1 (Day 27) | -- | -- |
| Peak engagement | Days 5, 19, 20, 25 | -- | Phase transitions + signals |
| Lowest engagement | Days 3-4 (forgot), Days 13-17 (luteal fatigue) | -- | Repetition problem |
| Habit formed? | Partial -- logs most days but not automatic yet | -- | Needs reminders |
| Considered deleting? | No | -- | PASS |

### Minh (Sun) — 30 Day Stats

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Days opened | 14/30 | 15+ | CLOSE MISS |
| Notification-driven opens | 4 (Days 17, 19, 20, 24) | -- | Core driver |
| Voluntary opens | 6 (Days 7, 11, 14, 21, 25, 29) | -- | Growing |
| Linh-prompted opens | 2 (Days 14, 22) | -- | -- |
| Zero-open streaks | Days 1-6 (6 days!), Days 8-10, 12-13, 15-16 | -- | Needs daily push |
| Actions taken because of app | 6+ | -- | Strong when engaged |
| Peak engagement | Days 19-25 (period week) | -- | Urgency drives opens |
| Lowest engagement | Days 1-6 (no notifications) | -- | Critical gap |
| Habit formed? | No -- notification-dependent | -- | Needs daily nudge |
| Considered deleting? | Yes, around Day 5-6 (no value yet) | -- | RISK |

### Engagement Curve

```
Linh:  ████████░░█████░█░██████████████  (25/30)
Minh:  ░░░░░░█░░░█░░██░░█████████░░░░█  (14/30)
       Day:  1  5  10  15  20  25  30
```

### Key Retention Signals

1. **Linh's habit formation moment:** Day 5 (returned after 2-day gap to discover new phase). Not yet automatic -- needs push reminders.
2. **Minh's first value moment:** Day 7 (read advice, sent compliment). But engagement dropped until Day 17 notification.
3. **Minh's "aha" moment:** Day 17 (period-approaching notification -> bought snacks). This is when he became a believer.
4. **Couple's peak value:** Day 19-20 (Whisper + SOS -> direct action -> emotional reconnection). This is the app's killer feature in action.
5. **Churn risk window:** Days 1-6 for Minh (zero value delivery). Days 3-4 for Linh (no re-engagement mechanism).

---

## Critical Gaps & Bugs Identified

### P0 — Retention Threats

| # | Issue | Impact | Affected |
|---|-------|--------|----------|
| 1 | **No daily check-in reminder notification** | Moon forgets to log, habit doesn't form | Moon |
| 2 | **No phase-change notifications** | Sun is blind to the most important transitions (follicular->ovulatory, ovulatory->luteal) | Sun |
| 3 | **No daily advice push for Sun** | Sun only opens on explicit signals; no proactive daily value | Sun |
| 4 | **Push notification text is hardcoded English** | Vietnamese users get English notifications (`notify-cycle` and `notify-sos` Edge Functions) | Both |

### P1 — UX Gaps

| # | Issue | Impact | Affected |
|---|-------|--------|----------|
| 5 | **No way to confirm/correct actual period start date** from dashboard | Prediction accuracy degrades over cycles without correction | Moon |
| 6 | **AI insights become repetitive** during long phases (12-day luteal) | Engagement drops, logging feels like a chore | Moon |
| 7 | **SOS vs. Whisper distinction unclear** | Moon hesitates to use SOS during PMS (non-period cramps) | Moon |
| 8 | **SOS alert title uses English constants** instead of i18n | "She needs: Cramps Alert" instead of Vietnamese | Sun |
| 9 | **"AI" label visible in UI** | Violates "no AI terminology" design rule | Both |
| 10 | **Calendar tab has no daily log visualization** | Moon can't see mood/symptom patterns over time | Moon |

### P2 — Nice-to-Have

| # | Issue | Impact |
|---|-------|--------|
| 11 | No "streak" or gentle gamification for daily logging | Habit formation is slower |
| 12 | No "weekly summary" for either role | Missed opportunity for reflection |
| 13 | Sun has zero interactive features (read-only dashboard) | Engagement relies entirely on notifications |
| 14 | Whisper/SOS history not visible to either persona | Can't review past signals |

---

## Recommendations (Prioritized)

### Must-Have for Next Release

1. **Daily push notifications for Sun** — 6 PM daily: "Moon is in [Phase], Day [X]. [One-line advice]." This alone could raise Minh's engagement from 14/30 to 25/30.
2. **Phase-change notifications for Sun** — Push when Moon transitions between phases. Four per cycle, high impact.
3. **Daily check-in reminder for Moon** — 9 PM push: "How was your day? Tap to log." Prevents the Day 3-4 gap.
4. **i18n for Edge Function notifications** — Store user language preference, use translation map in `notify-cycle` and `notify-sos`.

### Should-Have

5. **Period start confirmation** — Simple "My period started today" button on Moon dashboard during late luteal / Day 1.
6. **Insight variety** — More AI prompt variation for extended phases. Consider incorporating logged symptoms into prompt context for fresh responses.
7. **SOS/Whisper label clarification** — Rename or add helper text: "SOS = urgent" vs. "Whisper = gentle request."

### Nice-to-Have

8. Remove "AI" label from all user-facing UI.
9. Add mood/symptom heatmap to calendar tab.
10. Add interaction point for Sun (e.g., "Send Moon a love note" CTA).
