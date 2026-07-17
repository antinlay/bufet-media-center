import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import { en } from '@/locales/en';
import { ru, type TranslationKey } from '@/locales/ru';
import { loadPreference, savePreference } from '@/lib/storage';

const LANGUAGE_KEY = 'bufet_dash_language';

export type AppLanguage = 'ru' | 'en';
type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('ru');

  useEffect(() => {
    void loadPreference(LANGUAGE_KEY).then((stored) => {
      if (stored === 'ru' || stored === 'en') setLanguageState(stored);
    });
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    void savePreference(LANGUAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback((key: TranslationKey, params?: TranslationParams) => {
    const template = (language === 'en' ? en[key] : ru[key]) ?? ru[key] ?? key;
    if (!params) return template;
    return Object.entries(params).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = use(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
