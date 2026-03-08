import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, Switch, Image, ActivityIndicator, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useHealthSync } from '@/hooks/useHealthSync';
import { getCurrentDayInCycle, getCurrentPhase, getDaysUntilNextPeriod } from '@/utils/cycleCalculator';
import type { SupportedLanguage } from '@/i18n/config';

export default function SettingsTab() {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { t: tPhases } = useTranslation('phases');
  const email = useAppStore(s => s.email);
  const role = useAppStore(s => s.role);
  const cycleSettings = useAppStore(s => s.cycleSettings);
  const updateCycleSettings = useAppStore(s => s.updateCycleSettings);
  const signOut = useAppStore(s => s.signOut);
  const generateLinkCode = useAppStore(s => s.generateLinkCode);
  const linkCode = useAppStore(s => s.linkCode);
  const isPartnerLinked = useAppStore(s => s.isPartnerLinked);
  const partnerCycleSettings = useAppStore(s => s.partnerCycleSettings);
  const rawNotificationPrefs = useAppStore(s => s.notificationPrefs);
  const updateNotificationPrefs = useAppStore(s => s.updateNotificationPrefs);
  // Guard against legacy persisted store missing this field
  const notificationPrefs = rawNotificationPrefs ?? {
    periodApproaching: true, periodStarted: true, periodEnded: true,
    whisperAlerts: true, useAiTiming: true, manualDaysBefore: 3,
  };
  const avatarUrl = useAppStore(s => s.avatarUrl);
  const { upload, isUploading } = useAvatarUpload();
  const displayName = useAppStore(s => s.displayName);
  const updateDisplayName = useAppStore(s => s.updateDisplayName);
  const language = useAppStore(s => s.language);
  const setLanguage = useAppStore(s => s.setLanguage);
  const { sync: syncHealth, isAvailable: healthAvailable } = useHealthSync();
  const [displayNameInput, setDisplayNameInput] = useState(displayName ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSyncingHealth, setIsSyncingHealth] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const [cycleLen, setCycleLen] = useState(String(cycleSettings.avgCycleLength));
  const [periodLen, setPeriodLen] = useState(String(cycleSettings.avgPeriodLength));
  const [lastPeriod, setLastPeriod] = useState(cycleSettings.lastPeriodStartDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  function handleToggleLanguage() {
    const next: SupportedLanguage = language === 'en' ? 'vi' : 'en';
    setLanguage(next);
  }

  async function handleSaveCycle() {
    const cl = parseInt(cycleLen, 10);
    const pl = parseInt(periodLen, 10);
    if (isNaN(cl) || isNaN(pl) || cl < 21 || cl > 45 || pl < 2 || pl > 10) {
      Alert.alert(t('invalidValues'), t('invalidValuesMsg'));
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const parsedDate = new Date(lastPeriod);
    if (!dateRegex.test(lastPeriod) || isNaN(parsedDate.getTime())) {
      Alert.alert(t('invalidDate'), t('invalidDateMsg'));
      return;
    }
    try {
      await updateCycleSettings({
        avgCycleLength: cl,
        avgPeriodLength: pl,
        lastPeriodStartDate: lastPeriod,
      });
      Alert.alert(tCommon('saved'), t('cycleSettingsSaved'));
    } catch {
      Alert.alert(tCommon('error'), t('saveError'));
    }
  }

  async function handleSaveName() {
    const trimmed = displayNameInput.trim();
    if (!trimmed) return;
    setIsSavingName(true);
    try {
      await updateDisplayName(trimmed);
    } catch {
      Alert.alert(tCommon('error'), t('nameError'));
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleHealthSync() {
    setIsSyncingHealth(true);
    try {
      await syncHealth();
      Alert.alert(t('synced'), t('healthSynced'));
    } catch {
      Alert.alert(tCommon('error'), t('healthSyncError'));
    } finally {
      setIsSyncingHealth(false);
    }
  }

  function handleSignOut() {
    Alert.alert(tCommon('signOut'), tCommon('signOutConfirm'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: tCommon('signOut'),
        style: 'destructive',
        onPress: () => {
          signOut()
            .then(() => router.replace('/auth'))
            .catch(() => Alert.alert(tCommon('error'), tCommon('signOutFailed')));
        },
      },
    ]);
  }

  const partnerPhaseInfo = (() => {
    if (!partnerCycleSettings) return null;
    const dayInCycle = getCurrentDayInCycle(
      partnerCycleSettings.lastPeriodStartDate,
      partnerCycleSettings.avgCycleLength,
    );
    const phase = getCurrentPhase(
      dayInCycle,
      partnerCycleSettings.avgCycleLength,
      partnerCycleSettings.avgPeriodLength,
    );
    const daysUntilPeriod = getDaysUntilNextPeriod(dayInCycle, partnerCycleSettings.avgCycleLength);
    return { dayInCycle, phase, daysUntilPeriod };
  })();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('title')}</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('account')}</Text>
          <View style={styles.card}>
            <AvatarPicker url={avatarUrl} onPress={upload} loading={isUploading} />
            <Divider />
            <Row label={t('email')} value={email || '—'} />
            <Divider />
            <View style={rowStyles.row}>
              <Text style={rowStyles.label}>{t('displayName')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, maxWidth: 200 }}>
                <TextInput
                  style={[settingStyles.input, { flex: 1, padding: 6, textAlign: 'right' }]}
                  value={displayNameInput}
                  onChangeText={setDisplayNameInput}
                  onSubmitEditing={handleSaveName}
                  returnKeyType="done"
                  placeholderTextColor={Colors.textHint}
                  placeholder={t('yourName')}
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
            {/* Language */}
            <TouchableOpacity
              style={rowStyles.row}
              onPress={handleToggleLanguage}
              activeOpacity={0.7}
            >
              <Text style={rowStyles.label}>{t('language')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <View style={{
                  backgroundColor: language === 'vi' ? '#DA251D18' : '#00247D18',
                  borderRadius: Radii.sm,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: language === 'vi' ? '#DA251D' : '#00247D' }}>
                    {language === 'vi' ? 'VI' : 'EN'}
                  </Text>
                </View>
                <Text style={rowStyles.value}>
                  {language === 'vi' ? t('vietnamese') : t('english')}
                </Text>
                <Feather name="chevron-right" size={16} color={Colors.textHint} />
              </View>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={rowStyles.row}
              onPress={() => {
                Alert.alert(
                  t('changeRole'),
                  t('changeRoleConfirm'),
                  [
                    { text: tCommon('cancel'), style: 'cancel' },
                    {
                      text: tCommon('change'),
                      style: 'destructive',
                      onPress: () => router.replace('/onboarding'),
                    },
                  ],
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={rowStyles.label}>{t('role')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Text style={rowStyles.value}>
                  {role === 'moon' ? tCommon('moon') : role === 'sun' ? tCommon('sun') : '—'}
                </Text>
                <Feather name="chevron-right" size={16} color={Colors.textHint} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Partner — Sun only */}
        {role === 'sun' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('partner')}</Text>
            <View style={styles.card}>
              {!isPartnerLinked ? (
                <>
                  <Text style={styles.cardBody}>
                    {t('connectWithMoon')}
                  </Text>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => router.replace('/(tabs)')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.generateButtonText}>{tCommon('connectNow')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.linkedBadge}>
                    <Feather name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.linkedBadgeText}>{t('moonConnected')}</Text>
                  </View>
                  <Divider />
                  <View style={rowStyles.row}>
                    <Text style={rowStyles.label}>{t('phase')}</Text>
                    {partnerPhaseInfo ? (
                      <Text style={[rowStyles.value, { color: Colors.menstrual }]}>
                        {tPhases(`${partnerPhaseInfo.phase}_name`)} · Day {partnerPhaseInfo.dayInCycle}
                      </Text>
                    ) : (
                      <Text style={rowStyles.value}>—</Text>
                    )}
                  </View>
                  <Divider />
                  <View style={rowStyles.row}>
                    <Text style={rowStyles.label}>{t('nextPeriod')}</Text>
                    {partnerPhaseInfo ? (
                      <Text style={rowStyles.value}>
                        {tCommon('in_days', { count: partnerPhaseInfo.daysUntilPeriod })}
                      </Text>
                    ) : (
                      <Text style={rowStyles.value}>—</Text>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Partner Linking */}
        {role === 'moon' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('partnerLink')}</Text>
            <View style={styles.card}>
              {isPartnerLinked ? (
                <View style={styles.linkedBadge}>
                  <Feather name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.linkedBadgeText}>{t('sunConnected')}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.cardBody}>
                    {t('shareCodeWith')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.generateButton, isGeneratingCode && { opacity: 0.6 }]}
                    onPress={async () => {
                      setIsGeneratingCode(true);
                      try { await generateLinkCode(); } catch { /* already linked guard handled in DB */ } finally { setIsGeneratingCode(false); }
                    }}
                    activeOpacity={0.85}
                    disabled={isGeneratingCode}
                  >
                    {isGeneratingCode ? (
                      <ActivityIndicator color={Colors.menstrual} />
                    ) : (
                      <Text style={styles.generateButtonText}>
                        {linkCode ? t('regenerateCode') : t('generateLinkCode')}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {linkCode && (
                    <View style={styles.codeDisplay}>
                      <Text style={styles.codeText}>{linkCode}</Text>
                      <Text style={styles.codeHint}>{t('codeHint')}</Text>
                      <TouchableOpacity
                        style={styles.shareCodeButton}
                        onPress={() =>
                          Share.share({
                            message: t('shareCodeMessage', { code: linkCode }),
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Feather name="share-2" size={14} color={Colors.menstrual} />
                        <Text style={styles.shareCodeText}>{tCommon('shareCode')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Health Sync — Moon only */}
        {role === 'moon' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('healthData')}</Text>
            <View style={styles.card}>
              {healthAvailable ? (
                <>
                  <Text style={styles.cardBody}>
                    {t('healthSyncDescription')}
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
                      <Text style={styles.generateButtonText}>{t('syncHealthData')}</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.cardBody}>
                    {t('healthUnavailable')}
                  </Text>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => router.push('/health-sync')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.generateButtonText}>{t('manualEntry')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* Cycle settings — Moon only */}
        {role === 'moon' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('cycleSettings')}</Text>
            <View style={styles.card}>
              <SettingInput
                label={t('avgCycleLength')}
                value={cycleLen}
                onChangeText={setCycleLen}
                keyboardType="number-pad"
              />
              <Divider />
              <SettingInput
                label={t('avgPeriodLength')}
                value={periodLen}
                onChangeText={setPeriodLen}
                keyboardType="number-pad"
              />
              <Divider />
              <View style={settingStyles.row}>
                <Text style={settingStyles.label}>{t('lastPeriodStart')}</Text>
                <TouchableOpacity
                  style={settingStyles.input}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ ...Typography.body, color: Colors.textPrimary }}>
                    {lastPeriod
                      ? new Date(lastPeriod + 'T12:00:00').toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : tCommon('selectDate')}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={lastPeriod ? new Date(lastPeriod + 'T12:00:00') : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (event.type === 'set' && selectedDate) {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        setLastPeriod(`${yyyy}-${mm}-${dd}`);
                      }
                    }}
                  />
                )}
                {showDatePicker && Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.saveButton, { marginTop: Spacing.xs }]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.saveButtonText}>{tCommon('done')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCycle}>
                <Text style={styles.saveButtonText}>{t('saveCycleSettings')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notifications — Moon only */}
        {role === 'moon' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('notifications')}</Text>
            <View style={styles.card}>
              <ToggleRow label={t('periodApproaching')} value={notificationPrefs.periodApproaching} onToggle={v => updateNotificationPrefs({ periodApproaching: v })} />
              <Divider />
              <ToggleRow label={t('periodStarted')} value={notificationPrefs.periodStarted} onToggle={v => updateNotificationPrefs({ periodStarted: v })} />
              <Divider />
              <ToggleRow label={t('periodEnded')} value={notificationPrefs.periodEnded} onToggle={v => updateNotificationPrefs({ periodEnded: v })} />
              <Divider />
              <ToggleRow label={t('smartTiming')} value={notificationPrefs.useAiTiming} onToggle={v => updateNotificationPrefs({ useAiTiming: v })} />
              {!notificationPrefs.useAiTiming && (
                <>
                  <Divider />
                  <View style={rowStyles.row}>
                    <Text style={rowStyles.label}>{t('daysBeforePeriod')}</Text>
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
          <Text style={styles.signOutText}>{tCommon('signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function AvatarPicker({ url, onPress, loading }: { url: string | null; onPress: () => void; loading: boolean }) {
  const { t } = useTranslation('common');
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
        {loading ? t('uploading') : t('tapToChangePhoto')}
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
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  codeText: { fontSize: 32, fontWeight: '800', letterSpacing: 8, color: Colors.textPrimary },
  codeHint: { ...Typography.caption, color: Colors.textHint, textAlign: 'center' },
  shareCodeButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.menstrual + '40',
    marginTop: 2,
  },
  shareCodeText: { ...Typography.caption, fontWeight: '700', color: Colors.menstrual },
  linkedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  linkedBadgeText: { ...Typography.bodyBold, color: '#4CAF50' },
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
