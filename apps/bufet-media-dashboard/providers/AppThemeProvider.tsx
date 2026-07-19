import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { loadPreference, savePreference } from '@/lib/storage';
import { getAppTheme, type AppColorScheme, type AppTheme } from '@/theme';

const THEME_KEY = 'bufet_dash_theme';

type AppThemeContextValue = AppTheme & {
  scheme: AppColorScheme;
  setScheme: (scheme: AppColorScheme) => void;
  toggleScheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<AppColorScheme>('dark');

  useEffect(() => {
    void loadPreference(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') setSchemeState(stored);
    });
  }, []);

  const setScheme = useCallback((nextScheme: AppColorScheme) => {
    setSchemeState(nextScheme);
    void savePreference(THEME_KEY, nextScheme);
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setScheme]);

  const value = useMemo(
    () => ({ ...getAppTheme(scheme), scheme, setScheme, toggleScheme }),
    [scheme, setScheme, toggleScheme],
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }

    themeMeta.content = value.colors.background;
    document.documentElement.style.backgroundColor = value.colors.background;
    document.documentElement.style.colorScheme = scheme;
    document.body.style.backgroundColor = value.colors.background;
  }, [scheme, value.colors.background]);

  return (
    <AppThemeContext.Provider value={value}>
      <PaperProvider theme={value.paper}>{children}</PaperProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = use(AppThemeContext);
  if (!context) throw new Error('useAppTheme must be used within AppThemeProvider');
  return context;
}
