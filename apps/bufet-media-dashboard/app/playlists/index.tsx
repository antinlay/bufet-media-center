import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Menu, Text } from 'react-native-paper';

import { MainTabScreen } from '../../components/main-tab-screen';
import { SearchField } from '../../components/search-field';
import { MediaThumbnail } from '../../features/screen-playlist/MediaThumbnail';
import { formatDuration } from '../../features/screen-playlist/model';
import { useScreenPlaylists } from '../../features/screen-playlist/hooks';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

export default function PlaylistsScreen() {
  useProtectedRoute();
  const query = useScreenPlaylists();
  const [search, setSearch] = useState('');
  const [menuScreenId, setMenuScreenId] = useState<number | null>(null);
  const router = useRouter();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.pill);
  const items = useMemo(() => (query.data ?? []).filter((item) => `${item.title} ${item.organizationName}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [query.data, search]);

  return (
    <MainTabScreen title={t('playlists.title')}>
      <SearchField value={search} onChangeText={setSearch} placeholder={t('playlists.searchPlaceholder')} />
      {query.isLoading ? <View style={styles.state}><ActivityIndicator color={colors.accent} size="large" /></View> : query.isError ? <View style={styles.state}><Text style={styles.stateText}>{t('playlists.loadError')}</Text><Pressable onPress={() => query.refetch()} style={styles.retry}><Text style={styles.retryText}>{t('common.retry')}</Text></Pressable></View> : items.length ? items.map((item) => (
        <Pressable key={item.screenId} accessibilityRole="button" onPress={() => router.push(`/screens/${item.screenId}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardCopy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.organizationName} · {t('playlists.itemsCount', { count: item.itemCount })} · {item.totalDurationSeconds === null ? '—' : formatDuration(item.totalDurationSeconds)}</Text>
            </View>
            <Menu
              visible={menuScreenId === item.screenId}
              onDismiss={() => setMenuScreenId(null)}
              contentStyle={styles.menu}
              anchor={<Pressable accessibilityRole="button" accessibilityLabel={t('playlists.actionsA11y', { name: item.title })} onPress={(event) => { event.stopPropagation(); setMenuScreenId(item.screenId); }} style={styles.more}><MaterialCommunityIcons name="dots-horizontal" color={colors.textPrimary} size={23} /></Pressable>}
            >
              <Menu.Item leadingIcon="pencil-outline" title={t('common.edit')} onPress={() => { setMenuScreenId(null); router.push(`/screens/${item.screenId}`); }} />
            </Menu>
          </View>
          {item.previews.length ? <View style={styles.previews}>{item.previews.map((preview) => <MediaThumbnail key={preview.key} uri={preview.thumbnailUrl} mediaUri={preview.mediaUrl} type={preview.type} style={styles.preview} />)}</View> : <View style={styles.emptyPreview}><MaterialCommunityIcons name="playlist-remove" color={colors.textMuted} size={28} /><Text style={styles.stateText}>{t('playlists.emptyPlaylist')}</Text></View>}
        </Pressable>
      )) : <View style={styles.state}><MaterialCommunityIcons name="playlist-remove" color={colors.textMuted} size={38} /><Text style={styles.stateText}>{t('playlists.empty')}</Text></View>}
    </MainTabScreen>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusPill: number) => StyleSheet.create({
  card: { gap: 14, padding: 16, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, boxShadow: colors.shadowSoft },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardCopy: { minWidth: 0, flex: 1, gap: 5 },
  title: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 16 },
  meta: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 11 },
  more: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill },
  menu: { borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  previews: { flexDirection: 'row', gap: 7, overflow: 'hidden' },
  preview: { width: 92, height: 58, borderRadius: 9 },
  emptyPreview: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  state: { minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  stateText: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13 },
  retry: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radiusPill, backgroundColor: colors.accent },
  retryText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
  pressed: { opacity: 0.78 },
});
