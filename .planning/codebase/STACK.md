# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**
- TypeScript 5.3.3 - Mobile app, proxy, and tooling (strict mode enabled)
- JavaScript - Configuration files, landing page

**Secondary:**
- SQL - Supabase PostgreSQL migrations in `app/supabase/migrations/`
- Deno (TypeScript) - Supabase Edge Functions in `app/supabase/functions/`

## Runtime

**Mobile & Dev:**
- Expo SDK 54 - React Native development environment and managed hosting
- React 19.1.0 - UI framework (React Native)
- React Native 0.81.5 - Cross-platform mobile runtime
- Node.js 20.x+ - Required for proxy and local development

**Backend:**
- Vercel Serverless Functions (Node 20.x) - Proxy AI endpoints
- Supabase Edge Functions (Deno) - Database webhooks and scheduled tasks

## Package Managers

**Primary:**
- npm - Dependency management across all workspaces
- Lockfile: `package-lock.json` present in app/ and proxy/

**Additional:**
- Supabase CLI - Database migrations and Edge Function deployment

## Frameworks

**Mobile:**
- Expo Router 6.0.23 - File-based routing for React Native
- React Native Calendars 1.1306.0 - Calendar UI with cycle phase visualization
- React Native Reanimated 4.1.1 - High-performance native animations
- React Native Gesture Handler 2.28.0 - Native gesture detection
- React Native Screens 4.16.0 - Native screen optimization

**State Management:**
- Zustand 5.0.2 - Global state with AsyncStorage persistence (`app/store/appStore.ts`)

**Data Access:**
- @supabase/supabase-js 2.98.0 - Supabase client (auth, DB, realtime, storage)

**Native Integrations:**
- react-native-health 1.7.0 - Apple HealthKit integration (iOS only)
- react-native-health-connect 3.1.0 - Android Health Connect integration
- expo-local-authentication 17.0.8 - Biometric auth (Face ID/Touch ID)
- expo-notifications 0.32.16 - Push notification handling
- expo-image-picker 17.0.10 - Camera and photo library access
- expo-linear-gradient 15.0.8 - Gradient UI components

**Utilities:**
- i18next 25.8.14 - Internationalization framework
- react-i18next 16.5.6 - React integration for i18n
- expo-localization 17.0.8 - Platform locale detection
- @react-native-async-storage/async-storage 2.2.0 - Persistent key-value storage
- @react-native-community/datetimepicker 8.4.4 - Native date/time picker
- react-native-url-polyfill 3.0.0 - URL API polyfill for React Native
- react-native-worklets 0.5.2 - Background task support

**Proxy:**
- @vercel/node 5.0.0 - Vercel serverless function types and utilities

## Testing

**Framework:**
- Jest 30.3.0 - Test runner and assertions
- ts-jest 29.4.6 - TypeScript transformer for Jest

**Test Location Pattern:**
- `app/utils/__tests__/` - Utility tests (cycleCalculator, integration tests)
- `app/components/moon/__tests__/` - Component-specific tests
- `app/hooks/__tests__/` - Hook tests
- `app/__tests__/` - Root tests (appStore, realtime, E2E)

**Test Configuration:**
- Config file: `app/jest.config.js`
- Module mapping: `@/*` → `<rootDir>/*`
- Transform: TypeScript via ts-jest
- Test environment: Node (not browser, as tests focus on logic)

## Build & Deployment

**Build Tools:**
- Expo CLI / EAS Build - Native iOS/Android builds via `npx expo run:ios|android`
- Vercel CLI - Serverless proxy deployment (`vercel deploy --prod`)
- Supabase CLI - Database migration and Edge Function deployment

**Build Configuration:**
- `app/app.json` - Expo/EAS configuration (iOS bundle ID: `com.duypham.easel`, Android: `com.easel.app`)
- `app/tsconfig.json` - TypeScript with path aliases (`@/*`)
- `proxy/vercel.json` - Security headers for `/api/*` endpoints (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- `app/supabase/config.toml` - Local Supabase emulator setup (PostgreSQL 15)

## Platform Requirements

**Development:**
- Node.js 20.x or higher
- Expo Account (for EAS builds and push tokens)
- Supabase Account (PostgreSQL access)
- (Optional) Vercel Account for proxy deployment
- (Optional) MiniMax Account for AI functionality (API key)
- iOS development: Xcode 15+ with iOS 14.5+ SDK
- Android development: Android Studio / Android 11+ SDK

**Production:**
- iOS 14.5+ (deployed via Expo / TestFlight)
- Android 5.0+ (deployed via Google Play — not yet live)
- Supabase cloud project (PostgreSQL + Realtime + Auth + Storage + Edge Functions)
- Vercel deployment for proxy (serverless functions)
- MiniMax M2.5 API for AI endpoints

## Environment Configuration

**App (.env):**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon role JWT
- `EXPO_PUBLIC_PROXY_URL` - Vercel proxy base URL (optional; AI falls back to static content)
- `EXPO_PUBLIC_CLIENT_TOKEN` - Shared secret for proxy authentication
- `EXPO_PUBLIC_EAS_PROJECT_ID` - EAS Build project reference for Expo Push Tokens

**Proxy (.env):**
- `MINIMAX_API_KEY` - MiniMax API authentication key
- `MINIMAX_MODEL` - Model identifier (default: `MiniMax-M2.5`)
- `CLIENT_TOKEN` - Must match app's `EXPO_PUBLIC_CLIENT_TOKEN`

**Supabase (via GitHub Secrets):**
- `SUPABASE_ACCESS_TOKEN` - Personal access token for CLI
- `SUPABASE_PROJECT_ID` - Project reference ID
- `SUPABASE_DB_URL` - Direct PostgreSQL connection string

## Version Management

**Current Version:** v1.6.1 (defined in `app/app.json` → `expo.version`)

**Build Numbers:**
- iOS: defined in `app/app.json` → `expo.ios.buildNumber`
- Android: defined in `app/app.json` → `expo.android.versionCode`

---

*Stack analysis: 2026-03-22*
