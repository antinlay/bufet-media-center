import { useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, RadioButton, Text } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { TextInput } from '../../components/TextInput';
import { apiClient } from '../../lib/api';
import { buildGroupTree, flattenGroupTree } from '../../lib/groupTree';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAuth } from '../../providers/AuthProvider';

export default function UsersScreen() {
  useProtectedRoute();
  const { width } = useWindowDimensions();
  const isMobile = width < 980;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: ({ signal }) => apiClient.getUsers(signal) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: ({ signal }) => apiClient.getGroups(signal) });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const availableGroups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  const flatGroups = flattenGroupTree(buildGroupTree(availableGroups));
  const [email, setEmail] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);

  const effectiveSelectedGroupId = selectedGroupId ?? flatGroups[0]?.group.id ?? null;

  const addMembershipMutation = useMutation({
    mutationFn: () => {
      if (!email.trim() || !effectiveSelectedGroupId) {
        throw new Error(t('users.selectValidation'));
      }
      return apiClient.createMembership({
        email: email.trim(),
        group_id: effectiveSelectedGroupId,
        role: selectedRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEmail('');
      setError(null);
    },
    onError: (caught: unknown) => setError(caught instanceof Error && caught.message === t('users.selectValidation') ? caught.message : t('users.addError')),
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
      title={t('users.title')}
      subtitle={t('users.subtitle')}
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
          {t('common.refresh')}
        </Button>
      }
    >
      <BrandCard>
        <Text style={styles.sectionTitle}>{t('users.addTitle')}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>{t('users.user')}</Text>
            <TextInput
              mode="outlined"
              label={t('users.email')}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.emailInput}
            />
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>{t('users.organization')}</Text>
            <RadioButton.Group
              value={effectiveSelectedGroupId ? String(effectiveSelectedGroupId) : ''}
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
            <Text style={styles.selectorTitle}>{t('users.role')}</Text>
            <RadioButton.Group
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as 'member' | 'admin')}
            >
              <RadioButton.Item label={t('users.roleMember')} value="member" labelStyle={styles.radioLabel} />
              <RadioButton.Item label={t('users.roleAdmin')} value="admin" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </View>
        </View>
        <Button mode="contained" onPress={() => addMembershipMutation.mutate()} loading={addMembershipMutation.isPending}>
          {t('common.add')}
        </Button>
      </BrandCard>
      <Section title={t('users.listTitle')} subtitle={t('users.listSubtitle')}>
        {users.length === 0 ? (
          <EmptyState title={t('users.emptyTitle')} subtitle={t('users.emptySubtitle')} />
        ) : (
          users.map((user) => (
            <BrandCard key={user.id}>
              <Text style={styles.userName}>{user.firstName ?? t('common.user')} {user.lastName ?? ''}</Text>
              <Text style={styles.userMeta}>{user.email}</Text>
              {currentUser?.systemAdmin ? (
                <View style={userActionsStyle}>
                  <Button
                    mode="text"
                    disabled={currentUser?.id === user.id}
                    onPress={() => {
                      Alert.alert(t('users.deleteTitle'), user.email, [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('common.delete'),
                          style: 'destructive',
                          onPress: () => deleteUserMutation.mutate(user.id),
                        },
                      ]);
                    }}
                    loading={deleteUserMutation.isPending}
                  >
                    {t('users.deleteUser')}
                  </Button>
                </View>
              ) : null}
              <View style={styles.membershipList}>
                {(user.groups ?? []).length === 0 ? (
                  <Text style={styles.userMeta}>{t('users.organizationsEmpty')}</Text>
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
                          {t(group.role === 'admin' ? 'users.makeMember' : 'users.makeAdmin')}
                        </Button>
                        <Button
                          mode="text"
                          disabled={!group.membershipId}
                          onPress={() => group.membershipId && deleteMembershipMutation.mutate(group.membershipId)}
                          loading={deleteMembershipMutation.isPending}
                        >
                          {t('common.delete')}
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

const createStyles = (colors: AppColors) => StyleSheet.create({
  sectionTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: brandFonts.bodyEmphasis,
    color: colors.danger,
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
    color: colors.textSecondary,
    marginBottom: 6,
  },
  emailInput: {
    backgroundColor: colors.inputBackground,
  },
  radioLabel: {
    fontFamily: brandFonts.body,
    fontSize: 14,
  },
  userName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
  },
  userMeta: {
    fontFamily: brandFonts.body,
    color: colors.textSecondary,
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
