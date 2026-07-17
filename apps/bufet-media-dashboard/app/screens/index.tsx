import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, RadioButton, Text } from 'react-native-paper';
import { TextInput } from '../../components/TextInput';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { buildGroupTree, flattenGroupTree } from '../../lib/groupTree';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function ScreensScreen() {
  useProtectedRoute();
  const { width } = useWindowDimensions();
  const isMobile = width < 980;
  const router = useRouter();
  const queryClient = useQueryClient();
  const screensQuery = useQuery({ queryKey: ['screens'], queryFn: ({ signal }) => apiClient.getScreens(signal) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: ({ signal }) => apiClient.getGroups(signal) });

  const [name, setName] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<number | 'all' | null>(null);
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);

  const createMutation = useMutation({
    mutationFn: () => {
      const groupId = filterGroupId === 'all' ? null : filterGroupId ?? flatGroups[0]?.group.id ?? null;
      if (!groupId || !name) {
        throw new Error(t('screens.createValidation'));
      }
      return apiClient.createScreen({ name, group_id: groupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      setName('');
    },
    onError: (error) => {
      const message = error instanceof Error && error.message === t('screens.createValidation') ? error.message : t('screens.createError');
      Alert.alert(t('common.error'), message);
    },
  });

  const screens = useMemo(() => screensQuery.data ?? [], [screensQuery.data]);
  const adminGroups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  const groupTree = buildGroupTree(adminGroups);
  const flatGroups = flattenGroupTree(groupTree);

  const selectedFilterGroupId = filterGroupId === 'all' ? null : filterGroupId ?? flatGroups[0]?.group.id ?? null;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteScreen(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['screens'] }),
    onError: () => {
      Alert.alert(t('common.error'), t('screens.deleteError'));
    },
  });

  const filteredScreens = selectedFilterGroupId
    ? screens.filter((screen) => screen.groupId === selectedFilterGroupId)
    : screens;

  const screenRowStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 12,
    ...(isMobile && {
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
    }),
  };

  const screenActionsStyle = {
    alignItems: 'flex-end' as const,
    gap: 6,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    ...(isMobile && {
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
    }),
  };

  return (
    <AppShell
      title={t('screens.title')}
      subtitle={t('screens.subtitle')}
      actions={
        <View style={styles.headerActions}>
          <Button mode="outlined" onPress={() => router.push('/scan')}>
            {t('dashboard.scanQr')}
          </Button>
          <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['screens'] })}>
            {t('common.refresh')}
          </Button>
        </View>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>{t('screens.createTitle')}</Text>
        <TextInput
          label={t('screens.name')}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          {t('screens.createTitle')}
        </Button>
      </BrandCard>

      <BrandCard>
        <Text style={styles.cardTitle}>{t('screens.filterTitle')}</Text>
        <RadioButton.Group
          onValueChange={(value) => setFilterGroupId(value === 'all' ? 'all' : Number(value))}
          value={selectedFilterGroupId ? String(selectedFilterGroupId) : 'all'}
        >
          <RadioButton.Item label={t('screens.filterAll')} value="all" labelStyle={styles.radioLabel} />
          {flatGroups.map(({ group, depth }) => (
            <RadioButton.Item
              key={group.id}
              label={`${'—'.repeat(depth)} ${group.name}`}
              value={String(group.id)}
              labelStyle={styles.radioLabel}
            />
          ))}
        </RadioButton.Group>
      </BrandCard>

      <Section title={t('screens.listTitle')} subtitle={t('screens.listSubtitle')}>
        {filteredScreens.length === 0 ? (
          <EmptyState title={t('screens.emptyTitle')} subtitle={t('screens.emptySubtitle')} />
        ) : (
          filteredScreens.map((screen) => (
            <Pressable key={screen.id} onPress={() => router.push(`/screens/${screen.id}`)}>
              <BrandCard>
                <View style={screenRowStyle}>
                  <View>
                    <Text style={styles.screenName}>{screen.name}</Text>
                    <Text style={styles.screenMeta}>{t('screens.organization', { name: screen.group?.name ?? screen.groupId })}</Text>
                  </View>
                  <View style={screenActionsStyle}>
                    <View style={statusPillStyle(screen.online, colors)}>
                      <Text style={styles.statusText}>{t(screen.online ? 'dashboard.online' : 'dashboard.offlineLabel')}</Text>
                    </View>
                    <Button
                      mode="text"
                      onPress={() => deleteMutation.mutate(screen.id)}
                      loading={deleteMutation.isPending}
                    >
                      {t('common.delete')}
                    </Button>
                  </View>
                </View>
                <Text style={styles.screenMeta}>{t('screens.lastSeen', { value: screen.lastSeenAt ?? t('common.noData') })}</Text>
                <Text style={styles.screenMeta} selectable>{t('screens.deviceId', { value: screen.device?.deviceId ?? t('screens.notPaired') })}</Text>
              </BrandCard>
            </Pressable>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBackground,
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  selector: {
    flex: 1,
    minWidth: 220,
  },
  selectorTitle: {
    fontFamily: brandFonts.bodyEmphasis,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  radioLabel: {
    fontFamily: brandFonts.body,
    fontSize: 14,
  },
  screenName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
  },
  screenMeta: {
    fontFamily: brandFonts.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusText: {
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 12,
    color: colors.textPrimary,
  },
});

const statusPillStyle = (online: boolean | undefined, colors: AppColors) => ({
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: online ? colors.successMuted : colors.dangerMuted,
  borderWidth: 1,
  borderColor: online ? colors.success : colors.danger,
});
