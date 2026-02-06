import { MD3DarkTheme, MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';

export const palette = {
  ink: '#0B0B0D',
  charcoal: '#1A1512',
  gold: '#F2A018',
  goldDeep: '#C37A10',
  cream: '#F7F2E8',
  fog: '#E2D8C7',
  slate: '#4A3F36',
  ember: '#B44A12',
};

const fontConfig = {
  default: {
    regular: {
      fontFamily: 'Manrope-Regular',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'Manrope-SemiBold',
      fontWeight: '600',
    },
    light: {
      fontFamily: 'Manrope-Regular',
      fontWeight: '400',
    },
    thin: {
      fontFamily: 'Manrope-Regular',
      fontWeight: '400',
    },
  },
  customVariant: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
};

const baseLight = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
} as MD3Theme;

const baseDark = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
} as MD3Theme;

export const lightTheme: MD3Theme = {
  ...baseLight,
  colors: {
    ...baseLight.colors,
    primary: palette.gold,
    onPrimary: palette.ink,
    secondary: palette.ember,
    onSecondary: palette.cream,
    background: palette.cream,
    onBackground: palette.charcoal,
    surface: '#FCFAF7',
    onSurface: palette.charcoal,
    surfaceVariant: palette.fog,
    onSurfaceVariant: palette.slate,
    outline: '#D0C2AE',
    elevation: {
      ...baseLight.colors.elevation,
      level1: '#FFF7EA',
      level2: '#FBECD6',
      level3: '#F5DEC0',
    },
  },
};

export const darkTheme: MD3Theme = {
  ...baseDark,
  colors: {
    ...baseDark.colors,
    primary: palette.gold,
    onPrimary: palette.ink,
    secondary: '#E79B2E',
    onSecondary: palette.ink,
    background: palette.ink,
    onBackground: palette.cream,
    surface: '#14110F',
    onSurface: palette.cream,
    surfaceVariant: '#2B231E',
    onSurfaceVariant: palette.fog,
    outline: '#53463C',
    elevation: {
      ...baseDark.colors.elevation,
      level1: '#1B1714',
      level2: '#231D19',
      level3: '#2C231E',
    },
  },
};

export const brandFonts = {
  heading: 'PlayfairDisplay-SemiBold',
  body: 'Manrope-Regular',
  bodyEmphasis: 'Manrope-SemiBold',
};
