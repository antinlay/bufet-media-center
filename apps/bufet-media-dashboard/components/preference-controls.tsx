import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useI18n } from '@/providers/I18nProvider';
import type { AppColors } from '@/theme';

export function PreferenceControls({ compact = false, showTheme = true }: { compact?: boolean; showTheme?: boolean }) {
  const { colors, radius, scheme, toggleScheme } = useAppTheme();
  const { language, setLanguage, t } = useI18n();
  const styles = createStyles(colors, radius.pill);
  const themeLabel = t(scheme === 'dark' ? 'theme.light' : 'theme.dark');

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      {showTheme ? (
        <Pressable
          accessibilityLabel={themeLabel}
          accessibilityRole="button"
          onPress={toggleScheme}
          style={({ pressed }) => [styles.themeButton, compact && styles.themeButtonCompact, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            name={scheme === 'dark' ? 'weather-sunny' : 'weather-night'}
            color={colors.textPrimary}
            size={18}
          />
          {compact ? null : <Text style={styles.themeText}>{themeLabel}</Text>}
        </Pressable>
      ) : null}
      <View accessibilityLabel={t('common.language')} style={styles.languageGroup}>
        {(['ru', 'en'] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: language === item }}
            onPress={() => setLanguage(item)}
            style={({ pressed }) => [
              styles.languageButton,
              compact && styles.languageButtonCompact,
              language === item && styles.languageButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.languageText, language === item && styles.languageTextActive]}>
              {t(item === 'ru' ? 'language.ru' : 'language.en')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors, pill: number) => StyleSheet.create({
  row: { maxWidth: '100%', minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  compactRow: { gap: 8 },
  themeButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  themeText: { color: colors.textPrimary, fontFamily: 'Manrope-SemiBold', fontSize: 12 },
  themeButtonCompact: { width: 42, paddingHorizontal: 0, gap: 0 },
  languageGroup: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageButton: { minWidth: 38, paddingHorizontal: 9, paddingVertical: 7, borderRadius: pill },
  languageButtonCompact: { minWidth: 34, paddingHorizontal: 7 },
  languageButtonActive: { backgroundColor: colors.accent },
  languageText: { color: colors.textSecondary, fontFamily: 'Manrope-SemiBold', fontSize: 11 },
  languageTextActive: { color: colors.onAccent },
  pressed: { opacity: 0.72 },
});
