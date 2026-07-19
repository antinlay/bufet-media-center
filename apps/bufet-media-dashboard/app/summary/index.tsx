import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { MainTabScreen } from '../../components/main-tab-screen';
import { buildSummaryViewModel } from '../../features/main-tabs/summary-model';
import { useMediaPointsDashboard } from '../../features/media-points/hooks';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAuth } from '../../providers/AuthProvider';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

export default function SummaryScreen() {
  useProtectedRoute();
  const { width } = useWindowDimensions();
  const { token, loading } = useAuth();
  const query = useMediaPointsDashboard(!loading && Boolean(token));
  const model = useMemo(() => query.data ? buildSummaryViewModel(query.data) : null, [query.data]);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.pill, width < 620);

  return (
    <MainTabScreen title={t('summary.title')}>
      {query.isLoading || loading ? (
        <View style={styles.state}><ActivityIndicator color={colors.accent} size="large" /></View>
      ) : query.isError || !model ? (
        <View style={styles.state}>
          <MaterialCommunityIcons name="chart-box-outline" color={colors.danger} size={36} />
          <Text style={styles.stateText}>{t('summary.loadError')}</Text>
          <Pressable onPress={() => query.refetch()} style={styles.retry}><Text style={styles.retryText}>{t('common.retry')}</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={styles.stats}>
            <StatCard icon="monitor-multiple" label={t('summary.totalScreens')} value={model.totalScreens} tone="accent" />
            <StatCard icon="access-point" label={t('summary.online')} value={model.onlineScreens} tone="success" />
            <StatCard icon="access-point-off" label={t('summary.offline')} value={model.offlineScreens} tone="danger" />
            <StatCard icon="broadcast" label={t('summary.liveBroadcasts')} value={model.liveBroadcasts} tone="warning" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('summary.recentEvents')}</Text>
            {model.recentEvents.length ? model.recentEvents.map((event) => (
              <View key={event.id} style={styles.event}>
                <View style={[styles.eventIcon, event.kind === 'online' ? styles.eventIconOnline : styles.eventIconOffline]}>
                  <MaterialCommunityIcons name={event.kind === 'online' ? 'monitor-eye' : 'monitor-off'} color={event.kind === 'online' ? colors.success : colors.danger} size={20} />
                </View>
                <View style={styles.eventCopy}>
                  <Text style={styles.eventTitle}>{t(event.kind === 'online' ? 'summary.eventOnline' : 'summary.eventOffline', { name: event.screenName })}</Text>
                  <Text style={styles.eventTime}>{event.occurredAt ?? t('common.noData')}</Text>
                </View>
              </View>
            )) : <Text style={styles.emptyText}>{t('summary.noEvents')}</Text>}
          </View>
        </>
      )}
    </MainTabScreen>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; label: string; value: number; tone: 'accent' | 'success' | 'danger' | 'warning' }) {
  const { colors, radius } = useAppTheme();
  const styles = createStyles(colors, radius.lg, radius.pill, false);
  const color = colors[tone];
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tone === 'danger' ? colors.dangerMuted : tone === 'success' ? colors.successMuted : colors.accentMuted }]}><MaterialCommunityIcons name={icon} color={color} size={22} /></View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusPill: number, compact: boolean) => StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { minWidth: compact ? '47%' : 180, flex: 1, gap: 9, padding: 16, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  statLabel: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 12 },
  statValue: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 28, fontVariant: ['tabular-nums'] },
  card: { gap: 16, padding: compact ? 16 : 20, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cardTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 17 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  eventIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  eventIconOnline: { backgroundColor: colors.successMuted },
  eventIconOffline: { backgroundColor: colors.dangerMuted },
  eventCopy: { minWidth: 0, flex: 1, gap: 3 },
  eventTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  eventTime: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 11 },
  emptyText: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13 },
  state: { minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  stateText: { color: colors.textSecondary, fontFamily: brandFonts.body, fontSize: 13 },
  retry: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radiusPill, backgroundColor: colors.accent },
  retryText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
});
