# CR_20260316_002 — Copy Updates Assessment

## Change ID
`CR_20260316_002`

## Phase
Phase 2 — UX Copy Review

## Summary
The Calendar screen rebuild removes MyCycleCard entirely. This makes 11 translation keys in `calendar.json` unused from the Calendar screen. No new copy is needed — all strings for the bottom sheet (flow, symptoms, factors, save/delete/cancel) already exist.

---

## 1. Copy Becoming UNUSED from Calendar

The following keys in `app/i18n/{en,vi}/calendar.json` are used exclusively by `MyCycleCard.tsx`, which will no longer be rendered on the Calendar screen. **Do not delete these keys yet** — `MyCycleCard` is kept in the codebase for potential reuse elsewhere (per the analysis's Out of Scope section).

| Key | EN Value | Used In |
|-----|----------|---------|
| `myCycle` | `"MY CYCLE"` | `MyCycleCard.tsx` only (also exists separately in `settings.json` — settings is unaffected) |
| `cycleLengthStat` | `"{{count}}-day cycle"` | `MyCycleCard.tsx` only |
| `periodLengthStat` | `"{{count}}-day period"` | `MyCycleCard.tsx` only |
| `nextPeriodLabel` | `"Next period"` | `MyCycleCard.tsx` only |
| `periodHistoryTitle` | `"Period History"` | `MyCycleCard.tsx` only |
| `noPeriods` | `"No periods logged yet"` | `MyCycleCard.tsx` only |
| `noPeriodsHint` | `"Log your periods for more accurate predictions"` | `MyCycleCard.tsx` only |
| `logPeriod` | `"Log a period"` | `MyCycleCard.tsx` only |
| `editCycleSettings` | `"Edit"` | `MyCycleCard.tsx` only |
| `cyclePeriodSummary` | `"Cycle length . Period length"` | `MyCycleCard.tsx` only |
| `seeAllPeriods` | `"See all {{count}} periods"` | `MyCycleCard.tsx` only |

**Vietnamese equivalents** (`vi/calendar.json`) mirror the same 11 keys.

**Action**: Leave keys in both JSON files. They become dead code within the Calendar context but remain valid for `MyCycleCard.tsx` if it is referenced from another screen in the future. A cleanup pass can remove them if `MyCycleCard` is permanently deleted.

---

## 2. Copy That STAYS (Used by Retained Components)

### Calendar grid, legend, and general UI
| Key | Used By |
|-----|---------|
| `title` | Screen header |
| `subtitle` | Screen subheader |
| `cycleDay` | CalendarDayCell |
| `periodLogged`, `periodPredicted`, `fertileWindow`, `ovulationDay`, `today` | Legend |
| `legendPredicted`, `legendLogged`, `legendPeriod` | Legend |
| `phaseLabel`, `predictedPeriodDay` | CalendarDayCell tooltips |
| `whatsHappening`, `selfCareTip` | Phase info panel |
| `tapToLog`, `firstTimeHint` | First-use hints (kept per acceptance criteria) |
| `futureDateError`, `tooFarBackError` | Validation messages |
| `predictedTooltip` | Prediction explanation |

### PredictionWindowCard
| Key | Used By |
|-----|---------|
| `predictionWindow`, `periodExpected` | Card header/body |
| `confidenceHigh`, `confidenceMedium`, `confidenceLow` | Confidence badge |

### PeriodLogPanel (converting to bottom sheet)
| Key | Used By |
|-----|---------|
| `flowIntensity` | Flow selector header |
| `spotting`, `light`, `medium`, `heavy` | Flow options |
| `symptoms` | Symptom section header |
| `cramps`, `fatigue`, `headache`, `bloating`, `moodSwings`, `nausea` | Symptom chips |
| `factors`, `factorsSubtitle` | Factor section |
| `stress`, `illness`, `travel`, `medication`, `other` | Factor chips |
| `tagStress`, `tagIllness`, `tagTravel`, `tagMedication`, `tagOther` | Factor tags (display) |
| `addNote`, `notePlaceholder` | Notes input |
| `save`, `delete`, `cancel` | Action buttons |
| `savePeriodLog`, `saving` | Save button states |
| `periodLoggedSuccess`, `saveError`, `noChanges` | Toast messages |
| `dayLogHeader`, `dayFlowLabel` | Bottom sheet header |
| `deleteDay`, `confirmDeleteDay`, `confirmDeleteDayMessage` | Day deletion |
| `confirmDelete`, `confirmDeleteMessage` | Period deletion |
| `logPeriodStart`, `endPeriodHere` | Period start/end actions |

### Partner and notification keys
| Key | Used By |
|-----|---------|
| `moonCycleAtGlance`, `completeOnboarding`, `notLinked`, `linkFirst`, `connectNow` | Sun's view |
| `moonCycleSynced`, `moonCycleAppearHere`, `setCycleSettings` | Sun's view |
| `partnerCalendar`, `calendarPrivate` | PartnerCalendarView |
| `notificationPeriodApproachingTitle`, `notificationPeriodApproachingBody` | Push notifications |
| `partnerPeriodUpdated` | Realtime notification |

---

## 3. New Copy Needed

**None.** All strings required for the bottom sheet interaction already exist in `calendar.json`. The conversion from inline panel to Modal bottom sheet is purely structural — no user-facing labels change.

---

## 4. Tone Consistency

All existing copy follows the warm, non-clinical tone established by the Easel design language:

- Flow levels use friendly labels: "A little", "Light", "Moderate", "Heavy" (not "Spotting", "Light flow", "Medium flow", "Heavy flow")
- Symptoms use casual terms: "Tired" (not "Fatigue"), "Moody" (not "Mood swings")
- Success toast is empathetic: "Got it -- take care of yourself today" (not "Period log saved successfully")
- Hints are encouraging: "Tap any day to start logging your period" (not "No data. Please log periods.")

**No tone changes needed.**

---

## 5. Recommendation for Future Cleanup

Once MyCycleCard is confirmed permanently removed (not reused on any other screen), the 11 keys listed in Section 1 should be deleted from both `en/calendar.json` and `vi/calendar.json` to keep translation files clean. This can be tracked as a separate chore.
