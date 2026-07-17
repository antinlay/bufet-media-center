import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native-paper';

import { GalleryShell } from '../../../features/media-points/GalleryShell';
import {
  useAddLibraryItems,
  useMediaLibrary,
  usePlaylistEditor,
} from '../../../features/screen-playlist/hooks';
import { MediaThumbnail } from '../../../features/screen-playlist/MediaThumbnail';
import { formatDuration, type LibraryItemViewModel, type PlaylistMediaType } from '../../../features/screen-playlist/model';
import { useProtectedRoute } from '../../../hooks/useProtectedRoute';
import { MAX_MEDIA_PICK_COUNT } from '../../../lib/upload';
import { brandFonts, palette } from '../../../theme';

type ScreenParams = { id?: string };
type Filter = 'all' | PlaylistMediaType;

export default function PlaylistLibraryScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<ScreenParams>();
  const screenId = params.id ? Number(params.id) : null;
  const editorQuery = usePlaylistEditor(screenId);
  const libraryQuery = useMediaLibrary();
  const addMutation = useAddLibraryItems(screenId ?? 0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const columns = width >= 1100 ? 5 : width >= 760 ? 4 : width >= 500 ? 3 : 2;

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    return (libraryQuery.data ?? []).filter((item) => (
      (filter === 'all' || item.type === filter) &&
      (!query || item.title.toLocaleLowerCase('ru').includes(query))
    ));
  }, [filter, libraryQuery.data, search]);

  const selectedItems = useMemo(() => {
    const byId = new Map((libraryQuery.data ?? []).map((item) => [item.id, item]));
    return selectedIds.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
  }, [libraryQuery.data, selectedIds]);

  const toggle = (item: LibraryItemViewModel) => {
    setError(null);
    setSelectedIds((current) => {
      if (current.includes(item.id)) return current.filter((id) => id !== item.id);
      if (current.length >= MAX_MEDIA_PICK_COUNT) {
        setError(`Можно выбрать не больше ${MAX_MEDIA_PICK_COUNT} файлов`);
        return current;
      }
      return [...current, item.id];
    });
  };

  const addSelected = () => {
    if (!screenId || !selectedItems.length) return;
    setError(null);
    addMutation.mutate(selectedItems, {
      onSuccess: () => router.back(),
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : 'Не удалось добавить медиа');
      },
    });
  };

  const subtitle = editorQuery.data
    ? `${editorQuery.data.organizationName} · ${editorQuery.data.screenName}`
    : 'Выбор медиа';

  return (
    <GalleryShell title="Библиотека" subtitle={subtitle} showBack scrollable={false}>
      <View style={styles.page}>
        <View style={styles.searchFrame}>
          <MaterialCommunityIcons name="magnify" color={palette.muted} size={22} />
          <TextInput
            placeholder="Найти медиа"
            placeholderTextColor={palette.muted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filters}>
          <FilterChip active={filter === 'all'} label="Все" onPress={() => setFilter('all')} />
          <FilterChip active={filter === 'Graphic'} label="Изображения" onPress={() => setFilter('Graphic')} />
          <FilterChip active={filter === 'Video'} label="Видео" onPress={() => setFilter('Video')} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {libraryQuery.isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={palette.gold} size="large" />
            <Text style={styles.stateText}>Загружаем библиотеку…</Text>
          </View>
        ) : libraryQuery.isError ? (
          <View style={styles.state}>
            <MaterialCommunityIcons name="wifi-alert" color={palette.danger} size={36} />
            <Text style={styles.stateText}>Не удалось загрузить библиотеку.</Text>
            <Pressable onPress={() => libraryQuery.refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>Повторить</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            key={columns}
            data={items}
            numColumns={columns}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={items.length ? styles.grid : styles.emptyGrid}
            initialNumToRender={columns * 3}
            maxToRenderPerBatch={columns * 2}
            windowSize={7}
            ListEmptyComponent={
              <View style={styles.state}>
                <MaterialCommunityIcons name="image-search-outline" color={palette.gold} size={38} />
                <Text style={styles.stateText}>Ничего не найдено.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const selected = selectedIds.includes(item.id);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggle(item)}
                  style={({ pressed }) => [
                    styles.mediaCard,
                    { width: `${100 / columns}%` },
                    selected && styles.mediaCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <MediaThumbnail uri={item.thumbnailUrl} type={item.type} style={styles.mediaImage} />
                  {selected ? (
                    <View style={styles.checkBadge}>
                      <MaterialCommunityIcons name="check" color={palette.ink} size={17} />
                    </View>
                  ) : null}
                  <Text style={styles.mediaTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.mediaMeta}>
                    {item.type === 'Video' ? 'Видео' : 'Изображение'} · {formatDuration(item.duration)}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}

        <View style={styles.footer}>
          <Text style={styles.selectionText}>Выбрано: {selectedIds.length} / {MAX_MEDIA_PICK_COUNT}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!selectedItems.length || addMutation.isPending}
            onPress={addSelected}
            style={({ pressed }) => [
              styles.addButton,
              (!selectedItems.length || addMutation.isPending) && styles.addButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {addMutation.isPending ? (
              <ActivityIndicator color={palette.ink} size="small" />
            ) : (
              <Text style={styles.addText}>Добавить выбранное</Text>
            )}
          </Pressable>
        </View>
      </View>
    </GalleryShell>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0, paddingTop: 14 },
  searchFrame: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3B3E46',
    backgroundColor: palette.panelRaised,
  },
  searchInput: { minWidth: 0, flex: 1, color: palette.cream, fontFamily: brandFonts.body, fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3B3E46',
    backgroundColor: palette.panel,
  },
  filterChipActive: { borderColor: palette.gold, backgroundColor: 'rgba(242, 160, 24, 0.14)' },
  filterText: { color: palette.muted, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
  filterTextActive: { color: palette.gold },
  grid: { gap: 12, paddingBottom: 18 },
  emptyGrid: { flexGrow: 1 },
  gridRow: { gap: 12 },
  mediaCard: {
    minWidth: 0,
    flex: 1,
    gap: 6,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2F323A',
    backgroundColor: palette.panel,
  },
  mediaCardSelected: { borderColor: palette.gold, backgroundColor: palette.panelRaised },
  mediaImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10 },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
  },
  mediaTitle: { color: palette.cream, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  mediaMeta: { color: palette.muted, fontFamily: brandFonts.body, fontSize: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2A2D34',
  },
  selectionText: { color: palette.muted, fontFamily: brandFonts.body, fontSize: 12 },
  addButton: {
    minWidth: 210,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 23,
    backgroundColor: palette.gold,
  },
  addButtonDisabled: { opacity: 0.36 },
  addText: { color: palette.ink, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  state: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateText: { color: palette.muted, fontFamily: brandFonts.body, fontSize: 13 },
  retryButton: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 18, backgroundColor: palette.gold },
  retryText: { color: palette.ink, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
  errorText: { color: palette.danger, fontFamily: brandFonts.body, fontSize: 12, paddingBottom: 8 },
  pressed: { opacity: 0.72 },
});
