import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function TemplatesScreen() {
  useProtectedRoute();
  const queryClient = useQueryClient();
  const templatesQuery = useQuery({ queryKey: ['templates'], queryFn: () => apiClient.getTemplates() });

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name) throw new Error('Название обязательно');
      return apiClient.createTemplate({ name, author: author || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setName('');
      setAuthor('');
    },
  });

  const templates = templatesQuery.data ?? [];

  return (
    <AppShell
      title="Макеты"
      subtitle="Настройте сетку полей и фон для каждого типа экрана."
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['templates'] })}>
          Обновить
        </Button>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Новый макет</Text>
        <TextInput label="Название" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Автор" value={author} onChangeText={setAuthor} style={styles.input} />
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Создать макет
        </Button>
      </BrandCard>

      <Section title="Активные макеты" subtitle="Библиотека доступных компоновок.">
        {templates.length === 0 ? (
          <EmptyState title="Макетов нет" subtitle="Создайте первый макет для назначения экранам." />
        ) : (
          templates.map((template) => (
            <BrandCard key={template.id}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateMeta}>Автор: {template.author ?? 'Не указан'}</Text>
                </View>
                <Text style={styles.templateCount}>{template.positions?.length ?? 0} полей</Text>
              </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  templateMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
  templateCount: {
    fontFamily: brandFonts.bodyEmphasis,
    color: palette.charcoal,
  },
});
