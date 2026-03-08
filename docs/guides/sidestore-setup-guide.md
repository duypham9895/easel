# SideStore Setup Guide for Expo React Native Apps (2026)

> Complete guide for installing SideStore on iOS 17/18, building an Expo SDK 54 IPA with a free Apple ID, and keeping apps signed beyond the 7-day limit.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install SideStore on iPhone](#2-install-sidestore-on-iphone)
3. [Build an Expo React Native IPA with Free Apple ID](#3-build-an-expo-react-native-ipa-with-free-apple-id)
4. [Install IPA via SideStore](#4-install-ipa-via-sidestore)
5. [Auto-Refresh with StosVPN](#5-auto-refresh-with-stosvpn)
6. [Known Limitations and Gotchas](#6-known-limitations-and-gotchas)
7. [SideStore vs AltStore (2026)](#7-sidestore-vs-altstore-2026)
8. [Troubleshooting](#8-troubleshooting)
9. [Sources](#9-sources)

---

## 1. Prerequisites

### Hardware & Software

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| macOS | 10.15 Catalina | macOS 15 Sequoia or later |
| Xcode | 16.x | Xcode 16.4+ (latest stable) |
| iPhone/iPad | iOS 14+ | iOS 17 or iOS 18 |
| USB cable | Lightning or USB-C | Apple-certified cable |
| Apple ID | Free (no paid Developer Program needed) | Same |
| Node.js | 18+ | 20 LTS |
| Expo CLI | Latest | `npm install -g expo-cli` |

### Software Downloads

| Tool | URL | Purpose |
|------|-----|---------|
| SideStore IPA | https://github.com/SideStore/SideStore/releases | Latest stable: v0.6.2, Nightly: v0.6.3 |
| SideServer (macOS) | https://github.com/SideStore/SideServer-macOS/releases | Initial installation tool (replaces AltServer for SideStore) |
| JitterbugPair | https://github.com/osy/Jitterbug/releases | Generates the pairing file |
| StosVPN | App Store (free) | Auto-refresh VPN (replaces WireGuard) |
| SideStore Docs | https://docs.sidestore.io | Official documentation |
| SideStore Website | https://sidestore.io | Official website |

---

## 2. Install SideStore on iPhone

### Step 1: Generate a Pairing File

The pairing file allows SideStore to communicate with your device for signing operations.

```bash
# macOS: Download and run JitterbugPair
# Download from https://github.com/osy/Jitterbug/releases
# Extract the archive, then:

# Connect iPhone via USB, unlock it, and trust the computer
# Run JitterbugPair:
./jitterbugpair
```

- On first run, your iPhone will prompt for a passcode. Enter it, keep the screen on and unlocked, then run the tool again.
- A `.mobiledevicepairing` file will be created in the current directory.

**Important:** Zip the pairing file before transferring it to your device. The file extension can get corrupted during transfer (changed to `.txt` or truncated). SideStore only accepts `.mobiledevicepairing` files.

```bash
# Zip the pairing file to prevent extension corruption
zip pairing.zip *.mobiledevicepairing
```

Transfer the zip to your iPhone via AirDrop, iCloud Drive, or email.

### Step 2: Install SideStore IPA via SideServer

```bash
# Download SideServer for macOS from:
# https://github.com/SideStore/SideServer-macOS/releases

# Move SideServer to /Applications
# Launch SideServer
```

1. Connect your iPhone via USB cable.
2. Click the SideServer icon in the menu bar.
3. Hold **Option** key, click the SideServer icon, and choose **"Sideload .ipa"**.
4. Select the downloaded `SideStore.ipa` file and click **Open**.
5. Enter your Apple ID credentials when prompted (this is your free Apple ID).

### Step 3: Trust the Developer Profile

On your iPhone:

1. Go to **Settings > General > VPN & Device Management**.
2. Find your Apple ID under "Developer App".
3. Tap it and choose **Trust**.

### Step 4: Enable Developer Mode (iOS 16+)

1. Go to **Settings > Privacy & Security**.
2. Scroll to the bottom and toggle **Developer Mode** on.
3. Your device will restart. Confirm the prompt after restart.

> Without Developer Mode enabled, sideloaded apps will fail to launch even if properly signed.

### Step 5: Import Pairing File

1. Open the **Files** app on your iPhone.
2. Navigate to the transferred zip file.
3. Long-press and choose **Uncompress** to extract the `.mobiledevicepairing` file.
4. Launch **SideStore** -- it will prompt you to select the pairing file.
5. Select the `.mobiledevicepairing` file.

### Step 6: Install StosVPN (Replaces WireGuard)

StosVPN is the modern replacement for WireGuard in the SideStore ecosystem. It was released on the App Store in April 2025 and works on both WiFi and cellular data (WireGuard had cellular data issues).

1. Download **StosVPN** from the App Store (free).
2. Launch StosVPN and follow the on-screen setup.
3. When SideStore needs to sign/refresh apps, enable the StosVPN toggle first.

> **Note:** Older guides reference WireGuard. StosVPN completely replaces WireGuard and is the recommended VPN for SideStore in 2026.

### Step 7: Verify Installation

1. Launch SideStore.
2. You should see the SideStore app listed with its expiration date (7 days from installation).
3. The app is ready to sideload IPAs.

---

## 3. Build an Expo React Native IPA with Free Apple ID

### Method A: Xcode GUI (Recommended)

#### Step 1: Generate Native iOS Project

```bash
cd /path/to/your/expo-project  # e.g., ~/Projects/Easel/app

# Generate the native iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios && pod install && cd ..
```

#### Step 2: Open in Xcode

```bash
# Open the .xcworkspace (NOT .xcodeproj)
open ios/*.xcworkspace
```

#### Step 3: Configure Signing with Free Apple ID

1. In Xcode, go to **Settings > Accounts** (Cmd+,).
2. Click **+** and sign in with your free Apple ID.
3. Select your Apple ID, click **Manage Certificates**.
4. Click **+** > **Apple Development** to create a signing certificate.

Then in your project settings:

1. Select your project in the navigator.
2. Select the app target.
3. Go to **Signing & Capabilities** tab.
4. Check **"Automatically manage signing"**.
5. Set **Team** to your personal Apple ID (it will show as "YourName (Personal Team)").
6. Change the **Bundle Identifier** to something unique (e.g., `com.yourname.easel`).

> **Critical:** The bundle identifier must be unique. If another app uses the same bundle ID, signing will fail.

#### Step 4: Build the Archive

1. Set the build target to **"Any iOS Device (arm64)"** (not a simulator).
2. Go to **Product > Archive**.
3. Wait for the build to complete. The Organizer window will open automatically.

#### Step 5: Export as IPA (Free Account Workaround)

With a free Apple ID, Xcode's Organizer will NOT let you export as Ad Hoc or Development. Instead, use the manual `.app` to `.ipa` conversion:

**Option 1: Manual Payload Method**

```bash
# Find the .app bundle in the archive
# Archives are stored at:
ARCHIVE_DIR="$HOME/Library/Developer/Xcode/Archives"

# Find the latest archive
LATEST_ARCHIVE=$(ls -dt "$ARCHIVE_DIR"/*/*.xcarchive | head -1)

# Navigate to the Products directory inside the archive
APP_PATH="$LATEST_ARCHIVE/Products/Applications/YourAppName.app"

# Create the IPA manually
mkdir -p /tmp/Payload
cp -r "$APP_PATH" /tmp/Payload/
cd /tmp
zip -r ~/Desktop/YourApp.ipa Payload/
rm -rf /tmp/Payload
```

**Option 2: Script-Based Method**

Use the open-source script from [Compile-to-ipa-without-developer-account](https://github.com/JustFrederik/Compile-to-ipa-without-developer-account):

```bash
# Clone the helper script
git clone https://github.com/JustFrederik/Compile-to-ipa-without-developer-account.git
cd Compile-to-ipa-without-developer-account

# For workspace-based projects (Expo generates workspaces):
./workspace_build.sh --scheme "YourAppName"
```

**Option 3: xcodebuild Command Line**

```bash
cd /path/to/your/expo-project

# Clean and build
xcodebuild clean build \
  -workspace ios/YourApp.xcworkspace \
  -scheme "YourApp" \
  -configuration Release \
  -sdk iphoneos \
  -derivedDataPath ./build \
  CODE_SIGN_IDENTITY="Apple Development" \
  DEVELOPMENT_TEAM="YOUR_TEAM_ID"

# The .app will be in:
# ./build/Build/Products/Release-iphoneos/YourApp.app

# Convert to IPA
mkdir -p Payload
cp -r ./build/Build/Products/Release-iphoneos/YourApp.app Payload/
zip -r YourApp.ipa Payload/
rm -rf Payload
```

To find your Team ID:
```bash
# Your personal team ID is shown in Xcode under:
# Settings > Accounts > Select Apple ID > look at the Team ID column
# It's usually a 10-character alphanumeric string
```

### Method B: Using `expo run:ios` for Device Build

If you just want to test on a connected device (not create a distributable IPA):

```bash
# This builds and installs directly to a connected device
npx expo run:ios --device --configuration Release
```

This won't produce an IPA file but is the simplest way to test on a physical device.

---

## 4. Install IPA via SideStore

### Step 1: Transfer IPA to iPhone

Transfer the `.ipa` file to your iPhone using:
- AirDrop (easiest)
- iCloud Drive
- Files app via USB
- Any cloud storage

### Step 2: Enable StosVPN

Before installing, enable StosVPN:
1. Open **StosVPN** app.
2. Toggle the VPN **ON**.

### Step 3: Install via SideStore

1. Open **SideStore**.
2. Go to the **"My Apps"** tab.
3. Tap the **+** button.
4. Navigate to and select your `.ipa` file.
5. SideStore will sign the app with your Apple ID certificate and install it.
6. Wait for the installation to complete.

### Step 4: Disable StosVPN

After installation completes, you can disable StosVPN to save battery:
1. Open **StosVPN**.
2. Toggle the VPN **OFF**.

### Step 5: Launch Your App

Your app should now appear on the home screen. Tap to launch.

> **Remember:** The app is signed with a 7-day development certificate. Set up auto-refresh (next section) to avoid expiration.

---

## 5. Auto-Refresh with StosVPN

### How the 7-Day Signing Works

- Free Apple IDs generate development certificates that expire every **7 days**.
- If you don't refresh before expiration, all sideloaded apps stop launching.
- SideStore can re-sign apps to reset the 7-day timer.
- StosVPN enables this re-signing to happen **on-device** without a computer.

### Manual Refresh

1. Open **StosVPN** and enable the VPN.
2. Open **SideStore**.
3. Go to **"My Apps"** tab.
4. Tap **"Refresh All"** (or long-press individual apps to refresh).
5. Wait for the refresh to complete.
6. Disable StosVPN.

### Automated Refresh via iOS Shortcuts

Set up a Shortcuts automation to refresh apps automatically:

1. Download the **"Auto SideStore Refresh"** shortcut from [RoutineHub](https://routinehub.co/shortcut/21145/).
2. Open the **Shortcuts** app.
3. Go to the **Automation** tab.
4. Create a new **Personal Automation**.
5. Choose **"Time of Day"** -- set it to run daily (e.g., 3:00 AM).
6. Select the **"Auto SideStore Refresh"** shortcut as the action.
7. Disable **"Ask Before Running"**.

The automation will:
1. Enable StosVPN.
2. Open SideStore.
3. Trigger a refresh of all apps.
4. Disable StosVPN.
5. Return to the lock screen.

> **Tip:** If refresh fails within 30 seconds, increase the wait time in the shortcut to 40-50 seconds. WiFi must be enabled for the refresh to work.

### Why StosVPN Replaced WireGuard

| Feature | WireGuard (Legacy) | StosVPN (Current) |
|---------|-------------------|-------------------|
| Cellular data | Broken on iOS | Works |
| App Store availability | Not designed for SideStore | Purpose-built, on App Store |
| Auto-refresh compatibility | Unreliable | Designed for automation |
| Setup complexity | Manual config file import | One-tap setup |

---

## 6. Known Limitations and Gotchas

### Apple Free Account Restrictions

| Limitation | Details |
|-----------|---------|
| **3-app limit** | Free Apple IDs can only have 3 sideloaded apps active at once (SideStore counts as 1, leaving 2 slots). |
| **10 apps per week** | You can only install 10 different app IDs in a rolling 7-day window. |
| **7-day expiration** | All apps must be refreshed within 7 days or they stop launching. |
| **No push notifications** | Apps signed with free provisioning cannot use Apple Push Notification service (APNs). |
| **No background modes** | Certain entitlements (background fetch, push notifications) are restricted. |
| **No App Groups** | Sharing data between apps/extensions is not supported. |
| **Device-specific signing** | The IPA is signed for YOUR device only. It cannot be shared with others. |

### SideStore-Specific Issues

| Issue | Details | Workaround |
|-------|---------|------------|
| **Auto-refresh failures** | Shortcut automation sometimes fails with "SideStore could not determine this device's UDID" | Manually refresh if automation fails; check pairing file is valid |
| **LiveContainer limitations** | Apps inside LiveContainer cannot receive push notifications | Keep critical apps outside LiveContainer |
| **Nightly build bugs** | Nightly builds (v0.6.3) are experimental | Use stable release (v0.6.2) for production use |
| **Pairing file invalidation** | iOS updates or device restarts can invalidate the pairing file | Regenerate with JitterbugPair after major iOS updates |
| **Certificate revocation** | Apple can revoke free certificates at any time | Re-sign apps if this happens |

### Expo/React Native Specific Gotchas

| Issue | Details | Solution |
|-------|---------|----------|
| **Bundle ID conflicts** | If your app.json uses a bundle ID already in use, signing fails | Use a unique bundle ID like `com.yourname.appname` |
| **Push notifications won't work** | Free provisioning does not support APNs | Push notifications require a paid $99/yr Apple Developer account |
| **Expo Push Token** | `expo-notifications` won't get a push token with free provisioning | Use local notifications only, or skip push token registration |
| **HealthKit entitlements** | HealthKit requires specific entitlements that may not work with free provisioning | Test thoroughly; may need paid account |
| **App size limit** | Free accounts may have issues with large apps (>4GB) | Keep bundle size optimized |
| **Prebuild regeneration** | Running `npx expo prebuild` again overwrites the `ios/` directory | Commit changes or use config plugins for persistent native modifications |

### Bypassing the 3-App Limit (Advanced)

**LiveContainer Method (Recommended for 2026):**

LiveContainer runs multiple apps inside a single container, using only 1 of your 3 app slots:

1. Download **LiveContainer** IPA from its GitHub releases.
2. Install LiveContainer via SideStore (uses 1 slot).
3. Install additional apps INSIDE LiveContainer.
4. You now effectively have: SideStore (slot 1) + LiveContainer (slot 2) + unlimited apps inside LiveContainer + 1 remaining slot.

**Caveats:**
- Apps inside LiveContainer cannot receive push notifications.
- Some apps may not work correctly inside the container.
- For Easel: Since push notifications are critical for SOS/Whisper alerts, Easel should be installed as a standalone app (not inside LiveContainer).

---

## 7. SideStore vs AltStore (2026)

| Feature | SideStore | AltStore |
|---------|-----------|----------|
| **Computer required** | Only for initial setup | Required for every 7-day refresh |
| **On-device refresh** | Yes (via StosVPN) | No (requires AltServer on computer) |
| **Open source** | Yes (GitHub) | Partially |
| **VPN method** | StosVPN (built-in, works on cellular) | N/A (uses WiFi sync to AltServer) |
| **3-app limit** | Same (Apple restriction) | Same |
| **LiveContainer support** | Yes | Limited |
| **Custom sources/repos** | Yes (multiple) | Yes (AltStore PAL in EU) |
| **Price** | Free | Free (AltStore PAL is paid in EU) |
| **Best for** | Untethered sideloading | Users who don't mind computer dependency |

**Recommendation:** SideStore is the better choice for 2026 because it provides a truly untethered experience after initial setup. AltStore requires keeping a computer running AltServer on the same WiFi network for every refresh cycle.

---

## 8. Troubleshooting

### "Unable to Launch SideStore"
1. Verify Developer Mode is enabled (**Settings > Privacy & Security > Developer Mode**).
2. Verify the developer profile is trusted (**Settings > General > VPN & Device Management**).
3. Try restarting your device.

### "Could Not Determine UDID"
1. Regenerate the pairing file with JitterbugPair.
2. Re-import the new pairing file into SideStore.
3. Make sure your device wasn't restored from a backup after pairing.

### App Expired / Won't Open
1. Open StosVPN and enable it.
2. Open SideStore.
3. Tap "Refresh All" in My Apps.
4. If refresh fails, re-sign the app (remove and re-install the IPA).

### Xcode Signing Errors
- **"No signing certificate"**: Go to Settings > Accounts > Manage Certificates > + > Apple Development.
- **"Failed to register bundle identifier"**: Change your bundle ID to something more unique.
- **"Provisioning profile doesn't include device"**: Make sure the device is connected via USB when building.

### Build Fails After `npx expo prebuild`
```bash
# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# If still failing, clean the build:
xcodebuild clean -workspace ios/*.xcworkspace -scheme YourApp
```

---

## 9. Sources

- [SideStore Official Website](https://sidestore.io/)
- [SideStore Official Documentation](https://docs.sidestore.io/)
- [SideStore GitHub Releases](https://github.com/SideStore/SideStore/releases)
- [SideStore Installation Guide](https://docs.sidestore.io/docs/installation/install)
- [SideStore Prerequisites](https://docs.sidestore.io/docs/installation/prerequisites)
- [SideStore FAQ](https://docs.sidestore.io/docs/faq)
- [SideStore Pairing File Docs](https://docs.sidestore.io/docs/advanced/pairing-file)
- [StosVPN + Auto-Refresh Setup](https://techybuff.com/refresh-sidestore-sideloaded-automode/)
- [StosVPN SideStore Setup Guide](https://techybuff.com/stosvpn-sidestore-setup-2025/)
- [SideStore vs AltStore Comparison](https://ios18apps.com/sidestore-vs-altstore/)
- [AltStore vs Sideloadly vs SideStore](https://ios18apps.com/altstore-vs-sideloadly-vs-sidestore/)
- [SideStore + LiveContainer Guide 2026](https://builds.io/blog/technologies/ios-technologies/sidestore-live-container-guide-2026-free-sideloading/)
- [Bypass 3-App Limit Guide](https://onejailbreak.com/blog/unlimited-ios-apps-installation-guide/)
- [Expo iOS Build Process](https://docs.expo.dev/build-reference/ios-builds/)
- [Expo Local Production Build](https://docs.expo.dev/guides/local-app-production/)
- [Build iOS Expo App Without EAS](https://blog.devgenius.io/how-to-build-an-ios-expo-app-without-using-eas-build-78bfc4002a0f)
- [Free Provisioning Guide 2026](https://copyprogramming.com/howto/launch-your-app-on-devices-using-free-provisioning)
- [Export IPA Without Developer Account](https://medium.com/m%CE%BBgn%CE%BEt%CE%BBr/how-to-export-a-ipa-file-from-xcode-without-a-dev-account-bac8b2645ad3)
- [Compile to IPA Without Developer Account (Script)](https://github.com/JustFrederik/Compile-to-ipa-without-developer-account)
- [Export Unsigned IPA Files Tutorial](https://github.com/MrKai77/Export-unsigned-ipa-files)
- [Auto SideStore Refresh Shortcut](https://routinehub.co/shortcut/21145/)
