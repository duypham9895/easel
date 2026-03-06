import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, Switch, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useHealthSync } from '@/hooks/useHealthSync';

export default function SettingsTab() {
  const { email, role, cycleSettings, updateCycleSettings, signOut, generateLinkCode, linkCode,
    notificationPrefs, updateNotificationPrefs } =
    useAppStore();
  const avatarUrl = useAppStore((s) => s.avatarUrl);
  const { upload, isUploading } = useAvatarUpload();
  const displayName = useAppStore((s) => s.displayName);
  const updateDisplayName = useAppStore((s) => s.updateDisplayName);
  const { sync: syncHealth, isAvailable: healthAvailable } = useHealthSync();
  const [displayNameInput, setDisplayNameInput] = useState(displayName ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSyncingHealth, setIsSyncingHealth] = useState(false);

  const [cycleLen, setCycleLen] = useState(String(cycleSettings.avgCycleLength));
  const [periodLen, setPeriodLen] = useState(String(cycleSettings.avgPeriodLength));
  const [lastPeriod, setLastPeriod] = useState(cycleSettings.lastPeriodStartDate);

  async function handleSaveCycle() {
    const cl = parseInt(cycleLen, 10);
    const pl = parseInt(periodLen, 10);
    if (isNaN(cl) || isNaN(pl) || cl < 21 || cl > 45 || pl < 2 || pl > 10) {
      Alert.alert('Invalid values', 'Cycle: 21–45 days. Period: 2–10 days.');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const parsedDate = new Date(lastPeriod);
    if (!dateRegex.test(lastPeriod) || isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Enter date as YYYY-MM-DD (e.g. 2026-02-14).');
      return;
    }
    try {
      await updateCycleSettings({
        avgCycleLength: cl,
        avgPeriodLength: pl,
        lastPeriodStartDate: lastPeriod,
      });
      Alert.alert('Saved', 'Cycle settings updated.');
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
  }

  async function handleSaveName() {
    const trimmed = displayNameInput.trim();
    if (!trimmed) return;
    setIsSavingName(true);
    try {
      await updateDisplayName(trimmed);
    } catch {
      Alert.alert('Error', 'Could not save name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleHealthSync() {
    setIsSyncingHealth(true);
    try {
      await syncHealth();
      Alert.alert('Synced', 'Health data updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not sync health data. Please try again.');
    } finally {
      setIsSyncingHealth(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          signOut().then(() => router.replace('/auth'));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <AvatarPicker url={avatarUrl} onPress={upload} loading={isUploading} />
            <Divider />
            <Row label="Email" value={email} />
            <Divider />
            <View style={rowStyles.row}>
              <Text style={rowStyles.label}>Display Name</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[settingStyles.input, { width: 120, padding: 6 }]}
                  value={displayNameInput}
                  onChangeText={setDisplayNameInput}
                  onSubmitEditing={handleSaveName}
                  returnKeyType="done"
                  placeholderTextColor={Colors.textHint}
                  placeholder="Your name"
                />
                {isSavingName ? (
                  <ActivityIndicator size="small" color={Colors.textHint} />
                ) : (
                  <TouchableOpacity onPress={handleSaveName}>
                    <Feather name="check" size={18} color={Colors.menstrual} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Divider />
            <Row label="Role" value={role === 'moon' ? 'Moon' : 'Sun'} />
          </View>
        </View>

        {/* Partner Linking */}
        {role === 'moon' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PARTNER LINK</Text>
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                Share this code with your Sun so they can join your cycle.
              </Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => generateLinkCode()}
                activeOpacity={0.85}
              >
                <Text style={styles.generateButtonText}>Generate Link Code</Text>
              </TouchableOpacity>
              {linkCode && (
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>{linkCode}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Health Sync — Moon only */}
        {role === 'moon' && healthAvailable && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HEALTH DATA</Text>
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                Re-sync your cycle history from Apple Health to improve period predictions.
              </Text>
              <TouchableOpacity
                style={[styles.generateButton, isSyncingHealth && { opacity: 0.6 }]}
                onPress={handleHealthSync}
                activeOpacity={0.85}
                disabled={isSyncingHealth}
              >
                {isSyncingHealth ? (
                  <ActivityIndicator color={Colors.menstrual} />
                ) : (
                  <Text style={styles.generateButtonText}>Sync Health Data</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cycle settings — Moon only */}
        {role === 'moon' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CYCLE SETTINGS</Text>
            <View style={styles.card}>
              <SettingInput
                label="Average Cycle Length (days)"
                value={cycleLen}
                onChangeText={setCycleLen}
                keyboardType="number-pad"
              />
              <Divider />
              <SettingInput
                label="Average Period Length (days)"
                value={periodLen}
                onChangeText={setPeriodLen}
                keyboardType="number-pad"
              />
              <Divider />
              <SettingInput
                label="Last Period Start (YYYY-MM-DD)"
                value={lastPeriod}
                onChangeText={setLastPeriod}
                keyboardType="default"
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCycle}>
                <Text style={styles.saveButtonText}>Save Cycle Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notifications — Moon only */}
        {role === 'moon' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
            <View style={styles.card}>
              <ToggleRow label="Period approaching" value={notificationPrefs.periodApproaching} onToggle={v => updateNotificationPrefs({ periodApproaching: v })} />
              <Divider />
              <ToggleRow label="Period started" value={notificationPrefs.periodStarted} onToggle={v => updateNotificationPrefs({ periodStarted: v })} />
              <Divider />
              <ToggleRow label="Period ended" value={notificationPrefs.periodEnded} onToggle={v => updateNotificationPrefs({ periodEnded: v })} />
              <Divider />
              <ToggleRow label="Whisper alerts" value={notificationPrefs.whisperAlerts} onToggle={v => updateNotificationPrefs({ whisperAlerts: v })} />
              <Divider />
              <ToggleRow label="Let AI decide timing" value={notificationPrefs.useAiTiming} onToggle={v => updateNotificationPrefs({ useAiTiming: v })} />
              {!notificationPrefs.useAiTiming && (
                <>
                  <Divider />
                  <View style={rowStyles.row}>
                    <Text style={rowStyles.label}>Days before period</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity onPress={() => updateNotificationPrefs({ manualDaysBefore: Math.max(1, notificationPrefs.manualDaysBefore - 1) })}>
                        <Feather name="minus-circle" size={22} color={Colors.textHint} />
                      </TouchableOpacity>
                      <Text style={[rowStyles.value, { minWidth: 24, textAlign: 'center' }]}>{notificationPrefs.manualDaysBefore}</Text>
                      <TouchableOpacity onPress={() => updateNotificationPrefs({ manualDaysBefore: Math.min(7, notificationPrefs.manualDaysBefore + 1) })}>
                        <Feather name="plus-circle" size={22} color={Colors.menstrual} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function AvatarPicker({ url, onPress, loading }: { url: string | null; onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity
      style={{ alignItems: 'center', paddingVertical: Spacing.md }}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: Colors.inputBg,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {loading ? (
          <ActivityIndicator color={Colors.textHint} />
        ) : url ? (
          <Image source={{ uri: url }} style={{ width: 72, height: 72 }} />
        ) : (
          <Feather name="user" size={28} color={Colors.textHint} />
        )}
      </View>
      <Text style={{ ...Typography.caption, color: Colors.textHint, marginTop: 6 }}>
        {loading ? 'Uploading...' : 'Tap to change photo'}
      </Text>
    </TouchableOpacity>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: Colors.inputBg, marginVertical: 2 }} />;
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Switch value={value} onValueChange={onToggle}
        trackColor={{ false: Colors.inputBg, true: Colors.menstrual + '80' }}
        thumbColor={value ? Colors.menstrual : Colors.textHint} />
    </View>
  );
}

function SettingInput({
  label, value, onChangeText, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType: 'number-pad' | 'default';
}) {
  return (
    <View style={settingStyles.row}>
      <Text style={settingStyles.label}>{label}</Text>
      <TextInput
        style={settingStyles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textHint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, paddingTop: Spacing.md },
  section: { gap: Spacing.sm },
  sectionLabel: { ...Typography.tiny, color: Colors.textHint, letterSpacing: 1 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radii.lg, padding: Spacing.md, gap: Spacing.sm,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  cardBody: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  generateButton: {
    backgroundColor: Colors.menstrual + '18', borderRadius: Radii.md,
    padding: Spacing.md, alignItems: 'center',
  },
  generateButtonText: { ...Typography.bodyBold, color: Colors.menstrual },
  codeDisplay: {
    backgroundColor: Colors.inputBg, borderRadius: Radii.md,
    padding: Spacing.md, alignItems: 'center',
  },
  codeText: { fontSize: 32, fontWeight: '800', letterSpacing: 8, color: Colors.textPrimary },
  saveButton: {
    backgroundColor: Colors.textPrimary, borderRadius: Radii.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.xs,
  },
  saveButtonText: { ...Typography.bodyBold, color: Colors.white },
  signOutButton: {
    backgroundColor: Colors.card, borderRadius: Radii.lg,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: '#EF535018',
  },
  signOutText: { ...Typography.bodyBold, color: '#EF5350' },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.bodyBold, color: Colors.textPrimary },
});

const settingStyles = StyleSheet.create({
  row: { paddingVertical: Spacing.xs, gap: 4 },
  label: { ...Typography.caption, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: Radii.sm,
    padding: Spacing.sm, ...Typography.body, color: Colors.textPrimary,
  },
});
