import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// EN namespaces
import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enOnboarding from './en/onboarding.json';
import enDashboard from './en/dashboard.json';
import enSettings from './en/settings.json';
import enCalendar from './en/calendar.json';
import enCheckin from './en/checkin.json';
import enSignals from './en/signals.json';
import enPhases from './en/phases.json';
import enPartner from './en/partner.json';
import enHealth from './en/health.json';

// VI namespaces
import viCommon from './vi/common.json';
import viAuth from './vi/auth.json';
import viOnboarding from './vi/onboarding.json';
import viDashboard from './vi/dashboard.json';
import viSettings from './vi/settings.json';
import viCalendar from './vi/calendar.json';
import viCheckin from './vi/checkin.json';
import viSignals from './vi/signals.json';
import viPhases from './vi/phases.json';
import viPartner from './vi/partner.json';
import viHealth from './vi/health.json';

export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function getDeviceLanguage(): SupportedLanguage {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode ?? 'en';
  return deviceLang === 'vi' ? 'vi' : 'en';
}

i18n.use(initReactI18next).init({
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      onboarding: enOnboarding,
      dashboard: enDashboard,
      settings: enSettings,
      calendar: enCalendar,
      checkin: enCheckin,
      signals: enSignals,
      phases: enPhases,
      partner: enPartner,
      health: enHealth,
    },
    vi: {
      common: viCommon,
      auth: viAuth,
      onboarding: viOnboarding,
      dashboard: viDashboard,
      settings: viSettings,
      calendar: viCalendar,
      checkin: viCheckin,
      signals: viSignals,
      phases: viPhases,
      partner: viPartner,
      health: viHealth,
    },
  },
});

export default i18n;
