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
