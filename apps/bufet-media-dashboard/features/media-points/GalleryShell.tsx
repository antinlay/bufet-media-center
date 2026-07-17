import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../../providers/AuthProvider';
import { brandFonts, type AppColors } from '../../theme';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { PreferenceControls } from '../../components/preference-controls';

interface GalleryShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  toolbarActions?: ReactNode;
  showBack?: boolean;
  showAccount?: boolean;
  scrollable?: boolean;
  onBackPress?: () => void;
}

export function GalleryShell({
  children,
  title,
  subtitle,
  toolbarActions,
  showBack = false,
  showAccount = false,
  scrollable = true,
  onBackPress,
}: GalleryShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.md);

  const goBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.page}>
        <View style={styles.toolbarFrame}>
          <View style={styles.toolbar}>
            <View style={styles.toolbarIdentity}>
              {showBack ? (
                <IconButton
                  icon="chevron-left"
                  iconColor={colors.textPrimary}
                  size={28}
                  onPress={goBack}
                  accessibilityLabel={t('common.back')}
                />
              ) : (
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>{t('brand.name').slice(0, 1)}</Text>
                </View>
              )}
              <View style={styles.brandCopy}>
                <Text style={styles.brandTitle}>{title ?? t('brand.name')}</Text>
                {title ? null : <Text style={styles.brandSubtitle}>{t('brand.tagline')}</Text>}
              </View>
            </View>
            <View style={styles.toolbarActions}>
              {toolbarActions}
              <PreferenceControls compact={width < 760} />
            </View>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {scrollable ? (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.content}>{children}</View>

            {showAccount ? (
              <View style={styles.account}>
                <Text style={styles.accountName}>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('common.user')}
                </Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={logout}
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.logoutText}>{t('nav.logout')}</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        ) : (
          <View style={styles.fixedContent}>{children}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors, borderRadius: number) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbarFrame: {
    width: '100%',
    maxWidth: 1480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toolbar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toolbarIdentity: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandMarkText: {
    color: colors.accent,
    fontFamily: brandFonts.heading,
    fontSize: 20,
  },
  brandCopy: {
    minWidth: 0,
    gap: 1,
  },
  brandTitle: {
    color: colors.textPrimary,
    fontFamily: brandFonts.heading,
    fontSize: 22,
  },
  brandSubtitle: {
    color: colors.accent,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 9,
    letterSpacing: 2.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    marginLeft: 58,
    marginTop: -4,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 1480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  content: {
    gap: 28,
  },
  fixedContent: {
    width: '100%',
    maxWidth: 1480,
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  account: {
    marginTop: 42,
    paddingTop: 24,
    paddingBottom: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: 'flex-start',
    gap: 5,
  },
  accountName: {
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 14,
  },
  accountEmail: {
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 12,
  },
  logoutButton: {
    minWidth: 120,
    marginTop: 9,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.accent,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
