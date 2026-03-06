import { Platform } from 'react-native';
import { useAppStore } from '@/store/appStore';

export interface PeriodRecord {
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
}

interface UseHealthSyncResult {
  isAvailable: boolean;
  sync: () => Promise<PeriodRecord[]>;
}

async function callPredictCycle(
  records: PeriodRecord[],
  updateNotificationPrefs: (prefs: { manualDaysBefore: number }) => void,
): Promise<void> {
  if (records.length < 2) return;
  const proxyUrl = process.env.EXPO_PUBLIC_PROXY_URL;
  const clientToken = process.env.EXPO_PUBLIC_CLIENT_TOKEN;
  if (!proxyUrl || !clientToken) return;

  try {
    const res = await fetch(`${proxyUrl}/api/predict-cycle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Token': clientToken,
      },
      body: JSON.stringify({
        cycleHistory: records.map((r) => ({ startDate: r.startDate, endDate: r.endDate })),
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { notifyDaysBefore?: number };
    if (typeof data.notifyDaysBefore === 'number') {
      updateNotificationPrefs({ manualDaysBefore: data.notifyDaysBefore });
    }
  } catch (err) {
    console.warn('[useHealthSync] predict-cycle failed (non-blocking):', err);
  }
}

export function useHealthSync(): UseHealthSyncResult {
  const updateCycleSettings = useAppStore((s) => s.updateCycleSettings);
  const updateNotificationPrefs = useAppStore((s) => s.updateNotificationPrefs);

  if (Platform.OS === 'ios') {
    return buildHealthKitSync(updateCycleSettings, updateNotificationPrefs);
  }
  if (Platform.OS === 'android') {
    return buildHealthConnectSync(updateCycleSettings, updateNotificationPrefs);
  }
  return { isAvailable: false, sync: async () => [] };
}

function buildHealthKitSync(
  updateCycleSettings: (s: { lastPeriodStartDate: string }) => Promise<void>,
  updateNotificationPrefs: (prefs: { manualDaysBefore: number }) => void,
): UseHealthSyncResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let AppleHealthKit: any = null;
  try {
    const mod = require('react-native-health');
    AppleHealthKit = mod.default ?? mod;
  } catch {
    return { isAvailable: false, sync: async () => [] };
  }

  if (!AppleHealthKit?.Constants?.Permissions) {
    return { isAvailable: false, sync: async () => [] };
  }

  const permissions = {
    permissions: {
      read: [AppleHealthKit.Constants.Permissions.MenstrualFlow],
      write: [],
    },
  };

  async function sync(): Promise<PeriodRecord[]> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AppleHealthKit.initHealthKit(permissions, (initErr: any) => {
        if (initErr) {
          console.warn('[useHealthSync] HealthKit init error:', initErr);
          resolve([]);
          return;
        }
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const options = {
          startDate: twoYearsAgo.toISOString(),
          endDate: new Date().toISOString(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        AppleHealthKit.getMenstrualFlowSamples(options, async (err: any, results: any[]) => {
          if (err || !results?.length) {
            resolve([]);
            return;
          }
          const records = buildPeriodRecords(results);
          if (records.length > 0) {
            await updateCycleSettings({ lastPeriodStartDate: records[0].startDate });
            await callPredictCycle(records, updateNotificationPrefs);
          }
          resolve(records);
        });
      });
    });
  }

  return { isAvailable: true, sync };
}

function buildHealthConnectSync(
  updateCycleSettings: (s: { lastPeriodStartDate: string }) => Promise<void>,
  updateNotificationPrefs: (prefs: { manualDaysBefore: number }) => void,
): UseHealthSyncResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let HealthConnect: any = null;
  try {
    HealthConnect = require('react-native-health-connect');
  } catch {
    return { isAvailable: false, sync: async () => [] };
  }

  async function sync(): Promise<PeriodRecord[]> {
    try {
      const granted = await HealthConnect.requestPermission([
        { accessType: 'read', recordType: 'MenstruationFlow' },
      ]);
      if (!granted || granted.length === 0) return [];

      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const { records } = await HealthConnect.readRecords('MenstruationFlow', {
        timeRangeFilter: {
          operator: 'between',
          startTime: twoYearsAgo.toISOString(),
          endTime: new Date().toISOString(),
        },
      });

      const periodRecords = buildPeriodRecords(records ?? []);
      if (periodRecords.length > 0) {
        await updateCycleSettings({ lastPeriodStartDate: periodRecords[0].startDate });
        await callPredictCycle(periodRecords, updateNotificationPrefs);
      }
      return periodRecords;
    } catch (err) {
      console.warn('[useHealthSync] Health Connect error:', err);
      return [];
    }
  }

  return { isAvailable: true, sync };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPeriodRecords(samples: any[]): PeriodRecord[] {
  if (!samples.length) return [];

  const sorted = [...samples].sort((a, b) => {
    const aTime = new Date(a.startDate ?? a.time ?? 0).getTime();
    const bTime = new Date(b.startDate ?? b.time ?? 0).getTime();
    return bTime - aTime;
  });

  const records: PeriodRecord[] = [];
  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  for (const sample of sorted) {
    const dateStr = (sample.startDate ?? sample.time ?? '').split('T')[0];
    if (!dateStr) continue;

    if (!periodStart) {
      periodStart = dateStr;
      periodEnd = dateStr;
    } else {
      const diffDays = Math.round(
        (new Date(periodEnd!).getTime() - new Date(dateStr).getTime()) / 86_400_000,
      );
      if (diffDays <= 2) {
        periodEnd = dateStr;
      } else {
        records.push({ startDate: periodEnd!, endDate: periodStart });
        periodStart = dateStr;
        periodEnd = dateStr;
      }
    }
  }

  if (periodStart) {
    records.push({ startDate: periodEnd!, endDate: periodStart });
  }

  // Reverse so records[0] is the most recent period (loop pushed in second-newest-first order)
  return records.reverse();
}
