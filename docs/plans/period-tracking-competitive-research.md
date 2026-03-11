# Period Tracking Competitive Research: Flo, Clue, Natural Cycles

**Date:** 2026-03-11
**Purpose:** Inform Easel's manual period logging and cycle recalculation design

---

## 1. Manual Period Logging UX

### Flo
- **Primary action:** A prominent pink "Log Period" button on the home screen. Tapping it opens a date selector pre-filled with today's date.
- **Flow:** Tap "Log Period" -> confirm the start date -> check that the marked days are correct -> tap "Save."
- **End of period:** Logged automatically based on the user's average period length (configured in Settings > Cycle and Ovulation). Users can manually end it earlier.
- **Editing past periods:** Tap the Calendar icon (top-right) -> "Edit period dates" -> mark/unmark dates -> Save. This allows retroactive corrections.
- **Flow logging:** Separate from period start/end. Tap the "+" icon on the main screen -> choose flow intensity (light/medium/heavy/spotting) -> "Apply."

### Clue
- **Primary action:** Tap "Track" in the bottom nav or tap a day in the Calendar View.
- **Flow:** Navigate to a date -> double-tap in Calendar View -> find the "Period" category (always at the top of the tracking view) -> select flow level.
- **Editing:** Tap a date in the calendar -> scroll to the relevant category -> toggle tracking on/off to add or remove entries.
- **Key difference from Flo:** Clue treats period logging as one of many daily tracking categories (alongside mood, pain, energy, etc.) rather than having a dedicated "Log Period" button. More clinical, less hand-holding.

### Natural Cycles
- **Primary action:** Log period start from the daily view. Users can also log via the calendar.
- **Key difference:** Natural Cycles is temperature-first. Period logging is secondary data that feeds into the algorithm alongside BBT (basal body temperature) and optional LH (luteinizing hormone) test results.
- **Auto-cycle switch:** If a user doesn't log a period but the algorithm detects a new cycle based on temperature patterns, it may automatically switch to a new cycle and ask the user to confirm.

### Design Takeaways for Easel
- A single, prominent "Log Period" CTA on Moon's dashboard is the standard (Flo's approach). Minimizes friction.
- Allow retroactive editing via the calendar -- users frequently forget to log on the exact day.
- Auto-end period based on average length, but let users manually end it early.
- Separate flow intensity logging from the binary "period started/ended" action.

---

## 2. Cycle Recalculation When Periods Arrive Early or Late

### Flo
- **Late period behavior:** Flo does NOT immediately show "your period is late." Instead, it moves the prediction forward day by day. This is because Flo builds a probability window for when the period could arrive, and a 1-2 day shift is within normal variance.
- **After logging:** Once the user logs the actual period start date, Flo recalculates all future predictions using its neural network, which takes the new data point into account alongside the full history.
- **No manual cycle length override:** Even if a user sets a specific cycle length in settings, Flo's algorithm may diverge from it if the logged data tells a different story. Flo prioritizes actual data over user-specified defaults.

### Clue
- **Adaptive recalculation:** When a period arrives earlier or later than predicted, Clue immediately recalculates future predictions. The algorithm weighs recent cycles more heavily but does not discard older data entirely.
- **Starting estimates:** Before the algorithm has enough data, Clue uses medical literature averages (28-day cycle, 5-day period). As the user logs more cycles, individual patterns replace the defaults.

### Natural Cycles
- **Two-phase recalculation:**
  1. Before ovulation is detected: Prediction is based on average ovulation day + average luteal phase length.
  2. After ovulation is detected (via temperature shift): Prediction updates to use the actual ovulation date + average luteal phase length. This is much more accurate because the luteal phase is relatively stable (typically 10-16 days, consistent per individual).
- **Retroactive adjustment:** Once a new cycle starts with a period entry, Natural Cycles may retroactively adjust the ovulation day for the previous cycle if temperature data supports it.

### Design Takeaways for Easel
- Do NOT show "period is late" immediately -- use a probability window (2-3 day grace period).
- After a period is logged, recalculate the rolling average and update all future predictions.
- Weight recent cycles more heavily, but keep 3-6 cycles of history for stability.
- For a simpler app like Easel (no temperature data), a weighted rolling average of cycle lengths is the pragmatic choice.

---

## 3. Prediction Algorithms

### Flo (Neural Network / ML)
- **Architecture:** Neural network with 442 input features. Single output unit predicting cycle length in days.
- **Input features include:** Cycle history, age, logged symptoms, flow patterns, lifestyle factors. A two-step process: (1) individual-level ML models recognize unique patterns, (2) those patterns become features for the neural network.
- **Training:** Uses Amazon SageMaker with GPU instances. Trained on data from 5+ million users for population-level patterns, but personalized per user.
- **Accuracy:**
  - Baseline (no ML): Mean Absolute Error (MAE) of 5.6 days
  - With neural network: MAE reduced to 2.6 days (54.2% improvement)
  - With symptom logging: MAE of 1.59 days
  - Without symptom logging: MAE of 2.82 days
- **Key insight:** Symptom logging significantly improves predictions. Even "weak predictors" (individual symptoms) collectively improve accuracy.

### Clue (Ensemble ML)
- **Approach:** Ensemble machine learning methods analyzing multiple cycle parameters: cycle length variability, flow patterns, symptom correlations.
- **Foundation:** Starting estimates from peer-reviewed medical literature. Algorithm adapts to individual patterns over time.
- **Accuracy:**
  - Regular cycles: 87% prediction accuracy
  - Irregular cycles: 74% accuracy
  - Significantly outperforms simple calendar-based methods
- **Research backing:** 30+ peer-reviewed studies. Collaborations with Columbia, Harvard, Stanford, Kinsey Institute.
- **Wrist temperature integration:** Recent addition -- ovulation day estimate in 80.8% of cycles with MAE of 1.22 days.

### Natural Cycles (Statistical + Temperature)
- **Core formula:** Predicted period = Detected ovulation day + Average luteal phase length
- **Without ovulation detection:** Falls back to average cycle length from history.
- **Learning curve:** Algorithm takes 1-3 cycles to learn individual patterns. More data (especially consistent temperature readings) improves accuracy.
- **Unique advantage:** Temperature data provides a physiological signal, not just statistical extrapolation.

### Simple Approaches (Baseline for Easel)
- **Calendar method:** Next period = Last period start + Average cycle length
- **Rolling average:** Average of last 3-6 cycle lengths. Common in simpler apps.
- **Weighted rolling average:** Recent cycles weighted more (e.g., last cycle = 40%, previous = 30%, before that = 20%, oldest = 10%).

### Design Takeaways for Easel
- For v1, a **weighted rolling average of last 3-6 cycles** is the right balance of accuracy and simplicity.
- Encourage Moon to log symptoms (mood, cramps, etc.) -- even if Easel doesn't use them algorithmically yet, the data is valuable for future ML features and for Sun's awareness.
- Consider showing a prediction confidence range (e.g., "Period expected March 15-18") rather than a single date, especially for users with irregular cycles.
- Population average (28 days) as the starting default until 2-3 cycles are logged.

---

## 4. Handling Irregular Periods

### Flo
- **Symptom Checker:** Analyzes logged symptoms and can notify users: "Your symptoms match up with people who have PCOS." Recommends consulting a healthcare provider.
- **Conditions covered:** PCOS, endometriosis, perimenopause.
- **Perimenopause Score:** Tracks how symptoms impact the user over time with a dedicated scoring feature.
- **Late period handling:** Builds a probability model rather than showing "delay" immediately. Extends the prediction window gradually.

### Clue
- **PCOS detection tool:** Uses a combination questionnaire + "dynamic Bayesian network" to identify potential PCOS. Only available for users whose cycles are identified as clinically irregular and who are not on birth control.
- **Irregular cycle tracking:** Markets itself as an "irregular period tracker." The app adapts its predictions rather than forcing a regular-cycle assumption.
- **No alarmist messaging:** Clue avoids anxiety-inducing notifications. It tracks patterns and presents data neutrally.

### Natural Cycles
- **Handles irregularity via temperature:** Since the algorithm uses actual physiological signals (BBT), it can handle irregular cycles better than pure calendar methods. The ovulation detection still works even when cycle length varies.

### Common UX Problems (Research Findings)
- **58% of users** with reproductive conditions reported that apps tracked their irregular cycles incorrectly.
- Apps ignore common cycle disruptors: stress, extreme exercise, diet changes, travel, illness.
- Users want the ability to annotate WHY a cycle was irregular (e.g., "high stress this month").
- Transparency about prediction uncertainty is lacking across all apps.

### Design Takeaways for Easel
- After 3+ cycles of significant irregularity (e.g., cycle length varying by >7 days), show a gentle suggestion: "Your cycles seem to vary quite a bit. Consider chatting with your doctor."
- Allow Moon to annotate cycles with context (stress, travel, illness, medication changes).
- Show prediction confidence/uncertainty visually -- wider windows for less predictable cycles.
- Never assume regularity. Start with wide prediction windows and narrow as data accumulates.
- For Sun: frame irregular cycles with empathy, not alarm. "Her cycle is a bit unpredictable this month" rather than clinical language.

---

## 5. AI and Educational Features

### Flo
- **Health Assistant (chatbot):** Users can ask questions about late periods, irregular cycles, PMS, symptoms. Provides personalized responses based on logged data.
- **Symptom Checker:** Matches logged symptoms against patterns for PCOS, endometriosis, perimenopause. Not a diagnosis -- explicitly recommends seeing a doctor.
- **Menopause Timeline:** For older users, predicts and tracks the transition to menopause.
- **Daily insights:** Context-aware articles and tips based on current cycle phase. E.g., during the luteal phase: articles about PMS management.
- **AI-powered accuracy:** The neural network isn't user-facing but powers all predictions behind the scenes.
- **Key UX principle:** Flo does NOT use "AI" language in the UI. Features are presented as "personalized insights" and "smart predictions" -- warm, human-sounding labels.

### Clue
- **Encyclopedia:** Extensive library of evidence-based articles about menstrual health, written with academic rigor.
- **Phase-aware content:** Articles surface based on where the user is in their cycle.
- **Research participation:** Users can opt into anonymized research studies (Columbia, Stanford partnerships).
- **No chatbot:** Clue relies on articles and data visualization rather than conversational AI.

### Design Takeaways for Easel
- Easel already uses "Smart timing" and "Personalized" instead of "AI" (per CLAUDE.md) -- this aligns with Flo's approach.
- For Sun's partner-advice feature: phase-aware tips are the industry standard. Easel's AI proxy is well-positioned here.
- Consider adding cycle-phase educational content for both Moon and Sun (why she might feel X during Y phase).
- A "Why might my period be late?" explainer (triggered when period is 3+ days late) would be valuable -- factual, not alarmist.

---

## 6. Calendar UI Patterns

### Flo
- **Color coding:**
  - Red/pink: Period days (actual logged)
  - Lighter pink/outlined: Predicted period days
  - Teal/blue: Ovulation and fertile window
  - Grey: Period delay indicator
- **Visual distinction:** Filled circles for logged/actual days vs. outlined/hollow circles for predicted days.
- **Home screen:** Circular countdown dial showing days until next period, with the current cycle phase prominently displayed.
- **Calendar view:** Traditional month grid with color-coded dots. Tapping a day reveals logged data and predictions.

### Clue
- **Color coding:**
  - Red shades: Period days (darker = heavier flow)
  - Blue: Predicted fertile window
  - White clouds: PMS days
  - Grey: Low fertility days
- **Circular timeline:** Clue's signature UI is a circular cycle view (not just a calendar grid). The circle represents the full cycle, with segments colored by phase.
- **Calendar view:** Standard month grid available as an alternative view. Double-tap to log.
- **Minimalist design:** Clue uses a deliberately clinical, gender-neutral design. No flowers, no pink branding.

### Natural Cycles
- **Color coding:**
  - Red days: Not safe (fertile or period)
  - Green days: Safe (non-fertile)
- **Temperature graph:** Primary visualization is a temperature chart overlaid on the cycle timeline, not just a calendar.

### Common Patterns Across All Apps
- **Predicted vs. actual distinction is critical.** Every app uses visual differentiation (filled vs. outlined, solid vs. striped, opaque vs. translucent).
- **Phase colors are universal:** Red/pink for menstruation, blue for fertile window, green/neutral for safe days.
- **Dual views:** Both a "current cycle summary" (circular or linear) on the home screen AND a traditional calendar grid for history/editing.
- **Soft, rounded visuals:** Dots, circles, and gradients dominate. No sharp edges or clinical chart aesthetics.

### Design Takeaways for Easel
- Use Easel's existing phase colors (menstrual `#FF5F7E`, follicular `#70D6FF`, ovulatory `#FFB347`, luteal `#4AD66D`) on the calendar.
- Differentiate predicted vs. actual: use solid fills for logged days and dashed outlines or translucent fills for predictions.
- Moon's dashboard: circular or linear cycle timeline showing current position in the cycle.
- Sun's dashboard: simplified phase indicator (no calendar needed -- just "She's in day X of her follicular phase").
- Allow tapping any calendar day to view/edit logs for that date.

---

## Summary: Recommended Approach for Easel

| Aspect | Recommendation |
|--------|---------------|
| **Period logging** | Single "Log Period" button on Moon dashboard. Calendar tap for editing past dates. Auto-end based on average, manual override available. |
| **Prediction algorithm** | Weighted rolling average of last 3-6 cycles. Default to 28 days until 2+ cycles logged. Show prediction window, not single date. |
| **Recalculation** | On period log, recalculate immediately. Weight recent cycles heavier. Grace period of 2-3 days before showing "late." |
| **Irregular cycles** | Gentle health suggestion after 3+ irregular cycles. Allow cycle annotations. Wider prediction windows for variable cycles. |
| **AI features** | Phase-aware tips for Sun (already have via proxy). Consider "Why might my period be late?" explainer. No "AI" language in UI. |
| **Calendar UI** | Phase-colored days using existing theme. Solid = logged, translucent/dashed = predicted. Tap to view/edit. |

---

## Sources

- [Flo: How to log period start/end](https://help.flo.health/hc/en-us/articles/360015313191-How-do-I-log-the-start-end-of-my-period-or-edit-a-logged-one)
- [Flo: How to use the app](https://help.flo.health/hc/en-us/articles/360014347632-How-do-I-use-the-app)
- [Flo: Checking cycle predictions](https://help.flo.health/hc/en-us/articles/4406826523284-Checking-your-cycle-predictions)
- [Flo: Late period prediction behavior](https://help.flo.health/hc/en-us/articles/360015317051-My-period-is-late-but-Flo-just-moves-its-prediction-to-the-next-day)
- [Flo: Neural network implementation (InData Labs)](https://indatalabs.com/resources/neural-network-implementation-in-healthcare-app)
- [Flo: ML with Amazon SageMaker (AWS blog)](https://aws.amazon.com/blogs/startups/using-machine-learning-to-track-periods-with-flo/)
- [Flo: Accuracy details](https://flo.health/flo-accuracy)
- [Flo iOS logging flow (Mobbin)](https://mobbin.com/explore/flows/6877485d-303f-4639-9402-27e6845a688e)
- [Clue: Science of your cycle](https://helloclue.com/articles/about-clue/science-your-cycle-evidence-based-app-design)
- [Clue: How to track your period](https://support.helloclue.com/hc/en-us/articles/215935063-How-do-I-track-my-period)
- [Clue: Color meanings in Cycle View](https://support.helloclue.com/hc/en-us/articles/7955444726164-What-do-the-different-colors-in-the-Cycle-View-mean)
- [Clue: PCOS detection tool (TechCrunch)](https://techcrunch.com/2019/09/04/period-app-clue-hopes-to-predict-if-you-have-pcos/)
- [Clue vs Flo comparison (Her Body Guide)](https://herbodyguide.com/cluevsflo.html)
- [Natural Cycles: How it predicts your next period](https://help.naturalcycles.com/hc/en-us/articles/11832827233565-How-Natural-Cycles-predicts-your-next-period)
- [Natural Cycles: Algorithm learning time](https://help.naturalcycles.com/hc/en-us/articles/360003313193-How-long-will-it-take-for-the-algorithm-to-get-to-know-my-cycle)
- [Natural Cycles: Individualized algorithm (peer-reviewed)](https://www.tandfonline.com/doi/full/10.1080/13625187.2019.1682544)
- [Predictive Modeling of Menstrual Cycle Length (arXiv)](https://arxiv.org/pdf/2308.07927)
- [Period tracker apps: What info are they giving women? (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8504278/)
- [Five things to think about when designing a period tracking app](https://medium.com/hci-design-at-uw/five-things-to-think-about-when-designing-a-period-tracking-app-9a79ac7cf446)
- [UX Case study: Period Tracker for couples](https://medium.com/@kamilbrzozowski/ux-case-study-period-tracker-app-for-couples-5f0cfa6c24c7)
- [Design Critique for Flo (Medium)](https://medium.com/@emilytranthi/design-critique-for-flo-bc6baffb1dd1)
- [Master Thesis: Experience Design of Digital Period Trackers](https://essay.utwente.nl/79706/1/CHAN_MA_EEMCS.pdf)
- [Flo vs Clue vs Glow comparison](https://ovul.ai/flo-vs-clue-vs-glow/)
