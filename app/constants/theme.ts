export const Colors = {
  // Background
  background: '#FBFBFD',
  card: '#FFFFFF',
  inputBg: '#F2F2F7',

  // Typography
  textPrimary: '#1D1D1F',
  textSecondary: '#4B4B4B',
  textHint: '#8E8E93',

  // Phase colors — warm, feminine palette
  menstrual: '#FF5F7E',    // Deep Rose
  follicular: '#70D6FF',   // Clear Sky
  ovulatory: '#FFB347',    // Golden Hour
  luteal: '#4AD66D',       // Zen Green

  // UI accents
  accent: '#FF5F7E',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.35)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radii = {
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  full: 9999,
} as const;

export const Typography = {
  displayBold: { fontSize: 32, fontWeight: '700' as const },
  titleBold: { fontSize: 24, fontWeight: '700' as const },
  headlineBold: { fontSize: 19, fontWeight: '700' as const },
  bodyBold: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const },
} as const;

export const MoonColors = {
  background: '#0D1B2A', surface: '#1A2B3C',
  accentPrimary: '#B39DDB', accentSecondary: '#E0E0F0',
  textPrimary: '#F0F0FF', textSecondary: '#A8BAC8',
  textHint: '#6B7A8C', card: '#162233', inputBg: '#1E3045',
  border: '#2D4A6B', overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF', black: '#000000',
} as const;

export const SunColors = {
  background: '#FFF8F0', surface: '#FFFFFF',
  accentPrimary: '#F59E0B', accentSecondary: '#FF7043',
  textPrimary: '#1A1008', textSecondary: '#6B5B45',
  textHint: '#9C8B7A', card: '#FFFFFF', inputBg: '#FFF3E0',
  border: '#FFE0B2', overlay: 'rgba(0,0,0,0.35)',
  white: '#FFFFFF', black: '#000000',
} as const;

export const SharedColors = {
  error: '#EF5350',
  success: '#4CAF50',
  warning: '#FFB347',
  info: '#42A5F5',
} as const;

/** Design tokens for calendar marker visual distinction (logged vs predicted). */
export const CalendarTokens = {
  /** Opacity for markers based on actual logged period data. */
  loggedPeriodOpacity: 1.0,
  /** Opacity for markers based on predicted/projected cycle data. */
  predictedPeriodOpacity: 0.35,
  /** Border style for predicted period markers (for custom calendar implementations). */
  predictedBorderStyle: 'dashed' as const,
  /** Background tint for the deviation notification card on Sun's dashboard. */
  deviationCardBackground: '#FFF3E0',
  /** Text color for the deviation notification card. */
  deviationCardText: '#6B5B45',
} as const;

export function getTheme(role: 'moon' | 'sun' | null) {
  if (role === 'moon') return MoonColors;
  if (role === 'sun') return SunColors;
  return Colors;
}
