import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { MainTabScreen } from '../../components/main-tab-screen';
import { BrandCard } from '../../components/BrandCard';
import { apiClient } from '../../lib/api';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

export default function OrganizationsSettingsScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.pill, radius.lg);
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: ({ signal }) => apiClient.getGroups(signal) });
  const organizations = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => !group.systemGroup).sort((left, right) => left.name.localeCompare(right.name, 'ru')),
    [groupsQuery.data],
  );

  return (
    <MainTabScreen
      title={t('settings.organizations')}
      subtitle={t('settings.organizationsSubtitle')}
      toolbarActions={(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('organizations.add')}
          onPress={() => router.push('/groups')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="plus" color={colors.onAccent} size={25} />
        </Pressable>
      )}
    >
      {groupsQuery.isError ? (
        <BrandCard><Text style={{ color: colors.danger }}>{t('organizations.loadError')}</Text></BrandCard>
      ) : organizations.length === 0 ? (
        <View style={styles.state}>
          <MaterialCommunityIcons name="domain-off" color={colors.textMuted} size={38} />
          <Text style={styles.stateTitle}>{t('organizations.emptyTitle')}</Text>
          <Text style={styles.stateText}>{t('organizations.emptySubtitle')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {organizations.map((organization) => (
            <BrandCard key={organization.id} style={styles.card}>
              <View style={styles.copy}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{organization.name}</Text>
                {organization.description ? <Text style={[styles.description, { color: colors.textMuted }]}>{organization.description}</Text> : null}
              </View>
              <IconButton
                icon="pencil-outline"
                iconColor={colors.accent}
                accessibilityLabel={t('organizations.editA11y', { name: organization.name })}
                onPress={() => router.push(`/groups?organizationId=${organization.id}`)}
              />
            </BrandCard>
          ))}
        </View>
      )}
    </MainTabScreen>
  );
}

const createStyles = (colors: AppColors, radiusPill: number, radiusLg: number) => StyleSheet.create({
  list: { gap: 12 },
  state: { minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  stateTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 18, textAlign: 'center' },
  stateText: { maxWidth: 380, color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  copy: { minWidth: 0, flex: 1, gap: 4 },
  name: { fontFamily: brandFonts.bodyEmphasis, fontSize: 16 },
  description: { fontFamily: brandFonts.body, fontSize: 13 },
  addButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill, backgroundColor: colors.accent },
  pressed: { opacity: 0.72 },
});
