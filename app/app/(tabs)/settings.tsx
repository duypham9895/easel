import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';

export default function SettingsTab() {
  const { email, role, cycleSettings, updateCycleSettings, signOut, generateLinkCode, linkCode } =
    useAppStore();

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
            <Row label="Email" value={email} />
            <Divider />
            <Row label="Role" value={role === 'girlfriend' ? '🌸 Girlfriend' : '💙 Boyfriend'} />
          </View>
        </View>

        {/* Partner Linking */}
        {role === 'girlfriend' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PARTNER LINK</Text>
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                Share this code with your boyfriend so he can join your cycle.
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

        {/* Cycle settings — GF only */}
        {role === 'girlfriend' && (
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

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
