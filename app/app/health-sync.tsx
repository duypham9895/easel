import { View } from 'react-native';
import { router } from 'expo-router';
import { useHealthSyncOnboarding } from '@/hooks/useHealthSyncOnboarding';
import { HealthSyncEducation } from '@/components/moon/HealthSyncEducation';
import { HealthSyncLoading } from '@/components/moon/HealthSyncLoading';
import { HealthImportSummary } from '@/components/moon/HealthImportSummary';
import { PeriodHistoryInput } from '@/components/moon/PeriodHistoryInput';
import { CycleDataReview } from '@/components/moon/CycleDataReview';
import { PermissionDeniedScreen } from '@/components/moon/PermissionDeniedScreen';
import { HealthEmptyState } from '@/components/moon/HealthEmptyState';

export default function HealthSyncScreen() {
  const {
    step,
    syncResult,
    isSyncing,
    isHealthKitAvailable,
    predictedDate,
    handleSyncHealthKit,
    handlePermissionDenied,
    handleMultiPeriodSubmit,
    handleImportContinue,
    handleImportReject,
    handleEditFromReview,
    handleConfirm,
    handleSkipToManual,
  } = useHealthSyncOnboarding();

  async function handleFinalConfirm() {
    await handleConfirm();
    router.replace('/(tabs)');
  }

  switch (step) {
    case 'education':
      return (
        <HealthSyncEducation
          onContinueWithHealth={handleSyncHealthKit}
          onEnterManually={handleSkipToManual}
          isHealthKitAvailable={isHealthKitAvailable}
          isSyncing={isSyncing}
        />
      );

    case 'syncing':
      return <HealthSyncLoading />;

    case 'import-summary':
      return syncResult ? (
        <HealthImportSummary
          syncResult={syncResult}
          onContinue={handleImportContinue}
          onReject={handleImportReject}
        />
      ) : (
        <HealthSyncLoading />
      );

    case 'empty-state':
      return (
        <HealthEmptyState onEnterManually={handleSkipToManual} />
      );

    case 'manual-input':
      return (
        <PeriodHistoryInput
          onSubmit={handleMultiPeriodSubmit}
        />
      );

    case 'review':
      return syncResult && predictedDate ? (
        <CycleDataReview
          syncResult={syncResult}
          predictedDate={predictedDate}
          onEdit={handleEditFromReview}
          onConfirm={handleFinalConfirm}
        />
      ) : (
        <HealthSyncLoading />
      );

    case 'permission-denied':
      return (
        <PermissionDeniedScreen
          onEnterManually={handlePermissionDenied}
        />
      );

    default:
      return <View style={{ flex: 1 }} />;
  }
}
