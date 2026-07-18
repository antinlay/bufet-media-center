import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { IconButton, Text, TouchableRipple } from 'react-native-paper';
import { usePathname, useRouter } from 'expo-router';
import { PreferenceControls } from '@/components/preference-controls';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/providers/I18nProvider';
import type { TranslationKey } from '@/locales/ru';
import { brandFonts, type AppColors } from '@/theme';

const navItems: readonly { label: TranslationKey; href: '/' | '/screens' | '/contents' | '/groups' | '/users' | '/pair' }[] = [
  { label: 'nav.overview', href: '/' },
  { label: 'nav.screens', href: '/screens' },
  { label: 'nav.contents', href: '/contents' },
  { label: 'nav.organizations', href: '/groups' },
  { label: 'nav.users', href: '/users' },
  { label: 'nav.pairing', href: '/pair' },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const isMobile = width < 600;
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.md, radius.lg);

  return (
    <View style={styles.container}>
      {isWide ? (
        <View style={styles.sidebar}>
          <View style={styles.sidebarTop}>
            <View style={styles.brand}>
              <Text style={styles.brandTitle}>{t('brand.name')}</Text>
              <Text style={styles.brandSubtitle}>{t('brand.tagline')}</Text>
            </View>
            <View style={styles.navList}>
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <TouchableRipple
                    key={item.href}
                    accessibilityRole="link"
                    onPress={() => router.push(item.href)}
                    style={[styles.navItem, active && styles.navItemActive]}
                  >
                    <Text style={[styles.navText, active && styles.navTextActive]}>{t(item.label)}</Text>
                  </TouchableRipple>
                );
              })}
            </View>
          </View>
          <View style={styles.userCard}>
            <PreferenceControls compact />
            <Text style={styles.userName}>{user?.firstName ?? t('common.user')} {user?.lastName ?? ''}</Text>
            <Text selectable style={styles.userEmail}>{user?.email}</Text>
            <TouchableRipple accessibilityRole="button" onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>{t('nav.logout')}</Text>
            </TouchableRipple>
          </View>
        </View>
      ) : null}

      <View style={styles.main}>
        {!isWide ? (
          <View style={styles.topNav}>
            <View style={styles.topNavHeader}>
              <Text style={styles.brandTitle}>{t('brand.name')}</Text>
              <View style={styles.topNavTools}>
                <PreferenceControls compact showTheme={!isMobile || pathname === '/'} />
                <IconButton accessibilityLabel={t('nav.logout')} icon="logout" onPress={logout} iconColor={colors.textPrimary} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavList}>
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <TouchableRipple
                    key={item.href}
                    accessibilityRole="link"
                    onPress={() => router.push(item.href)}
                    style={[styles.topNavItem, active && styles.topNavItemActive]}
                  >
                    <Text style={[styles.topNavText, active && styles.topNavTextActive]}>{t(item.label)}</Text>
                  </TouchableRipple>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
          <View style={isMobile ? styles.headerMobile : styles.headerDesktop}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {actions ? <View style={isMobile ? styles.headerActionsMobile : styles.headerActionsDesktop}>{actions}</View> : null}
          </View>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors, radiusMd: number, radiusLg: number) => StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  sidebar: {
    width: 250,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  sidebarTop: { gap: 42 },
  brand: { gap: 5 },
  brandTitle: { color: colors.textPrimary, fontSize: 28, fontFamily: brandFonts.heading, letterSpacing: 0.6 },
  brandSubtitle: { color: colors.accent, fontSize: 8, letterSpacing: 2.2, fontFamily: brandFonts.bodyEmphasis },
  navList: { gap: 6 },
  navItem: { borderRadius: radiusMd, paddingVertical: 11, paddingHorizontal: 12 },
  navItemActive: { backgroundColor: colors.accentMuted },
  navText: { color: colors.textSecondary, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  navTextActive: { color: colors.accent },
  userCard: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, gap: 7 },
  userName: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis },
  userEmail: { color: colors.textMuted, fontSize: 12 },
  logoutButton: {
    marginTop: 7,
    borderRadius: radiusMd,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutText: { color: colors.accent, fontSize: 12, letterSpacing: 1, fontFamily: brandFonts.bodyEmphasis },
  main: { flex: 1, minWidth: 0, paddingHorizontal: 20, paddingTop: 16 },
  topNav: { marginBottom: 12, backgroundColor: colors.surface, borderRadius: radiusLg, padding: 12, borderWidth: 1, borderColor: colors.border },
  topNavHeader: { minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 12, flexWrap: 'wrap' },
  topNavTools: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  topNavList: { gap: 8 },
  topNavItem: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.surfaceMuted },
  topNavItemActive: { backgroundColor: colors.accent },
  topNavText: { color: colors.textSecondary, fontSize: 12, fontFamily: brandFonts.bodyEmphasis },
  topNavTextActive: { color: colors.onAccent },
  headerDesktop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 16 },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  headerCopy: { flex: 1 },
  headerActionsDesktop: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  headerActionsMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  title: { fontFamily: brandFonts.heading, fontSize: 32, color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: 4, fontFamily: brandFonts.body },
  content: { minWidth: 0, paddingBottom: 80, gap: 16 },
});
