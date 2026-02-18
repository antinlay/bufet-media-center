import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
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
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

function useIsMobile() {
  const getInitialWidth = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 600;
    }
    return false;
  };
  
  const [isMobile, setIsMobile] = useState(getInitialWidth);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export default function ScreensScreen() {
  useProtectedRoute();
  const isMobile = useIsMobile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const screensQuery = useQuery({ queryKey: ['screens'], queryFn: () => apiClient.getScreens() });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });

  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [filterGroupId, setFilterGroupId] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!groupId || !name) {
        throw new Error('Заполните имя и выберите организацию в фильтре');
      }
      return apiClient.createScreen({ name, group_id: groupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      setName('');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Не удалось создать экран';
      Alert.alert('Ошибка', message);
    },
  });

  const screens = useMemo(() => screensQuery.data ?? [], [screensQuery.data]);
  const adminGroups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  const groupTree = buildGroupTree(adminGroups);
  const flatGroups = flattenGroupTree(groupTree);

  useEffect(() => {
    if (filterGroupId === null && flatGroups.length) {
      setFilterGroupId(flatGroups[0].group.id);
    }
  }, [flatGroups, filterGroupId]);

  useEffect(() => {
    setGroupId(filterGroupId);
  }, [filterGroupId]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteScreen(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['screens'] }),
  });

  const filteredScreens = useMemo(() => {
    if (!filterGroupId) return screens;
    return screens.filter((screen) => screen.groupId === filterGroupId);
  }, [filterGroupId, screens]);

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
      title="Экраны"
      subtitle="Экран = точка показа. Назначайте организации и отслеживайте онлайн‑статусы."
      actions={
        <View style={styles.headerActions}>
          <Button mode="outlined" onPress={() => router.push('/scan')}>
            Сканировать QR
          </Button>
          <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['screens'] })}>
            Обновить
          </Button>
        </View>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Создать экран</Text>
        <TextInput
          label="Название"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Создать экран
        </Button>
      </BrandCard>

      <BrandCard>
        <Text style={styles.cardTitle}>Фильтр по организациям</Text>
        <RadioButton.Group
          onValueChange={(value) => setFilterGroupId(value === 'all' ? null : Number(value))}
          value={filterGroupId ? String(filterGroupId) : 'all'}
        >
          <RadioButton.Item label="Все" value="all" labelStyle={styles.radioLabel} />
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

      <Section title="Список экранов" subtitle="Подключенные и ожидающие привязку устройства.">
        {filteredScreens.length === 0 ? (
          <EmptyState title="Экранов нет" subtitle="Создайте первый экран и привяжите устройство через QR." />
        ) : (
          filteredScreens.map((screen) => (
            <Pressable key={screen.id} onPress={() => router.push(`/screens/${screen.id}`)}>
              <BrandCard>
                <View style={screenRowStyle}>
                  <View>
                    <Text style={styles.screenName}>{screen.name}</Text>
                    <Text style={styles.screenMeta}>Организация: {screen.group?.name ?? screen.groupId}</Text>
                  </View>
                  <View style={screenActionsStyle}>
                    <View style={statusPillStyle(screen.online)}>
                      <Text style={styles.statusText}>{screen.online ? 'ONLINE' : 'OFFLINE'}</Text>
                    </View>
                    <Button
                      mode="text"
                      onPress={() => {
                        Alert.alert('Удалить экран?', screen.name, [
                          { text: 'Отмена', style: 'cancel' },
                          {
                            text: 'Удалить',
                            style: 'destructive',
                            onPress: () => deleteMutation.mutate(screen.id),
                          },
                        ]);
                      }}
                      loading={deleteMutation.isPending}
                    >
                      Удалить
                    </Button>
                  </View>
                </View>
                <Text style={styles.screenMeta}>Последний сигнал: {screen.lastSeenAt ?? 'Нет данных'}</Text>
                <Text style={styles.screenMeta}>Device ID: {screen.device?.deviceId ?? 'Не привязан'}</Text>
              </BrandCard>
            </Pressable>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: palette.charcoal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFDF9',
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
    color: palette.slate,
    marginBottom: 6,
  },
  radioLabel: {
    fontFamily: brandFonts.body,
    fontSize: 14,
  },
  screenName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  screenMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
  statusText: {
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 12,
    color: palette.charcoal,
  },
});

const statusPillStyle = (online?: boolean) => ({
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: online ? '#E8F4E8' : '#F3E3DE',
  borderWidth: 1,
  borderColor: online ? '#B9D7B9' : '#E0B4A6',
});
