# Bilingual Support (Vietnamese + English) — Design Doc

**Date:** 2026-03-07
**Status:** Approved
**Author:** Edward + Claude

## Overview

Add full bilingual support (English + Vietnamese) to the Easel app. All static UI text, phase descriptions, SOS/Whisper signals, error messages, and validation strings will be translated. AI-generated content from the proxy remains English-only in Phase 1.

## Goals

- Vietnamese and English speakers can use Easel in their preferred language
- Language auto-detected from device locale on first launch
- Manual override available in Settings
- Language preference synced to Supabase for future Phase 2 (AI content localization)

## Non-Goals (Phase 1)

- Translating AI-generated proxy content (greetings, insights, partner advice)
- Supporting more than 2 languages
- RTL layout support

## Architecture

### Library Choice

**`i18next` + `react-i18next`** — industry standard, supports namespaces, pluralization, interpolation. ~40KB gzipped total.

### Language Resolution Chain

1. User preference from Supabase `user_preferences.language`
2. Zustand store (AsyncStorage cache)
3. Device locale via `expo-localization`
4. Fallback: `'en'`

### File Structure

```
app/i18n/
  config.ts              # i18next initialization
  en/
    common.json          # Shared buttons, labels, roles
    auth.json            # Sign in/up, password, errors
    onboarding.json      # Role selection
    dashboard.json       # Moon + Sun dashboards
    settings.json        # All settings strings
    calendar.json        # Cycle calendar
    checkin.json         # Daily check-in, moods, symptoms
    signals.json         # SOS + Whisper options
    phases.json          # Phase names, descriptions, tips
    partner.json         # Linking, codes, unlinked screen
    health.json          # Health sync prompts
  vi/
    (same 11 files)
```

### State Management

- **Zustand store:** `language: 'en' | 'vi'` field + `setLanguage()` action
- **Supabase:** `language` column added to `user_preferences` table
- **Sync:** Local-first, background sync to Supabase on change

### Migration

```sql
-- 005_add_language_preference.sql
ALTER TABLE user_preferences
ADD COLUMN language TEXT NOT NULL DEFAULT 'en'
CHECK (language IN ('en', 'vi'));
```

## Translation Scope

| Content | Translated? | Count |
|---------|------------|-------|
| UI text (buttons, labels, headings) | Yes | ~120 |
| Phase descriptions, taglines, tips | Yes | ~24 |
| SOS signal titles & descriptions | Yes | ~8 |
| Whisper option titles & descriptions | Yes | ~64 |
| Mood labels, symptom names | Yes | ~15 |
| Error messages & validation | Yes | ~20 |
| AI-generated content (proxy) | No (Phase 2) | — |
| User-entered text | No (N/A) | — |

**Total: ~185-200 unique translatable strings**

## UI: Language Picker

New row in Settings under ACCOUNT section:
- Icon: globe
- Shows current language with flag (EN / VI)
- Taps to toggle between English and Tieng Viet
- Change takes effect immediately (no restart)

## Dependencies

```
expo-localization     # Device locale detection
i18next               # Core i18n engine
react-i18next         # React bindings
```

## Pluralization

Vietnamese does not have grammatical plurals (same form for singular/plural). However, i18next pluralization is still used for English strings like:

- `"1 day left"` vs `"{{count}} days left"`
- Vietnamese: `"Con {{count}} ngay"` (single form)

## Phase 2 (Future)

- Pass `Accept-Language` header to Vercel proxy
- Update MiniMax prompts to respond in user's language
- Read `user_preferences.language` in Edge Functions for push notification content
