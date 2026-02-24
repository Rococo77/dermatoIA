import { Platform } from 'react-native';

export const colors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',

  accent: '#D97706',

  background: '#FAFAF8',
  surface: '#FFFFFF',

  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    tertiary: '#A8A29E',
    muted: '#D6D3D1',
    inverse: '#FFFFFF',
  },

  border: '#E7E5E4',
  borderLight: '#F5F5F4',

  severity: {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#16A34A',
  },

  severityBg: {
    critical: '#FEF2F2',
    high: '#FFF7ED',
    medium: '#FFFBEB',
    low: '#F0FDF4',
  },

  error: '#DC2626',
  errorBg: '#FEF2F2',
  success: '#16A34A',
  successBg: '#F0FDF4',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: '#1C1917',
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: '#1C1917',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1C1917',
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: '#57534E',
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    color: '#57534E',
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    color: '#A8A29E',
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: '#A8A29E',
  },
};

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: {
      elevation: 1,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
  }),
};

const theme = { colors, spacing, borderRadius, typography, shadows };
export default theme;
