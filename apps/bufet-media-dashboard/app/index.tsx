import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { apiClient } from '../lib/api';
import { AppShell } from '../components/AppShell';
import { BrandCard } from '../components/BrandCard';
import { Section } from '../components/Section';
import { StatTile } from '../components/StatTile';
import { brandFonts, palette } from '../theme';

export default function DashboardHome() {
  useProtectedRoute();
  const router = useRouter();

  const screensQuery = useQuery({ queryKey: ['screens'], queryFn: () => apiClient.getScreens() });
  const feedsQuery = useQuery({ queryKey: ['feeds'], queryFn: () => apiClient.getFeeds() });
  const contentsQuery = useQuery({ queryKey: ['contents'], queryFn: () => apiClient.getContents() });
  const templatesQuery = useQuery({ queryKey: ['templates'], queryFn: () => apiClient.getTemplates() });

  const onlineScreens = screensQuery.data?.filter((screen) => screen.online).length ?? 0;
  const visibleFeeds = (feedsQuery.data ?? []).filter((feed) => feed.config?.kind !== 'playlist');

  return (
    <AppShell
      title="Кабинет Буфет"
      subtitle="Контролируйте экраны, контент и команду в одном интерфейсе."
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
        <StatTile label="Экраны" value={`${screensQuery.data?.length ?? 0}`} />
        <StatTile label="Онлайн" value={`${onlineScreens}`} />
        <StatTile label="Ленты" value={`${visibleFeeds.length}`} />
        <StatTile label="Материалы" value={`${contentsQuery.data?.length ?? 0}`} />
      </View>

      <Section title="Сцена сегодня" subtitle="Свежие параметры сети и короткие действия.">
        <BrandCard>
          <Text style={styles.cardTitle}>Стабильность сети</Text>
          <Text style={styles.cardText}>
            {screensQuery.isLoading
              ? 'Собираем статусы экрана…'
              : `В сети ${onlineScreens} экранов из ${screensQuery.data?.length ?? 0}.`}
          </Text>
          <View style={styles.cardActions}>
            <Button mode="contained" onPress={() => router.push('/screens')}>Экраны</Button>
            <Button mode="outlined" onPress={() => router.push('/contents')}>Материалы</Button>
            <Button mode="outlined" onPress={() => router.push('/feeds')}>Ленты</Button>
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
            <Text style={styles.quickTitle}>Ленты и макеты</Text>
            <Text style={styles.quickText}>Соберите наборы под разные зоны экрана.</Text>
            <Button mode="contained" onPress={() => router.push('/feeds')}>Настроить</Button>
          </BrandCard>
        </View>
      </Section>

      <BrandCard>
        <Text style={styles.cardTitle}>Текущая библиотека</Text>
        <Text style={styles.cardText}>Шаблонов: {templatesQuery.data?.length ?? 0}</Text>
        <Text style={styles.cardText}>Лент: {visibleFeeds.length}</Text>
        <Text style={styles.cardText}>Материалов: {contentsQuery.data?.length ?? 0}</Text>
      </BrandCard>
    </AppShell>
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
});
