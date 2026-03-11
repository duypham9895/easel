# PWA Deployment Research — Expo SDK 54 / React Native Web

**Date:** 2026-03-09
**Status:** Research complete
**Relevance:** Easel couples period tracking app

---

## 1. Expo Web Export Command

### Correct Command (SDK 54)
```bash
npx expo export -p web
# or long form:
npx expo export --platform web
```

**NOT** `expo export:web` — that syntax is deprecated (Webpack era). The current command uses Metro bundler and outputs to the `dist/` directory.

### Output Modes (configured in app.json)
```json
{
  "expo": {
    "web": {
      "output": "single",   // default — SPA, one index.html
      "bundler": "metro"
    }
  }
}
```

| Mode | Description | Best For |
|------|-------------|----------|
| `single` | Single index.html, client-side routing | SPAs like Easel |
| `static` | Pre-rendered HTML per route | SEO-heavy sites |
| `server` | Server + client bundles, API routes | Full-stack apps (alpha in SDK 55+) |

**For Easel:** Use `single` mode. The app is a SPA with client-side routing via Expo Router v4.

### Local Testing
```bash
npx expo serve
# Serves dist/ at http://localhost:8081
```

---

## 2. PWA on iOS Safari in 2026

### Push Notifications — YES, with caveats

**Status:** Supported since iOS 16.4 (March 2023). Functional in 2026.

**Requirements:**
- PWA MUST be installed to Home Screen (not from Safari tab)
- User must grant explicit permission after an interaction (no auto-prompt)
- Uses standard Web Push API (VAPID keys), not Expo Push
- Safari 18.4 added Declarative Web Push

**Reliability issues:**
- Some developers report notifications working initially then stopping
- Less reliable than native APNs
- No guaranteed delivery like native push

**Critical for Easel:** `expo-notifications` does NOT support web at all. You would need to implement Web Push API directly or use a service like OneSignal, Firebase Cloud Messaging, or Braze for web push. This is a significant development effort.

### HealthKit Access — NO

**HealthKit is completely unavailable to PWAs.** HealthKit is an iOS-native framework with no web API. Apple has no plans to expose health data to web apps. All Apple Health data stays on-device and is only accessible through native iOS frameworks.

PWAs also cannot access: Bluetooth, NFC, USB, or most device sensors beyond basic accelerometer/gyroscope. Apple declined to implement 16 web APIs in Safari citing privacy/fingerprinting concerns.

**Impact on Easel:** The `expo-health` HealthKit integration will not work at all in PWA mode. Health sync features must be disabled or hidden on web.

### Background Execution — Very Limited

- No Background Sync API
- No Periodic Background Sync
- No Background Fetch
- Service workers can handle push notification events and cache management only
- No timeline for Apple to implement these APIs

**Impact on Easel:** Real-time cycle notifications and background sync will not work like native. The app can only function when actively open or via web push (if installed to Home Screen).

### iOS 26 Improvement
Every site added to Home Screen now defaults to opening as a web app (standalone mode). This is a positive change for PWA adoption.

---

## 3. Deploying to Vercel Free Tier

### Step-by-Step

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel@latest
   ```

2. **Create `vercel.json` in project root (app/):**
   ```json
   {
     "buildCommand": "expo export -p web",
     "outputDirectory": "dist",
     "devCommand": "expo",
     "cleanUrls": true,
     "framework": null,
     "rewrites": [
       {
         "source": "/:path*",
         "destination": "/"
       }
     ]
   }
   ```
   The `rewrites` rule is critical for SPA — routes all paths to index.html for client-side routing.

3. **Deploy:**
   ```bash
   cd app
   vercel
   ```

4. **For production:**
   ```bash
   vercel --prod
   ```

### Free Tier (Hobby Plan) Limits

| Resource | Limit |
|----------|-------|
| Projects | Unlimited |
| Bandwidth | 100 GB/month |
| Edge Requests | 1M/month |
| Build Minutes | 6,000/month |
| Serverless Function Invocations | 150,000/month |
| Team Members | 1 (solo only) |
| Commercial Use | **NOT ALLOWED** |

**Important restrictions:**
- Personal/non-commercial use ONLY — if Easel generates revenue, you need a paid plan ($20/month Pro)
- No overage — when you hit the limit, service stops
- 100 GB bandwidth handles ~100K visitors/month

**Note:** The Easel proxy is already on Vercel. You could deploy the web app as a separate Vercel project under the same account.

---

## 4. React Native Web Compatibility

### What Works on Web

| Component/Library | Web Support | Notes |
|-------------------|-------------|-------|
| View, Text, Image, ScrollView | YES | Core RN components work via react-native-web |
| TouchableOpacity, Pressable | YES | Mapped to web equivalents |
| FlatList, SectionList | YES | Works but may need performance tuning |
| TextInput | YES | Works with web input elements |
| Modal | YES | Works with some styling differences |
| Animated API | YES | Works via react-native-web |
| Expo Router v4 | YES | File-based routing works on web |
| Zustand | YES | Pure JS, fully web-compatible |
| i18next / react-i18next | YES | Framework-agnostic, works everywhere |
| Supabase JS client | YES | Designed for web first |
| AsyncStorage | YES | Uses localStorage on web |
| expo-localization | YES | Web-compatible |

### What Does NOT Work on Web

| Component/Library | Web Support | Alternative |
|-------------------|-------------|-------------|
| `expo-notifications` | NO | Web Push API + VAPID keys, or OneSignal/FCM |
| `expo-health` (HealthKit) | NO | No alternative — HealthKit is native-only |
| `expo-haptics` | NO | No web equivalent |
| `expo-device` | PARTIAL | Limited device info via navigator |
| Native modules (Swift/Kotlin) | NO | Must use web APIs |
| `react-native-reanimated` | PARTIAL | Basic animations work, some gestures don't |
| `expo-secure-store` | NO | Use encrypted localStorage or cookies |

### Platform-Specific Code Pattern

Already used in Easel — continue using `Platform.OS` checks:

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code
} else if (Platform.OS === 'ios') {
  // iOS-specific code
}
```

Or use file extensions: `Component.web.tsx` / `Component.ios.tsx` / `Component.tsx` (default).

---

## 5. Supabase on Web PWA

### Full Compatibility — YES

Supabase works perfectly in browser PWAs:

| Feature | Browser Support | Notes |
|---------|----------------|-------|
| Auth (email, OAuth) | YES | Works exactly the same |
| Database queries | YES | REST API, no native deps |
| Realtime (WebSocket) | YES | Supabase was designed for web first |
| Storage | YES | Standard HTTP uploads |
| Edge Functions | YES | Called via HTTP |
| Row Level Security | YES | JWT-based, platform-agnostic |

**Realtime specifics:**
- Uses WebSocket API (all modern browsers support this)
- Broadcast, Presence, and Postgres Changes all work
- Connections last 24 hours without auth, indefinitely with signed-in user
- Works with Easel's couples realtime subscriptions and SOS signals

**No changes needed** for Supabase integration when moving to web.

---

## 6. PWA Features on iOS

### Add to Home Screen
- Manual process: user must tap Share > Add to Home Screen in Safari
- No install prompt like Android (no `beforeinstallprompt` event)
- iOS 26: sites added to Home Screen default to web app mode
- Can show a custom "Add to Home Screen" banner/tooltip to guide users

### Standalone Mode
- Set `"display": "standalone"` in manifest.json
- Hides Safari address bar and navigation
- Shows app in iOS app switcher like a native app
- Status bar can be themed (meta tag `apple-mobile-web-app-status-bar-style`)

### App Icon & Splash Screen
- Icons: 192x192 and 512x512 PNG in manifest.json
- Apple-specific: `<link rel="apple-touch-icon" href="icon-180.png">`
- Splash: Use `apple-touch-startup-image` meta tags (multiple sizes needed)
- iOS ignores manifest splash_screen — requires Apple-specific meta tags

### Storage & Persistence
- localStorage: ~5MB
- IndexedDB: Generous quota (Safari increased limits recently)
- Cache API: Available for service worker caching
- **Caveat:** iOS can evict PWA storage after ~7 days of inactivity (improved but still a risk)
- AsyncStorage (Expo) maps to localStorage on web

### manifest.json for Easel PWA
```json
{
  "short_name": "Easel",
  "name": "Easel — Couples Period Tracker",
  "icons": [
    { "src": "icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "icon-512.png", "type": "image/png", "sizes": "512x512" }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0D1B2A",
  "background_color": "#0D1B2A",
  "orientation": "portrait"
}
```

---

## 7. Platform Comparison: Vercel vs Netlify vs Cloudflare Pages

| Feature | Vercel (Hobby) | Netlify (Starter) | Cloudflare Pages (Free) |
|---------|---------------|-------------------|------------------------|
| **Bandwidth** | 100 GB/mo | 100 GB/mo | **Unlimited** |
| **Build Minutes** | 6,000/mo | 300/mo | 500 builds/mo |
| **Requests** | 1M edge/mo | 1M edge fn/mo | **Unlimited** |
| **Serverless Functions** | 150K invocations | 125K invocations | 100K Workers/day |
| **Team Size** | 1 | 1 | **Unlimited** |
| **Commercial Use** | NO (Hobby) | YES | **YES** |
| **Custom Domains** | Yes | Yes | Yes (100/project) |
| **Global CDN** | 100+ locations | CDN included | **300+ locations** |
| **Deploy from Git** | Yes | Yes | Yes |
| **Preview Deploys** | Yes | Yes | Yes |

### Recommendation for Easel

**Cloudflare Pages is the best choice** for the PWA deployment:

1. **Unlimited bandwidth** — no surprise throttling
2. **Commercial use allowed** on free tier — important if Easel monetizes
3. **Largest edge network** (300+ locations) — fastest static delivery
4. **Unlimited team members** — can add collaborators
5. **Simple deployment:** Connect GitHub repo, set build command to `npx expo export -p web`, output dir to `dist/`

**Vercel consideration:** Easel's proxy is already on Vercel. Deploying the web app there too simplifies infrastructure but the Hobby plan prohibits commercial use.

### Cloudflare Pages Setup
```bash
# Option 1: CLI
npm install -g wrangler
wrangler pages deploy dist/

# Option 2: Dashboard (recommended)
# 1. Go to dash.cloudflare.com > Pages
# 2. Connect GitHub repository
# 3. Set build command: cd app && npm install && npx expo export -p web
# 4. Set output directory: app/dist
# 5. Deploy
```

---

## 8. Easel-Specific PWA Feasibility Assessment

### What Works Without Changes
- All UI screens (Moon/Sun dashboards, settings, logs)
- Supabase auth, database, realtime
- Zustand state management + persistence (via localStorage)
- i18n (English/Vietnamese)
- Expo Router navigation
- Theme system (Moon dark indigo, Sun warm cream)
- Phase calculations (pure math in cycleCalculator.ts)
- AI features via proxy (HTTP calls)

### What Needs Web-Specific Implementation
| Feature | Effort | Approach |
|---------|--------|----------|
| Push notifications | HIGH | Replace expo-notifications with Web Push API + service worker |
| Whisper/SOS alerts | MEDIUM | Web Push for background, Supabase Realtime for foreground |
| Secure storage | LOW | Replace expo-secure-store with encrypted localStorage |

### What Cannot Work on Web
| Feature | Reason | Mitigation |
|---------|--------|------------|
| HealthKit sync | No web API for Apple Health | Hide health features, show "Available on iOS app" |
| Haptic feedback | No web equivalent | Skip silently (already should be guarded) |
| Background cycle checks | No background sync on iOS PWA | Rely on web push (when Home Screen installed) |

### Overall Assessment

**PWA is viable for Easel as a companion experience**, not a full replacement for the native app. The core value proposition (cycle tracking, partner sync, AI insights) works on web. The main gaps are:

1. **Notifications** — solvable with Web Push API but requires significant work and is less reliable than native
2. **HealthKit** — permanently unavailable on web, must be native-only
3. **Background execution** — limited, but acceptable for a companion app

**Recommended strategy:** Ship the PWA with core features (dashboards, logging, partner sync, AI) and mark HealthKit/advanced notifications as "iOS app exclusive" features. This gives Sun (boyfriend) easy access without installing the app while Moon (girlfriend) uses the native app for full features.

---

## Sources

- [Expo PWA Guide](https://docs.expo.dev/guides/progressive-web-apps/)
- [Expo Publishing Websites](https://docs.expo.dev/guides/publishing-websites/)
- [Expo Notifications SDK Reference](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [PWA on iOS 2025 — Brainhub](https://brainhub.eu/library/pwa-on-ios)
- [PWAs on iOS 2026 — MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Limits](https://vercel.com/docs/limits)
- [Cloudflare Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Pages Free Tier Infographic](https://www.freetiers.com/directory/cloudflare-pages)
- [Vercel vs Netlify vs Cloudflare 2026 — Codebrand](https://www.codebrand.us/blog/vercel-vs-netlify-vs-cloudflare-2026/)
- [Vercel vs Netlify vs Cloudflare 2025 — Digital Applied](https://www.digitalapplied.com/blog/vercel-vs-netlify-vs-cloudflare-pages-comparison)
- [React Native for Web 2025 — Medium](https://medium.com/react-native-journal/react-native-for-web-in-2025-one-codebase-all-platforms-b985d8f7db28)
- [Expo Router PWA Discussion](https://github.com/expo/router/discussions/408)
- [iOS Safari Web Push — OneSignal](https://documentation.onesignal.com/docs/en/web-push-for-ios)
- [Supabase JS on JSR](https://jsr.io/@supabase/supabase-js)
