import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, HelperText, RadioButton, Text } from 'react-native-paper';
import { TextInput } from '../components/TextInput';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { AppShell } from '../components/AppShell';
import { BrandCard } from '../components/BrandCard';
import { brandFonts, palette } from '../theme';
import { buildGroupTree, flattenGroupTree } from '../lib/groupTree';

export default function PairScreen() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialCode = typeof params.code === 'string' ? params.code : '';
  const [code, setCode] = useState(() => initialCode);
  const [error, setError] = useState<string | null>(null);
  const [pairMode, setPairMode] = useState<'new' | 'existing'>('new');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [screenId, setScreenId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const screensQuery = useQuery({ queryKey: ['screens'], queryFn: ({ signal }) => apiClient.getScreens(signal) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: ({ signal }) => apiClient.getGroups(signal) });

  const availableGroups = useMemo(() => {
    return (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  }, [groupsQuery.data]);
  const flatGroups = useMemo(
    () => flattenGroupTree(buildGroupTree(availableGroups)),
    [availableGroups],
  );

  const selectedGroupId = groupId ?? flatGroups[0]?.group.id ?? null;

  const pairMutation = useMutation({
    mutationFn: () => {
      if (!code) throw new Error('Код обязателен');
      if (pairMode === 'existing') {
        if (!screenId) throw new Error('Выберите экран');
        return apiClient.pairDevice({ code, screen_id: screenId });
      }
      if (!name || !selectedGroupId) {
        throw new Error('Укажите имя и организацию');
      }
      return apiClient.pairDevice({ code, screen: { name, group_id: selectedGroupId } });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      router.replace(`/screens/${data.screen.id}`);
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Не удалось привязать устройство'),
  });

  return (
    <AppShell
      title="Привязка экрана"
      subtitle="Введите код с плеера и назначьте экран в систему."
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Код привязки</Text>
        <TextInput
          label="Код"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          style={styles.input}
        />
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Режим</Text>
            <RadioButton.Group value={pairMode} onValueChange={(value) => setPairMode(value as 'new' | 'existing')}>
              <RadioButton.Item label="Создать новый экран" value="new" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="Привязать к существующему" value="existing" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </View>
        </View>
        {pairMode === 'new' ? (
          <View style={styles.selectorRow}>
            <TextInput label="Название экрана" value={name} onChangeText={setName} style={styles.input} />
            <View style={styles.selector}>
              <Text style={styles.selectorTitle}>Организация</Text>
              <RadioButton.Group
                value={selectedGroupId ? String(selectedGroupId) : ''}
                onValueChange={(value) => setGroupId(Number(value))}
              >
                {flatGroups.map(({ group, depth }) => (
                  <RadioButton.Item
                    key={group.id}
                    label={`${'—'.repeat(depth)} ${group.name}`}
                    value={String(group.id)}
                    labelStyle={styles.radioLabel}
                  />
                ))}
              </RadioButton.Group>
            </View>
          </View>
        ) : (
          <View style={styles.selectorRow}>
            <View style={styles.selector}>
              <Text style={styles.selectorTitle}>Экран</Text>
              <RadioButton.Group
                value={screenId ? String(screenId) : ''}
                onValueChange={(value) => setScreenId(Number(value))}
              >
                {(screensQuery.data ?? []).map((screen) => (
                  <RadioButton.Item
                    key={screen.id}
                    label={screen.name}
                    value={String(screen.id)}
                    labelStyle={styles.radioLabel}
                  />
                ))}
              </RadioButton.Group>
            </View>
          </View>
        )}

        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button mode="contained" onPress={() => pairMutation.mutate()} loading={pairMutation.isPending}>
          Привязать
        </Button>
      </BrandCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
});
