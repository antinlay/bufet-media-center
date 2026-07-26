import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native-paper';

import { GalleryShell } from '../../features/media-points/GalleryShell';
import { OrganizationForm } from '../../features/organizations/OrganizationForm';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { apiClient } from '../../lib/api';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';

export default function OrganizationFormScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { organizationId } = useLocalSearchParams<{ organizationId?: string }>();
  const isEditing = Boolean(organizationId);
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: ({ signal }) => apiClient.getGroups(signal),
    enabled: isEditing,
  });
  const organization = groupsQuery.data?.find((group) => String(group.id) === organizationId && !group.systemGroup);

  if (isEditing && groupsQuery.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.accent} size="large" /></View>;
  }

  if (isEditing && !organization) {
    return (
      <GalleryShell showBack title={t('organizations.editTitle')}>
        <Text style={{ color: colors.danger, textAlign: 'center' }}>{t('organizations.notFound')}</Text>
      </GalleryShell>
    );
  }

  return (
    <GalleryShell
      showBack
      title={t(isEditing ? 'organizations.editTitle' : 'organizations.addTitle')}
      subtitle={t(isEditing ? 'organizations.editSubtitle' : 'organizations.addSubtitle')}
    >
      <OrganizationForm organization={organization} onSuccess={() => router.replace('/settings/organizations')} />
    </GalleryShell>
  );
}
