import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text } from 'react-native-paper';
import { TextInput } from '../../components/TextInput';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { buildGroupTree, flattenGroupTree, type GroupNode } from '../../lib/groupTree';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAuth } from '../../providers/AuthProvider';

function useIsMobile() {
  const getInitialWidth = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 980;
    }
    return false;
  };
  
  const [isMobile, setIsMobile] = useState(getInitialWidth);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 980);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export default function GroupsScreen() {
  useProtectedRoute();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name) throw new Error('Название обязательно');
      return apiClient.createGroup({ name, description: description || undefined, parent_id: parentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setName('');
      setDescription('');
      setParentId(null);
    },
  });

  const groups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  const groupTree = useMemo(() => buildGroupTree(groups), [groups]);
  const flatGroups = useMemo(() => flattenGroupTree(groupTree), [groupTree]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });

  const groupRowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    ...(isMobile && {
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const,
    }),
  };

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
        <Text style={styles.selectorTitle}>Родитель</Text>
        <RadioButton.Group
          value={parentId ? String(parentId) : 'none'}
          onValueChange={(value) => setParentId(value === 'none' ? null : Number(value))}
        >
          <RadioButton.Item label="Без родителя" value="none" labelStyle={styles.radioLabel} />
          {flatGroups.map(({ group, depth }) => (
            <RadioButton.Item
              key={group.id}
              label={`${'—'.repeat(depth)} ${group.name}`}
              value={String(group.id)}
              labelStyle={styles.radioLabel}
            />
          ))}
        </RadioButton.Group>
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Создать организацию
        </Button>
      </BrandCard>

      <Section title="Список организаций" subtitle="Системные организации отмечены отдельно.">
        {groups.length === 0 ? (
          <EmptyState title="Организаций нет" subtitle="Создайте первую организацию и добавьте участников." />
        ) : (
          groupTree.map((node) => (
            <GroupNodeCard
              key={node.group.id}
              node={node}
              depth={0}
              canDelete={Boolean(user?.systemAdmin)}
              onDelete={(groupId, name) => {
                Alert.alert('Удалить организацию?', name, [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(groupId),
                  },
                ]);
              }}
              groupRowStyle={groupRowStyle}
            />
          ))
        )}
      </Section>
    </AppShell>
  );
}

function GroupNodeCard({
  node,
  depth,
  canDelete,
  onDelete,
  groupRowStyle,
}: {
  node: GroupNode;
  depth: number;
  canDelete: boolean;
  onDelete: (groupId: number, name: string) => void;
  groupRowStyle: object;
}) {
  return (
    <>
      <BrandCard style={{ marginLeft: depth * 16 }}>
        <View style={groupRowStyle}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{node.group.name}</Text>
            <Text style={styles.groupMeta}>{node.group.description ?? 'Описание не задано'}</Text>
          </View>
          {canDelete ? (
            <Button mode="text" onPress={() => onDelete(node.group.id, node.group.name)}>
              Удалить
            </Button>
          ) : null}
        </View>
      </BrandCard>
      {node.children.map((child) => (
        <GroupNodeCard
          key={child.group.id}
          node={child}
          depth={depth + 1}
          canDelete={canDelete}
          onDelete={onDelete}
          groupRowStyle={groupRowStyle}
        />
      ))}
    </>
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
  selectorTitle: {
    fontFamily: brandFonts.bodyEmphasis,
    color: palette.slate,
    marginBottom: 6,
  },
  radioLabel: {
    fontFamily: brandFonts.body,
    fontSize: 14,
  },
  groupName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
});
