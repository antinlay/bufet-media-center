import { StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function UsersScreen() {
  useProtectedRoute();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => apiClient.getUsers() });

  const users = usersQuery.data ?? [];

  return (
    <AppShell
      title="Пользователи"
      subtitle="Состав команды и роли в организациях."
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
          Обновить
        </Button>
      }
    >
      <Section title="Список пользователей" subtitle="Администраторы выделены в организациях.">
        {users.length === 0 ? (
          <EmptyState title="Пользователей нет" subtitle="Зарегистрируйте первого пользователя." />
        ) : (
          users.map((user) => (
            <BrandCard key={user.id}>
              <Text style={styles.userName}>{user.firstName ?? 'Пользователь'} {user.lastName ?? ''}</Text>
              <Text style={styles.userMeta}>{user.email}</Text>
              <Text style={styles.userMeta}>Организации: {(user.groups ?? []).map((group) => `${group.name} (${group.role})`).join(', ') || '—'}</Text>
            </BrandCard>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  userName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  userMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
});
