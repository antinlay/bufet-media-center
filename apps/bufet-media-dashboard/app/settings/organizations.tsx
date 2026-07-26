import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { MainTabScreen } from '../../components/main-tab-screen';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../lib/api';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts } from '../../theme';

export default function OrganizationsSettingsScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: ({ signal }) => apiClient.getGroups(signal) });
  const organizations = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => !group.systemGroup).sort((left, right) => left.name.localeCompare(right.name, 'ru')),
    [groupsQuery.data],
  );

  return (
    <MainTabScreen
      title={t('settings.organizations')}
      subtitle={t('settings.organizationsSubtitle')}
      toolbarActions={<Button mode="contained" onPress={() => router.push('/groups')}>{t('organizations.add')}</Button>}
    >
      {groupsQuery.isError ? (
        <BrandCard><Text style={{ color: colors.danger }}>{t('organizations.loadError')}</Text></BrandCard>
      ) : organizations.length === 0 ? (
        <EmptyState
          title={t('organizations.emptyTitle')}
          subtitle={t('organizations.emptySubtitle')}
          actionLabel={t('organizations.add')}
          onAction={() => router.push('/groups')}
        />
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

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  copy: { minWidth: 0, flex: 1, gap: 4 },
  name: { fontFamily: brandFonts.bodyEmphasis, fontSize: 16 },
  description: { fontFamily: brandFonts.body, fontSize: 13 },
});
