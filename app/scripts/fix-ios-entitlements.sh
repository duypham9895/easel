#!/bin/bash
# Removes capabilities that require a paid Apple Developer account:
# - Push Notifications (aps-environment)
# - HealthKit Verifiable Health Records (com.apple.developer.healthkit.access)
# Run after: npx expo prebuild --platform ios

ENTITLEMENTS="ios/Easel/Easel.entitlements"

if [ ! -f "$ENTITLEMENTS" ]; then
  echo "Error: $ENTITLEMENTS not found"
  exit 1
fi

cat > "$ENTITLEMENTS" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.developer.healthkit</key>
    <true/>
  </dict>
</plist>
EOF

echo "✔ Fixed entitlements for free Apple Developer account"

# Disable Xcode user script sandboxing — React Native build scripts need to
# write ip.txt (Metro dev server IP) into the app bundle, which the default
# Xcode 26 sandbox blocks.
PBXPROJ="ios/Easel.xcodeproj/project.pbxproj"
if [ -f "$PBXPROJ" ]; then
  sed -i '' 's/ENABLE_USER_SCRIPT_SANDBOXING = YES;/ENABLE_USER_SCRIPT_SANDBOXING = NO;/g' "$PBXPROJ"
  echo "✔ Disabled user script sandboxing in Xcode project"
fi
