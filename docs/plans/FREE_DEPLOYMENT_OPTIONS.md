# Free Deployment Options for Easel (2 Users, Personal Use)

**Research Date:** March 2026
**App Stack:** Expo SDK 54, React Native 0.81, TypeScript, Supabase, Vercel Proxy
**Target:** 2 users (Moon + Sun), iOS primary

---

## Summary Recommendation

| Rank | Option | Best For | Effort |
|------|--------|----------|--------|
| 1 | **Expo Go (both users)** | Fastest start, zero cost, if no custom native modules needed | Minimal |
| 2 | **SideStore + Local IPA Build** | Full native app experience, no 7-day hassle | Medium |
| 3 | **Xcode Free Provisioning (direct)** | Full native, but 7-day re-sign cycle | Low-Medium |
| 4 | **PWA on Vercel** | Web fallback if native features aren't critical | Medium |
| 5 | **Android APK Sideload** | If either user has Android | Low |

---

## Option 1: Expo Go

### How It Works
Both users install the free "Expo Go" app from the App Store. You run `npx expo start` on your dev machine (or use EAS Update), and both users scan a QR code or open a URL to load the app inside Expo Go.

### Cost: $0

### Setup Complexity: Very Low
- Install Expo Go on both iPhones
- Run `npx expo start` on your Mac
- Both devices scan QR code (must be on same WiFi for local dev server)
- For remote access: publish via `eas update` and both users open the update URL in Expo Go

### Feasibility for 2 Users: Excellent
- No Apple Developer account needed at all
- No signing, no provisioning profiles
- Works on iOS and Android simultaneously

### Limitations (Critical for Easel)
| Feature | Works in Expo Go? | Notes |
|---------|-------------------|-------|
| Supabase (auth, DB, realtime) | YES | Standard HTTP/WebSocket |
| Zustand + AsyncStorage | YES | No native module needed |
| i18n (i18next) | YES | Pure JS |
| expo-notifications | PARTIAL | Local notifications work. Push notifications require a development build (custom native code). **Expo Go does NOT support push notifications.** |
| HealthKit (expo-health-connect) | NO | Requires custom native module |
| Expo Router | YES | File-based routing works |
| AI proxy calls | YES | Standard fetch/HTTP |

### Verdict
**Best option if you can live without push notifications and HealthKit.** The core app (cycle tracking, mood logging, whisper/SOS signals via Supabase Realtime in foreground) would work. Push notifications (background SOS alerts) and HealthKit sync would NOT work.

### Workaround for Push Notifications in Expo Go
- Use **Supabase Realtime** for foreground notifications (already implemented)
- SOS/Whisper signals would only be received when the app is open
- This defeats the purpose of SOS alerts for Sun (boyfriend)

---

## Option 2: Expo Development Build (EAS Free Tier)

### How It Works
Build a custom "development client" that includes all native modules (push notifications, HealthKit). Install it on both devices. Then use EAS Update to push JS changes without rebuilding.

### Cost: $0 (with caveats)

### EAS Free Tier Includes
- **15 iOS builds/month** and **15 Android builds/month** (low priority queue)
- **EAS Update:** 1,000 monthly active users, 100 GiB bandwidth
- This is MORE than enough for 2 users

### The Catch: iOS Builds Require Apple Developer Account
- EAS Build for iOS **requires a paid Apple Developer Program ($99/year)** for physical device builds
- EAS can build iOS **simulator** builds for free (useless for real devices)
- **Workaround:** Build locally with `npx expo run:ios --device` using a free Apple ID, then you're back to the 7-day signing limit (see Option 3)

### For Android
- EAS Build for Android works **completely free** — no Google Developer account needed for internal builds
- You get a downloadable APK link

### Setup Complexity: Medium
- Need Xcode installed for local iOS builds
- Need to configure `eas.json` for build profiles
- First build takes longer; subsequent updates via EAS Update are instant

### Verdict
**Good for Android. For iOS, you still need either $99/year Apple Developer or accept 7-day re-signing.** The EAS free tier itself is generous enough for 2 users.

---

## Option 3: iOS Sideloading

### 3a. Xcode Free Provisioning (Direct Build)

#### How It Works
Use your free Apple ID in Xcode. Run `npx expo prebuild` to generate the `ios/` folder, open in Xcode, build directly to your iPhone.

#### Cost: $0

#### Limitations
- **7-day expiry:** App stops working after 7 days. Must reconnect to Xcode and rebuild.
- **3 device limit:** Free account allows 3 registered devices (enough for 2 users)
- **10 App ID limit:** Can only register 10 App IDs per 7-day rolling window
- **Only YOUR devices:** You must physically connect each device to YOUR Mac/Xcode at least once. Your girlfriend's phone needs to be plugged into your Mac for the initial build.
- **No remote distribution:** You can't send her a link to install. She must be physically present with her phone.

#### Workaround for 7-Day Hassle
- Enable **Xcode Wireless Debugging**: both phones on same WiFi as your Mac, rebuild wirelessly every 7 days
- Set a recurring calendar reminder to rebuild
- Takes ~2-3 minutes per rebuild

#### All Features Work
Push notifications, HealthKit, all native modules — everything works in a local Xcode build.

#### Setup Complexity: Low-Medium
- One-time: `npx expo prebuild`, open in Xcode, configure signing with free Apple ID
- Every 7 days: rebuild and re-install on both devices

---

### 3b. SideStore (Recommended Sideloading Option)

#### How It Works
SideStore is a fork of AltStore that auto-refreshes app signatures in the background using a local VPN, eliminating the 7-day re-signing hassle.

#### Cost: $0

#### Setup Process
1. Build your app as an IPA file (via Xcode or `npx expo run:ios --device`)
2. Install SideStore on both iPhones (one-time computer connection required)
3. SideStore uses a special VPN to trick iOS into accepting sideloaded apps
4. SideStore automatically refreshes your app's signature in the background

#### Limitations
- **3 app limit:** Free Apple ID allows only 3 sideloaded apps (SideStore itself counts as 1, so you get 2 more slots — enough for Easel)
- **VPN must stay active:** SideStore's background refresh requires its VPN profile to be enabled
- **Initial setup requires a computer** for pairing file generation
- **iOS compatibility:** Works on iOS 14+ through iOS 18.x
- **10 App ID rotation limit** per 7-day window

#### Features
All native features work (push notifications, HealthKit, etc.) since you're running a full native build.

#### Setup Complexity: Medium
- One-time: Build IPA, install SideStore, configure VPN and pairing
- Ongoing: Mostly automatic, but VPN must stay connected

#### Verdict
**Best free iOS sideloading option.** Eliminates the 7-day rebuild hassle. 2-app slot limit is fine for Easel.

---

### 3c. AltStore

#### How It Works
Similar to SideStore but requires AltServer running on your Mac/PC to refresh apps every 7 days over WiFi.

#### Cost: $0

#### Key Difference from SideStore
- Requires **AltServer** running on your Mac and same WiFi network
- Auto-refreshes when both Mac and iPhone are on the same network
- If you're away from your Mac for 7+ days, apps expire

#### Verdict
Less convenient than SideStore for a couple who may not always be near the same Mac.

---

### 3d. TrollStore

#### NOT VIABLE for modern iOS
- Only works on iOS 14.0 - iOS 16.6.1 and iOS 17.0
- Apple patched the CoreTrust exploit
- If you're on iOS 17.1+ or iOS 18+, TrollStore does not work
- **Skip this option.**

---

## Option 4: Convert to PWA (Progressive Web App)

### How It Works
Export the app as a web application using `npx expo export:web`, host on Vercel/Netlify for free, both users "Add to Home Screen" on their iPhones.

### Cost: $0
- Vercel free tier: 100 GB bandwidth/month
- Netlify free tier: 100 GB bandwidth/month
- Both are more than enough for 2 users

### What Works
| Feature | PWA Support | Notes |
|---------|-------------|-------|
| Supabase (auth, DB, realtime) | YES | Standard web APIs |
| Zustand + AsyncStorage | YES (with adapter) | Use localStorage instead |
| i18n | YES | Pure JS |
| Expo Router (web) | YES | File-based routing works on web |
| AI proxy calls | YES | Standard fetch |
| Push Notifications | PARTIAL | Works on iOS 16.4+ Safari, BUT only after "Add to Home Screen". No background sync. Limited compared to native. |
| HealthKit | NO | Not available via web APIs |
| Background notifications | NO | iOS PWAs cannot receive push when closed |
| Offline support | LIMITED | No Background Sync API on iOS |
| App-like experience | PARTIAL | No splash screen animation, limited gesture support |

### iOS PWA Push Notification Caveats
- User MUST manually "Add to Home Screen" first
- No automatic install prompt in Safari
- Cannot break through Focus Mode
- No Live Activities
- No provisional/silent notifications
- Notifications only delivered when PWA is in foreground or recently backgrounded

### Setup Complexity: Medium
- Need to add web support: `npx expo install react-dom react-native-web @expo/metro-runtime`
- Some components may need platform-specific code (`Platform.select`)
- Service worker configuration for offline support
- Deploy to Vercel: `npx expo export:web && vercel deploy`

### Verdict
**Viable fallback if native features aren't critical.** Push notifications partially work on modern iOS but are unreliable compared to native. HealthKit is completely lost. The UX will feel "web-like" rather than native.

---

## Option 5: Android APK Sideloading

### How It Works
Build a release APK locally and install directly on Android devices.

### Cost: $0

### Build Process
```bash
# Generate android folder
npx expo prebuild --platform android

# Build release APK
cd android && ./gradlew assembleRelease

# APK location
# android/app/build/outputs/apk/release/app-release.apk

# Install via USB
adb install app-release.apk

# Or: share APK file via AirDrop/email/cloud and tap to install
```

### Requirements
- Android device with "Install from Unknown Sources" enabled
- Java/OpenJDK 17 and Android SDK on your Mac
- One-time keystore generation for signing

### All Features Work (Android versions)
- Push notifications (via FCM, free)
- Health Connect (Android's HealthKit equivalent)
- All native modules

### No Expiration
- APK never expires once installed
- Update by building and installing a new APK

### Setup Complexity: Low
- One-time SDK setup
- Build and share APK file
- No re-signing needed

### Verdict
**If either user has an Android phone, this is the easiest fully-featured free option.** No expiration, no re-signing, all features work. The main blocker is that Easel is iOS-primary.

---

## Option 6: EAS Free Tier Details

| Resource | Free Tier Limit | Enough for 2 Users? |
|----------|----------------|---------------------|
| iOS Builds | 15/month (low priority) | YES |
| Android Builds | 15/month (low priority) | YES |
| EAS Update | 1,000 MAU | YES (only 2 users) |
| Update Bandwidth | 100 GiB/month | YES |
| Build Queue | Low priority (slower) | Acceptable |

**Important:** EAS free tier builds are generous enough. The blocker is Apple's requirement for a paid Developer account for iOS device builds, NOT EAS pricing.

---

## Option 7: GitHub Codespaces / Gitpod

### Verdict: NOT VIABLE for mobile app deployment
- These are cloud development environments (VS Code in browser)
- You can run `npx expo start` in a Codespace, but:
  - Expo Go needs to connect to the dev server (port forwarding works but is clunky)
  - No way to build native iOS/Android apps in a container
  - Latency makes hot reload painful
- **Only useful for code editing, not for deployment or running the app**

---

## Option 8: Expo Web Export

### How It Works
```bash
npx expo export:web
# Produces static files in dist/
# Deploy to any static host
```

### Hosting Options (All Free)
| Platform | Free Tier |
|----------|-----------|
| Vercel | 100 GB bandwidth, custom domain |
| Netlify | 100 GB bandwidth, custom domain |
| GitHub Pages | Unlimited for public repos |
| Cloudflare Pages | Unlimited bandwidth |
| EAS Hosting | Preview (no custom domain yet) |

### Same as PWA Option
This is essentially the same as Option 4 (PWA). The output is a web app. Same limitations apply (no HealthKit, limited push, web-like UX).

---

## Option 9: TestFlight Alternatives for iOS

| Alternative | Cost | Requirements |
|-------------|------|-------------|
| TestFlight | Free (but needs $99 Apple Developer) | Paid Apple Developer account |
| EAS Internal Distribution | Free (EAS) + $99 (Apple) | Paid Apple Developer account for ad hoc signing |
| Diawi | Free tier available | Needs signed IPA (requires Apple Developer) |
| Firebase App Distribution | Free | Needs signed IPA |

**All iOS distribution methods require a paid Apple Developer account for signing.** There is no free TestFlight alternative that bypasses this requirement. The only free paths are:
1. Xcode direct build (7-day limit)
2. SideStore/AltStore (auto-refresh workaround)

---

## Option 10: Other Creative Solutions

### 10a. Borrow/Share an Apple Developer Account
- If you know another developer, they can add your device UDIDs to their account
- Ad hoc provisioning supports up to 100 devices per account
- Technically against Apple's terms if used commercially, but fine for personal use
- **Cost: $0 for you** (they absorb the $99)

### 10b. University/Organization Developer Account
- Some universities provide free Apple Developer accounts to students
- Check if either user has access through school or employer

### 10c. Split the Cost
- $99/year = ~$8.25/month = ~$4.12/month per person
- Unlocks: TestFlight (no expiry, easy install), EAS iOS builds, App Store publishing
- **This is the most hassle-free option by far**

### 10d. EU Alternative Distribution (iOS 17.4+)
- In the EU, Apple is required to allow alternative app marketplaces
- AltStore PAL is available in the EU for a small fee (~$1.50/year via Patreon)
- If either user is in the EU, this could be an option
- Apps installed via AltStore PAL don't have the 7-day limit

### 10e. Hybrid Approach (Recommended)
Use **Expo Go** for day-to-day development and Moon's (girlfriend's) usage, and **SideStore** for Sun's (boyfriend's) device where push notifications for SOS alerts are critical:

1. **Moon (girlfriend):** Uses Expo Go — she tracks her own cycle, doesn't critically need push (she knows her own body)
2. **Sun (boyfriend):** Uses SideStore with full native build — gets push notifications for SOS/Whisper alerts
3. Both fall back to **Supabase Realtime** for foreground notifications

---

## Feature Compatibility Matrix

| Feature | Expo Go | Native (Xcode/Side) | PWA | Android APK |
|---------|---------|---------------------|-----|-------------|
| Cycle Tracking UI | YES | YES | YES | YES |
| Supabase Auth | YES | YES | YES | YES |
| Supabase Realtime | YES | YES | YES | YES |
| Zustand State | YES | YES | YES* | YES |
| i18n | YES | YES | YES | YES |
| AI Proxy Calls | YES | YES | YES | YES |
| Push Notifications | NO | YES | PARTIAL | YES |
| HealthKit | NO | YES | NO | N/A** |
| Background SOS Alerts | NO | YES | NO | YES |
| Whisper Signals (foreground) | YES | YES | YES | YES |
| Whisper Signals (background) | NO | YES | NO | YES |
| No Expiration | YES | 7-day*** | YES | YES |

\* AsyncStorage replaced with localStorage
\** Android uses Health Connect instead
\*** SideStore auto-refreshes, effectively no expiration

---

## Final Recommendation for Easel

### If you want $0 and minimal hassle:
**Expo Go for both users.** Accept that push notifications won't work in background. Use Supabase Realtime for foreground-only SOS/Whisper delivery. Both users need to have the app open to receive signals.

### If you want $0 and full features:
**SideStore on both iPhones.** One-time setup per device. Build IPA locally with Xcode + free Apple ID. SideStore auto-refreshes signatures. All native features work. VPN must stay active.

### If you want minimal hassle and can spend $99/year:
**Pay for Apple Developer Program.** Use EAS free tier for builds, TestFlight for distribution. Zero expiration, zero re-signing, both users install via TestFlight link. This is by far the smoothest experience and is worth the $8.25/month.

### Hybrid (Best of Both Worlds, $0):
1. Moon uses **Expo Go** (doesn't need push — she's the one logging)
2. Sun uses **SideStore + full native build** (needs push for SOS alerts)
3. Both get foreground signals via Supabase Realtime
4. Upgrade to Apple Developer if/when the 7-day/SideStore hassle becomes annoying
