import { MD3DarkTheme, MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import type { TextStyle } from 'react-native';

export type AppColorScheme = 'dark' | 'light';

export type AppColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentPressed: string;
  onAccent: string;
  danger: string;
  success: string;
  warning: string;
  inputBackground: string;
  inputBorder: string;
  inputFocusBorder: string;
  overlay: string;
  overlayStrong: string;
  accentMuted: string;
  dangerMuted: string;
  successMuted: string;
  imageOverlay: string;
  onImage: string;
  shadowSoft: string;
  shadowStrong: string;
  focusRing: string;
  glassBackground: string;
  glassBorder: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
} as const;

export const brandFonts = {
  heading: 'PlayfairDisplay-SemiBold',
  body: 'Manrope-Regular',
  bodyEmphasis: 'Manrope-SemiBold',
} as const;

export const typography = {
  title: { fontFamily: brandFonts.heading, fontSize: 36, lineHeight: 44 } satisfies TextStyle,
  heading: { fontFamily: brandFonts.heading, fontSize: 24, lineHeight: 31 } satisfies TextStyle,
  body: { fontFamily: brandFonts.body, fontSize: 15, lineHeight: 22 } satisfies TextStyle,
  caption: { fontFamily: brandFonts.body, fontSize: 12, lineHeight: 17 } satisfies TextStyle,
  button: { fontFamily: brandFonts.bodyEmphasis, fontSize: 14, lineHeight: 20 } satisfies TextStyle,
} as const;

const darkColors: AppColors = {
  background: '#0B0B0D',
  surface: '#14161B',
  surfaceElevated: '#1C1F25',
  surfaceMuted: '#23262D',
  textPrimary: '#F7F2E8',
  textSecondary: '#E2D8C7',
  textMuted: '#9297A1',
  border: '#2F323A',
  borderStrong: '#4A4D55',
  accent: '#F2A018',
  accentHover: '#FFB632',
  accentPressed: '#C37A10',
  onAccent: '#0B0B0D',
  danger: '#FF5664',
  success: '#69E345',
  warning: '#F2A018',
  inputBackground: '#202329',
  inputBorder: '#4A4D55',
  inputFocusBorder: '#F2A018',
  overlay: 'rgba(0, 0, 0, 0.52)',
  overlayStrong: 'rgba(0, 0, 0, 0.76)',
  accentMuted: 'rgba(242, 160, 24, 0.14)',
  dangerMuted: 'rgba(255, 86, 100, 0.14)',
  successMuted: 'rgba(105, 227, 69, 0.12)',
  imageOverlay: 'rgba(7, 8, 10, 0.82)',
  onImage: '#F7F2E8',
  shadowSoft: '0 10px 26px rgba(0, 0, 0, 0.24)',
  shadowStrong: '0 24px 64px rgba(0, 0, 0, 0.42)',
  focusRing: '0 0 0 3px rgba(242, 160, 24, 0.24)',
  glassBackground: 'rgba(20, 22, 27, 0.82)',
  glassBorder: 'rgba(247, 242, 232, 0.16)',
  tabBarBackground: 'rgba(18, 20, 24, 0.9)',
  tabBarActive: '#F2A018',
  tabBarInactive: '#9297A1',
};

const lightColors: AppColors = {
  background: '#F5EFE5',
  surface: '#FFFDF9',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EEE4D6',
  textPrimary: '#1A1512',
  textSecondary: '#4A3F36',
  textMuted: '#74695F',
  border: '#D8CBB9',
  borderStrong: '#B9A791',
  accent: '#D98509',
  accentHover: '#F2A018',
  accentPressed: '#B16C08',
  onAccent: '#16100A',
  danger: '#C92F3E',
  success: '#338B26',
  warning: '#B96D00',
  inputBackground: '#FFFFFF',
  inputBorder: '#B9A791',
  inputFocusBorder: '#D98509',
  overlay: 'rgba(26, 21, 18, 0.28)',
  overlayStrong: 'rgba(26, 21, 18, 0.52)',
  accentMuted: 'rgba(217, 133, 9, 0.12)',
  dangerMuted: 'rgba(201, 47, 62, 0.1)',
  successMuted: 'rgba(51, 139, 38, 0.1)',
  imageOverlay: 'rgba(26, 21, 18, 0.7)',
  onImage: '#FFFFFF',
  shadowSoft: '0 10px 26px rgba(67, 43, 20, 0.12)',
  shadowStrong: '0 24px 64px rgba(67, 43, 20, 0.2)',
  focusRing: '0 0 0 3px rgba(217, 133, 9, 0.22)',
  glassBackground: 'rgba(255, 253, 249, 0.86)',
  glassBorder: 'rgba(74, 63, 54, 0.18)',
  tabBarBackground: 'rgba(255, 253, 249, 0.92)',
  tabBarActive: '#D98509',
  tabBarInactive: '#74695F',
};

const fontConfig = { fontFamily: brandFonts.body };
const baseLight = { ...MD3LightTheme, fonts: configureFonts({ config: fontConfig }) } as MD3Theme;
const baseDark = { ...MD3DarkTheme, fonts: configureFonts({ config: fontConfig }) } as MD3Theme;

function createPaperTheme(scheme: AppColorScheme, colors: AppColors): MD3Theme {
  const base = scheme === 'dark' ? baseDark : baseLight;
  return {
    ...base,
    dark: scheme === 'dark',
    roundness: radius.md,
    colors: {
      ...base.colors,
      primary: colors.accent,
      onPrimary: colors.onAccent,
      secondary: colors.warning,
      onSecondary: colors.onAccent,
      background: colors.background,
      onBackground: colors.textPrimary,
      surface: colors.surface,
      onSurface: colors.textPrimary,
      surfaceVariant: colors.surfaceMuted,
      onSurfaceVariant: colors.textSecondary,
      outline: colors.borderStrong,
      outlineVariant: colors.border,
      error: colors.danger,
      onError: colors.surfaceElevated,
      elevation: {
        ...base.colors.elevation,
        level0: colors.background,
        level1: colors.surface,
        level2: colors.surfaceElevated,
        level3: colors.surfaceElevated,
        level4: colors.surfaceElevated,
        level5: colors.surfaceElevated,
      },
    },
  };
}

export const appThemes = {
  dark: { colors: darkColors, paper: createPaperTheme('dark', darkColors) },
  light: { colors: lightColors, paper: createPaperTheme('light', lightColors) },
} as const;

export type AppTheme = (typeof appThemes)[AppColorScheme] & {
  radius: typeof radius;
  spacing: typeof spacing;
  typography: typeof typography;
};

export function getAppTheme(scheme: AppColorScheme): AppTheme {
  return { ...appThemes[scheme], radius, spacing, typography };
}

export const darkTheme = appThemes.dark.paper;
export const lightTheme = appThemes.light.paper;
