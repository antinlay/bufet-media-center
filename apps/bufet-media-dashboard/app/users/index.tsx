import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { buildGroupTree, flattenGroupTree } from '../../lib/groupTree';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAuth } from '../../providers/AuthProvider';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => Dimensions.get('window').width < 600);

  useEffect(() => {
    const handler = ({ window }: { window: { width: number } }) => setIsMobile(window.width < 600);
    const subscription = Dimensions.addEventListener('change', handler);
    return () => subscription.remove();
  }, []);

  return isMobile;
}

export default function UsersScreen() {
  useProtectedRoute();
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => apiClient.getUsers() });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const availableGroups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  const flatGroups = flattenGroupTree(buildGroupTree(availableGroups));
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUserId && users.length) {
      setSelectedUserId(users[0].id);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedGroupId && flatGroups.length) {
      setSelectedGroupId(flatGroups[0].group.id);
    }
  }, [flatGroups, selectedGroupId]);

  const addMembershipMutation = useMutation({
    mutationFn: () => {
      if (!selectedUserId || !selectedGroupId) {
        throw new Error('Выберите пользователя и организацию');
      }
      return apiClient.createMembership({
        user_id: selectedUserId,
        group_id: selectedGroupId,
        role: selectedRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setError(null);
    },
    onError: (e: any) => setError(e?.message ?? 'Не удалось добавить пользователя'),
  });

  const updateMembershipMutation = useMutation({
    mutationFn: (payload: { id: number; role: 'member' | 'admin' }) =>
      apiClient.updateMembership(payload.id, { role: payload.role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteMembership(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const userActionsStyle = {
    marginTop: 8,
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    ...(isMobile && {
      flexDirection: 'column' as const,
      alignItems: 'stretch' as const,
    }),
  };

  const membershipActionsStyle = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    ...(isMobile && {
      flexDirection: 'column' as const,
    }),
  };

  const membershipRowStyle = {
    gap: 6,
    ...(isMobile && {
      flexDirection: 'column' as const,
    }),
  };

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
      <BrandCard>
        <Text style={styles.sectionTitle}>Добавить в организацию</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Пользователь</Text>
            <RadioButton.Group
              value={selectedUserId ? String(selectedUserId) : ''}
              onValueChange={(value) => setSelectedUserId(Number(value))}
            >
              {users.map((user) => (
                <RadioButton.Item
                  key={user.id}
                  label={`${user.firstName ?? 'Пользователь'} ${user.lastName ?? ''}`.trim()}
                  value={String(user.id)}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Организация</Text>
            <RadioButton.Group
              value={selectedGroupId ? String(selectedGroupId) : ''}
              onValueChange={(value) => setSelectedGroupId(Number(value))}
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
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Роль</Text>
            <RadioButton.Group
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as 'member' | 'admin')}
            >
              <RadioButton.Item label="Участник" value="member" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="Администратор" value="admin" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </View>
        </View>
        <Button mode="contained" onPress={() => addMembershipMutation.mutate()} loading={addMembershipMutation.isPending}>
          Добавить
        </Button>
      </BrandCard>
      <Section title="Список пользователей" subtitle="Администраторы выделены в организациях.">
        {users.length === 0 ? (
          <EmptyState title="Пользователей нет" subtitle="Зарегистрируйте первого пользователя." />
        ) : (
          users.map((user) => (
            <BrandCard key={user.id}>
              <Text style={styles.userName}>{user.firstName ?? 'Пользователь'} {user.lastName ?? ''}</Text>
              <Text style={styles.userMeta}>{user.email}</Text>
              {currentUser?.systemAdmin ? (
                <View style={userActionsStyle}>
                  <Button
                    mode="text"
                    disabled={currentUser?.id === user.id}
                    onPress={() => {
                      Alert.alert('Удалить пользователя?', user.email, [
                        { text: 'Отмена', style: 'cancel' },
                        {
                          text: 'Удалить',
                          style: 'destructive',
                          onPress: () => deleteUserMutation.mutate(user.id),
                        },
                      ]);
                    }}
                    loading={deleteUserMutation.isPending}
                  >
                    Удалить пользователя
                  </Button>
                </View>
              ) : null}
              <View style={styles.membershipList}>
                {(user.groups ?? []).length === 0 ? (
                  <Text style={styles.userMeta}>Организации: —</Text>
                ) : (
                  (user.groups ?? []).map((group) => (
                    <View key={`${user.id}-${group.id}`} style={membershipRowStyle}>
                      <Text style={styles.userMeta}>{group.name} ({group.role})</Text>
                      <View style={membershipActionsStyle}>
                        <Button
                          mode="text"
                          disabled={!group.membershipId}
                          onPress={() => {
                            if (!group.membershipId) return;
                            const nextRole = group.role === 'admin' ? 'member' : 'admin';
                            updateMembershipMutation.mutate({ id: group.membershipId, role: nextRole });
                          }}
                          loading={updateMembershipMutation.isPending}
                        >
                          {group.role === 'admin' ? 'Сделать участником' : 'Сделать админом'}
                        </Button>
                        <Button
                          mode="text"
                          disabled={!group.membershipId}
                          onPress={() => group.membershipId && deleteMembershipMutation.mutate(group.membershipId)}
                          loading={deleteMembershipMutation.isPending}
                        >
                          Удалить
                        </Button>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </BrandCard>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: brandFonts.bodyEmphasis,
    color: '#B42318',
    marginBottom: 8,
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
  membershipList: {
    marginTop: 8,
    gap: 8,
  },
  membershipRow: {
    gap: 6,
  },
  membershipActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
