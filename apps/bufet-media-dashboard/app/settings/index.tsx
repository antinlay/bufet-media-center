import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { MainTabScreen } from '../../components/main-tab-screen';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAuth } from '../../providers/AuthProvider';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

export default function SettingsScreen() {
  useProtectedRoute();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.pill);

  return (
    <MainTabScreen title={t('settings.title')} showPreferences>
      <View style={styles.profileCard}>
        <View style={styles.avatar}><MaterialCommunityIcons name="account" color={colors.accent} size={28} /></View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || t('common.user')}</Text>
          <Text selectable style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.list}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings/organizations')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.icon}><MaterialCommunityIcons name="domain" color={colors.accent} size={22} /></View>
          <View style={styles.copy}><Text style={styles.itemTitle}>{t('settings.organizations')}</Text><Text style={styles.subtitle}>{t('settings.organizationsSubtitle')}</Text></View>
          <MaterialCommunityIcons name="chevron-right" color={colors.textMuted} size={22} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={logout} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={[styles.icon, styles.logoutIcon]}><MaterialCommunityIcons name="logout" color={colors.danger} size={22} /></View>
          <View style={styles.copy}><Text style={styles.logout}>{t('settings.logout')}</Text><Text style={styles.subtitle}>{t('settings.logoutSubtitle')}</Text></View>
          <MaterialCommunityIcons name="chevron-right" color={colors.danger} size={22} />
        </Pressable>
      </View>
    </MainTabScreen>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusPill: number) => StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  avatar: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill, backgroundColor: colors.accentMuted },
  profileCopy: { minWidth: 0, flex: 1, gap: 4 },
  profileName: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 16 },
  profileEmail: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 12 },
  list: { overflow: 'hidden', borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.accentMuted },
  logoutIcon: { backgroundColor: colors.dangerMuted },
  copy: { minWidth: 0, flex: 1, gap: 3 },
  itemTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  subtitle: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 11 },
  logout: { color: colors.danger, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  pressed: { opacity: 0.72, backgroundColor: colors.surfaceMuted },
});
