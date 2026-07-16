import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { apiClient } from '../lib/api';
import { buildGroupTree, groupScreensByGroupId, type GroupNode as GroupNodeType } from '../lib/groupTree';
import { AppShell } from '../components/AppShell';
import { BrandCard } from '../components/BrandCard';
import { Section } from '../components/Section';
import { StatTile } from '../components/StatTile';
import { brandFonts, palette } from '../theme';
import type { ConcertoScreen } from '@bufet/shared';

export default function DashboardHome() {
  useProtectedRoute();
  const router = useRouter();

  const screensQuery = useQuery({ queryKey: ['screens'], queryFn: ({ signal }) => apiClient.getScreens(signal) });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: ({ signal }) => apiClient.getGroups(signal) });
  const contentsQuery = useQuery({ queryKey: ['contents'], queryFn: ({ signal }) => apiClient.getContents(signal) });

  const screens = screensQuery.data ?? [];
  const onlineScreens = screens.filter((screen) => screen.online).length;
  const groups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  const groupTree = buildGroupTree(groups);
  const screensByGroup = groupScreensByGroupId(screens);

  return (
    <AppShell
      title="Кабинет Буфет"
      subtitle="Контролируйте экраны, команды и контент в одном интерфейсе."
      actions={
        <View style={styles.headerActions}>
          <Button mode="outlined" onPress={() => router.push('/scan')}>
            Сканировать QR
          </Button>
          <Button mode="contained" onPress={() => router.push('/pair')}>
            Привязать экран
          </Button>
        </View>
      }
    >
      <View style={styles.grid}>
        <StatTile label="Экраны" value={`${screens.length}`} />
        <StatTile label="Онлайн" value={`${onlineScreens}`} />
        <StatTile label="Организации" value={`${groups.length}`} />
        <StatTile label="Материалы" value={`${contentsQuery.data?.length ?? 0}`} />
      </View>

      <Section title="Сцена сегодня" subtitle="Свежие параметры сети и короткие действия.">
        <BrandCard>
          <Text style={styles.cardTitle}>Стабильность сети</Text>
          <Text style={styles.cardText}>
            {screensQuery.isLoading
              ? 'Собираем статусы экрана…'
              : `В сети ${onlineScreens} экранов из ${screens.length}.`}
          </Text>
          <View style={styles.cardActions}>
            <Button mode="contained" onPress={() => router.push('/screens')}>Экраны</Button>
            <Button mode="outlined" onPress={() => router.push('/contents')}>Материалы</Button>
            <Button mode="outlined" onPress={() => router.push('/groups')}>Организации</Button>
          </View>
        </BrandCard>
      </Section>

      <Section title="Быстрый запуск" subtitle="Создайте новые сущности без лишних шагов.">
        <View style={styles.quickGrid}>
          <BrandCard style={styles.quickCard}>
            <Text style={styles.quickTitle}>Новый экран</Text>
            <Text style={styles.quickText}>Назначьте макет и организацию за минуту.</Text>
            <Button mode="contained" onPress={() => router.push('/screens')}>Открыть</Button>
          </BrandCard>
          <BrandCard style={styles.quickCard}>
            <Text style={styles.quickTitle}>Материалы</Text>
            <Text style={styles.quickText}>Загрузите изображения или видео в ленты.</Text>
            <Button mode="contained" onPress={() => router.push('/contents')}>Загрузить</Button>
          </BrandCard>
          <BrandCard style={styles.quickCard}>
            <Text style={styles.quickTitle}>Организации</Text>
            <Text style={styles.quickText}>Постройте структуру и назначьте роли.</Text>
            <Button mode="contained" onPress={() => router.push('/groups')}>Открыть</Button>
          </BrandCard>
          <BrandCard style={styles.quickCard}>
            <Text style={styles.quickTitle}>Пользователи</Text>
            <Text style={styles.quickText}>Выдайте права и доступы.</Text>
            <Button mode="contained" onPress={() => router.push('/users')}>Настроить</Button>
          </BrandCard>
        </View>
      </Section>

      <Section title="Организации и экраны" subtitle="Иерархия организаций и статусы экранов.">
        {groups.length === 0 ? (
          <BrandCard>
            <Text style={styles.cardText}>Организаций пока нет. Создайте первую, чтобы привязать экраны.</Text>
          </BrandCard>
        ) : (
          <BrandCard>
            <View style={styles.treeList}>
              {groupTree.map((node) => (
                <GroupNode
                  key={node.group.id}
                  node={node}
                  depth={0}
                  screensByGroup={screensByGroup}
                />
              ))}
            </View>
          </BrandCard>
        )}
      </Section>
    </AppShell>
  );
}

function GroupNode({
  node,
  depth,
  screensByGroup,
}: {
  node: GroupNodeType;
  depth: number;
  screensByGroup: Map<number, ConcertoScreen[]>;
}) {
  const screens = screensByGroup.get(node.group.id) ?? [];

  return (
    <View style={[styles.treeNode, { marginLeft: depth * 16 }]}>
      <Text style={styles.treeTitle}>{node.group.name}</Text>
      {screens.length ? (
        <View style={styles.treeScreens}>
          {screens.map((screen) => (
            <View key={screen.id} style={styles.treeScreenRow}>
              <Text style={styles.treeScreenName}>{screen.name}</Text>
              <View style={statusPillStyle(screen.online)}>
                <Text style={styles.statusText}>{screen.online ? 'ONLINE' : 'OFFLINE'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.treeMeta}>Экранов нет</Text>
      )}
      {node.children.length ? (
        <View style={styles.treeChildren}>
          {node.children.map((child) => (
            <GroupNode
              key={child.group.id}
              node={child}
              depth={depth + 1}
              screensByGroup={screensByGroup}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: palette.charcoal,
  },
  cardText: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minWidth: 220,
    gap: 8,
  },
  quickTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  quickText: {
    fontFamily: brandFonts.body,
    color: palette.slate,
  },
  treeList: {
    gap: 12,
  },
  treeNode: {
    gap: 6,
  },
  treeTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  treeMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
  },
  treeScreens: {
    gap: 6,
  },
  treeScreenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  treeScreenName: {
    fontFamily: brandFonts.body,
    color: palette.charcoal,
  },
  treeChildren: {
    marginTop: 6,
    gap: 8,
  },
  statusText: {
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 12,
    color: palette.charcoal,
  },
});

const statusPillStyle = (online?: boolean) => ({
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  backgroundColor: online ? '#E8F4E8' : '#F3E3DE',
  borderWidth: 1,
  borderColor: online ? '#B9D7B9' : '#E0B4A6',
});
