import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function ModerationScreen() {
  useProtectedRoute();
  const queryClient = useQueryClient();
  const submissionsQuery = useQuery({ queryKey: ['submissions'], queryFn: () => apiClient.getSubmissions() });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteSubmission(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions'] }),
  });

  const submissions = submissionsQuery.data ?? [];

  return (
    <AppShell
      title="Модерация"
      subtitle="Отслеживайте распределение материалов по лентам и очищайте лишнее."
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['submissions'] })}>
          Обновить
        </Button>
      }
    >
      <Section title="Связки материал → лента" subtitle="Активные назначения материалов.">
        {submissions.length === 0 ? (
          <EmptyState title="Нечего модерировать" subtitle="Пока нет назначений материалов в лентах." />
        ) : (
          submissions.map((submission) => (
            <BrandCard key={submission.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{submission.content?.name ?? `Материал #${submission.contentId}`}</Text>
                  <Text style={styles.meta}>Лента: {submission.feed?.name ?? submission.feedId}</Text>
                </View>
                <Button mode="outlined" onPress={() => deleteMutation.mutate(submission.id)}>
                  Удалить
                </Button>
              </View>
            </BrandCard>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  meta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
});
