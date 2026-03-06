# PRD - Easel (Period Tracker for Couples)

## 1. Overview
- **Product Name:** Easel
- **Mission:** Empowering couples through biological understanding and proactive care.
- **Objective:** Track the female partner's menstrual cycle, educate the male partner on 4 cycle phases, and provide actionable tips for better emotional and physical support.

## 2. Target Audience
- **Female Users:** Want to track their health and feel understood by their partner.
- **Male Users:** Want to support their partner better but might lack knowledge about hormonal cycles.

## 3. Core Features (MVP)
### 3.1. Female Experience
- **HealthKit Sync:** Fetch historical cycle data from Apple Health.
- **Manual Logging:** Log period start/end dates, symptoms (cramps, acne, headache), and moods (happy, irritable, sad).
- **Cycle Visualization:** Intuitive chart showing the 4 phases: Menstrual, Follicular, Ovulatory, and Luteal.
- **SOS / Cravings Button:** Quick signal to partner (e.g., "Need sugar", "Need a hug", "Cramps alert").

### 3.2. Male Experience (Partner Link)
- **Partner Dashboard:** See which phase she is in and the "Days until next period".
- **Intelligent Notifications:** Timely alerts when her phase changes.
- **Actionable Care Tips:** Science-backed advice on how to support her (e.g., "She might feel low energy today, maybe offer to handle dinner?").
- **Shared Calendar:** View important cycle dates to avoid planning stressful events during sensitive days.

## 4. Technical Requirements
- **Platform:** Native iOS (Swift/SwiftUI).
- **Minimum OS:** iOS 17.0+ (utilizing SwiftData).
- **Data Privacy:** 
  - HealthKit for health data.
  - End-to-end encryption for partner communication via CloudKit/Firebase.
- **Apple Watch:** Companion app for quick status checks.

## 5. User Journey
- **Onboarding:** Gf signs up -> Connects HealthKit -> Generates Link Code -> Bf joins via Code -> Sync starts.
- **Daily Loop:** Gf logs (or syncs) -> Bf gets notification/tips -> Bf acts -> Both feel closer.

## 6. Success Metrics
- Daily Active Users (DAU) for both partners.
- Number of "SOS" signals responded to.
- User sentiment/feedback on relationship improvement.
