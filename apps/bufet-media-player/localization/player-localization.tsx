import { createContext, use, useCallback, useMemo, type ReactNode } from 'react';
import { useLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import {
  translations,
  type PlayerLanguage,
  type TranslationKey,
} from '@/localization/translations';

export type TranslationOptions = Record<string, string | number>;

type PlayerLocalizationValue = {
  language: PlayerLanguage;
  t: (key: TranslationKey, options?: TranslationOptions) => string;
};

const PlayerLocalizationContext = createContext<PlayerLocalizationValue | null>(null);

function resolveLanguage(languageCodes: Array<string | null>): PlayerLanguage {
  return languageCodes.find((code): code is PlayerLanguage => code === 'ru' || code === 'en') ?? 'en';
}

export function PlayerLocalizationProvider({ children }: { children: ReactNode }) {
  const locales = useLocales();
  const language = resolveLanguage(locales.map((locale) => locale.languageCode));
  const i18n = useMemo(
    () => new I18n(translations, {
      defaultLocale: 'en',
      enableFallback: true,
      locale: language,
      missingBehavior: 'error',
    }),
    [language],
  );
  const t = useCallback(
    (key: TranslationKey, options?: TranslationOptions) => i18n.t(key, options),
    [i18n],
  );
  const value = useMemo(() => ({ language, t }), [language, t]);

  return (
    <PlayerLocalizationContext value={value}>
      {children}
    </PlayerLocalizationContext>
  );
}

export function usePlayerLocalization(): PlayerLocalizationValue {
  const value = use(PlayerLocalizationContext);
  if (!value) {
    throw new Error('usePlayerLocalization must be used inside PlayerLocalizationProvider');
  }
  return value;
}
