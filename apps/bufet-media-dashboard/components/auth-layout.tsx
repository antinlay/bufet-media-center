import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useI18n } from '@/providers/I18nProvider';
import type { AppColors } from '@/theme';

const featureIcons = ['monitor-dashboard', 'folder-play-outline', 'chart-box-outline', 'shield-check-outline'] as const;
const featureKeys = [
  ['auth.features.screens.title', 'auth.features.screens.subtitle'],
  ['auth.features.content.title', 'auth.features.content.subtitle'],
  ['auth.features.analytics.title', 'auth.features.analytics.subtitle'],
  ['auth.features.security.title', 'auth.features.security.subtitle'],
] as const;

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const { t } = useI18n();
  const isDesktop = width >= 900;
  const styles = createStyles(theme.colors, theme.radius.xl);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
        contentContainerStyle={styles.page}
      >
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons name="monitor-dashboard" color={theme.colors.accent} size={24} />
            </View>
            {width >= 520 ? (
              <View>
                <Text style={styles.headerBrandName}>{t('brand.name')}</Text>
                <Text style={styles.headerTagline}>{t('brand.tagline')}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.main, !isDesktop && styles.mainMobile]}>
          <View style={[styles.hero, !isDesktop && styles.heroMobile]}>
            <Text style={styles.heroName}>{t('brand.name')}</Text>
            <Text style={styles.heroTagline}>{t('brand.tagline')}</Text>
            <Text style={styles.heroDescription}>{t('brand.description')}</Text>
            {isDesktop ? (
              <View style={styles.featureList}>
                {featureKeys.map(([titleKey, subtitleKey], index) => (
                  <View key={titleKey} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <MaterialCommunityIcons name={featureIcons[index]} color={theme.colors.accent} size={23} />
                    </View>
                    <View style={styles.featureCopy}>
                      <Text style={styles.featureTitle}>{t(titleKey)}</Text>
                      <Text style={styles.featureSubtitle}>{t(subtitleKey)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={[styles.card, !isDesktop && styles.cardMobile]}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.form}>{children}</View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.footer.copyright', { year: new Date().getFullYear() })}</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>{t('auth.footer.privacy')}</Text>
            <Text style={styles.footerLink}>{t('auth.footer.terms')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors, cardRadius: number) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  page: { minHeight: '100%', width: '100%', maxWidth: 1440, alignSelf: 'center', padding: 28, gap: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerBrandName: { color: colors.textPrimary, fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 25 },
  headerTagline: { color: colors.accent, fontFamily: 'Manrope-SemiBold', fontSize: 8, letterSpacing: 2.1 },
  main: { flex: 1, minHeight: 660, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 72 },
  mainMobile: { minHeight: 0, flexDirection: 'column', gap: 28 },
  hero: { flex: 1, maxWidth: 470, gap: 14 },
  heroMobile: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  heroName: { color: colors.textPrimary, fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 56, lineHeight: 66 },
  heroTagline: { color: colors.accent, fontFamily: 'Manrope-SemiBold', fontSize: 14, letterSpacing: 4 },
  heroDescription: { maxWidth: 410, color: colors.textSecondary, fontFamily: 'Manrope-Regular', fontSize: 18, lineHeight: 28 },
  featureList: { paddingTop: 26, gap: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureCopy: { flex: 1, gap: 3 },
  featureTitle: { color: colors.textPrimary, fontFamily: 'Manrope-SemiBold', fontSize: 15 },
  featureSubtitle: { color: colors.textMuted, fontFamily: 'Manrope-Regular', fontSize: 12 },
  card: {
    width: '48%',
    maxWidth: 650,
    minWidth: 460,
    padding: 40,
    gap: 10,
    borderRadius: cardRadius,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    boxShadow: colors.shadowStrong,
  },
  cardMobile: { width: '100%', minWidth: 0, maxWidth: 680, padding: 24 },
  title: { color: colors.textPrimary, fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 34, lineHeight: 42 },
  subtitle: { color: colors.textSecondary, fontFamily: 'Manrope-Regular', fontSize: 14, lineHeight: 22 },
  form: { paddingTop: 18, gap: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  footerText: { color: colors.textMuted, fontFamily: 'Manrope-Regular', fontSize: 11 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  footerLink: { color: colors.textSecondary, fontFamily: 'Manrope-Regular', fontSize: 11 },
});
