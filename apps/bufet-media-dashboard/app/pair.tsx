import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, HelperText, RadioButton, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { AppShell } from '../components/AppShell';
import { BrandCard } from '../components/BrandCard';
import { brandFonts, palette } from '../theme';

export default function PairScreen() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialCode = typeof params.code === 'string' ? params.code : '';
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [pairMode, setPairMode] = useState<'new' | 'existing'>('new');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [screenId, setScreenId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const screensQuery = useQuery({ queryKey: ['screens'], queryFn: () => apiClient.getScreens() });
  const templatesQuery = useQuery({ queryKey: ['templates'], queryFn: () => apiClient.getTemplates() });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  const availableGroups = useMemo(() => {
    return (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  }, [groupsQuery.data]);

  const pairMutation = useMutation({
    mutationFn: () => {
      if (!code) throw new Error('Код обязателен');
      if (pairMode === 'existing') {
        if (!screenId) throw new Error('Выберите экран');
        return apiClient.pairDevice({ code, screen_id: screenId });
      }
      if (!name || !groupId || !templateId) {
        throw new Error('Укажите имя, организацию и макет');
      }
      return apiClient.pairDevice({ code, screen: { name, group_id: groupId, template_id: templateId } });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      router.replace(`/screens/${data.screen.id}`);
    },
    onError: (e: any) => setError(e?.message ?? 'Не удалось привязать устройство'),
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
                value={groupId ? String(groupId) : ''}
                onValueChange={(value) => setGroupId(Number(value))}
              >
                {availableGroups.map((group) => (
                  <RadioButton.Item
                    key={group.id}
                    label={group.name}
                    value={String(group.id)}
                    labelStyle={styles.radioLabel}
                  />
                ))}
              </RadioButton.Group>
            </View>
            <View style={styles.selector}>
              <Text style={styles.selectorTitle}>Макет</Text>
              <RadioButton.Group
                value={templateId ? String(templateId) : ''}
                onValueChange={(value) => setTemplateId(Number(value))}
              >
                {(templatesQuery.data ?? []).map((template) => (
                  <RadioButton.Item
                    key={template.id}
                    label={template.name}
                    value={String(template.id)}
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
