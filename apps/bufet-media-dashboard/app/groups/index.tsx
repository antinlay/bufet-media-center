import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { TextInput } from '../../components/TextInput';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function GroupsScreen() {
  useProtectedRoute();
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name) throw new Error('Название обязательно');
      return apiClient.createGroup({ name, description: description || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setName('');
      setDescription('');
    },
  });

  const groups = groupsQuery.data ?? [];

  return (
    <AppShell
      title="Организации"
      subtitle="Организуйте экраны и ленты по владельцам и отделам."
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['groups'] })}>
          Обновить
        </Button>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Новая организация</Text>
        <TextInput label="Название" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Описание" value={description} onChangeText={setDescription} style={styles.input} />
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Создать организацию
        </Button>
      </BrandCard>

      <Section title="Список организаций" subtitle="Системные организации отмечены отдельно.">
        {groups.length === 0 ? (
          <EmptyState title="Организаций нет" subtitle="Создайте первую организацию и добавьте участников." />
        ) : (
          groups.map((group) => (
            <BrandCard key={group.id}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>{group.description ?? 'Описание не задано'}</Text>
              {group.systemGroup ? <Text style={styles.systemTag}>СИСТЕМНАЯ</Text> : null}
            </BrandCard>
          ))
        )}
      </Section>
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
  groupName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  groupMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
  systemTag: {
    marginTop: 8,
    fontFamily: brandFonts.bodyEmphasis,
    color: palette.goldDeep,
    letterSpacing: 1,
    fontSize: 12,
  },
});
