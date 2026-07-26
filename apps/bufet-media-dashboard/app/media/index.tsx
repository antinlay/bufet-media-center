import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Menu, Text } from 'react-native-paper';

import { MainTabScreen } from '../../components/main-tab-screen';
import { SearchField } from '../../components/search-field';
import { AddMediaUrlDialog } from '../../features/media-library/AddMediaUrlDialog';
import { MediaThumbnail } from '../../features/screen-playlist/MediaThumbnail';
import { formatDuration, type LibraryItemViewModel } from '../../features/screen-playlist/model';
import { useAddVideoUrl, useDeleteMedia, useMediaLibrary, useUploadPlaylistFiles } from '../../features/screen-playlist/hooks';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { pickMediaFiles } from '../../lib/upload';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

type MediaFilter = 'all' | 'images' | 'video' | 'audio';
const filters: readonly MediaFilter[] = ['all', 'images', 'video', 'audio'];

export default function MediaScreen() {
  useProtectedRoute();
  const { width } = useWindowDimensions();
  const query = useMediaLibrary();
  const upload = useUploadPlaylistFiles();
  const addUrl = useAddVideoUrl();
  const deleteMutation = useDeleteMedia();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<LibraryItemViewModel | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.pill, width < 620);
  const items = useMemo(() => (query.data ?? []).filter((item) => {
    const matchesSearch = item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'images' && item.type === 'Graphic') || (filter === 'video' && item.type === 'Video');
    return matchesSearch && matchesFilter;
  }), [filter, query.data, search]);

  const uploadFromDevice = async () => {
    setMenuOpen(false);
    setError(null);
    try {
      const files = await pickMediaFiles();
      if (!files.length) return;
      await upload.mutateAsync({ files });
    } catch {
      setError(t('media.uploadError'));
    }
  };

  const addMenu = (
    <Menu
      visible={menuOpen}
      onDismiss={() => setMenuOpen(false)}
      contentStyle={styles.menu}
      anchor={<Pressable accessibilityRole="button" accessibilityLabel={t('media.addMedia')} onPress={() => setMenuOpen(true)} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><MaterialCommunityIcons name="plus" color={colors.onAccent} size={25} /></Pressable>}
    >
      <Menu.Item leadingIcon="cellphone" title={t('media.addFromDevice')} onPress={uploadFromDevice} />
      <Menu.Item leadingIcon="link-variant" title={t('media.addByLink')} onPress={() => { setMenuOpen(false); setUrlDialogOpen(true); }} />
    </Menu>
  );

  const requestDelete = (item: LibraryItemViewModel) => {
    setDeleteError(null);
    setMediaToDelete(item);
  };

  const confirmDelete = async () => {
    if (!mediaToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(mediaToDelete.id);
      setSelectedMediaId(null);
      setMediaToDelete(null);
    } catch {
      setDeleteError(t('media.deleteError'));
    }
  };

  return (
    <MainTabScreen title={t('media.title')} toolbarActions={addMenu}>
      <SearchField value={search} onChangeText={setSearch} placeholder={t('media.searchPlaceholder')} />
      <View style={styles.filters}>
        {filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={({ pressed }) => [styles.filter, filter === item && styles.filterActive, pressed && styles.pressed]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{t(`media.${item}`)}</Text></Pressable>)}
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {query.isLoading ? <View style={styles.state}><ActivityIndicator color={colors.accent} size="large" /></View> : query.isError ? <View style={styles.state}><Text style={styles.stateText}>{t('media.loadError')}</Text><Pressable onPress={() => query.refetch()} style={styles.retry}><Text style={styles.retryText}>{t('common.retry')}</Text></Pressable></View> : items.length ? <View style={styles.grid}>{items.map((item) => <MediaCard key={item.id} item={item} compact={width < 620} selected={selectedMediaId === item.id} onSelect={() => setSelectedMediaId(selectedMediaId === item.id ? null : item.id)} onRequestDelete={() => requestDelete(item)} />)}</View> : <View style={styles.state}><MaterialCommunityIcons name="image-off-outline" color={colors.textMuted} size={38} /><Text style={styles.stateText}>{t(filter === 'audio' ? 'media.audioUnavailable' : 'media.empty')}</Text></View>}
      <AddMediaUrlDialog visible={urlDialogOpen} onClose={() => setUrlDialogOpen(false)} onSave={(url, title) => addUrl.mutateAsync({ url, title }).then(() => undefined)} />
      <Modal visible={Boolean(mediaToDelete)} transparent animationType="fade" onRequestClose={() => setMediaToDelete(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMediaToDelete(null)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogIcon}><MaterialCommunityIcons name="trash-can-outline" color={colors.danger} size={25} /></View>
            <Text style={styles.dialogTitle}>{t('media.deleteTitle')}</Text>
            <Text style={styles.dialogText}>{mediaToDelete ? t('media.deleteMessage', { name: mediaToDelete.title }) : ''}</Text>
            {deleteError ? <Text accessibilityRole="alert" selectable style={styles.dialogError}>{deleteError}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" disabled={deleteMutation.isPending} onPress={() => setMediaToDelete(null)} style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}><Text style={styles.cancelText}>{t('common.cancel')}</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={deleteMutation.isPending} onPress={confirmDelete} style={({ pressed }) => [styles.dialogButton, styles.deleteButton, pressed && styles.pressed]}>{deleteMutation.isPending ? <ActivityIndicator color={colors.onImage} size="small" /> : <Text style={styles.deleteText}>{t('common.delete')}</Text>}</Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </MainTabScreen>
  );
}

function MediaCard({ item, compact, selected, onSelect, onRequestDelete }: { item: LibraryItemViewModel; compact: boolean; selected: boolean; onSelect: () => void; onRequestDelete: () => void }) {
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.pill, compact);
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Pressable accessibilityRole="button" accessibilityLabel={item.title} accessibilityState={{ selected }} onPress={onSelect} style={({ pressed }) => [styles.cardSurface, pressed && styles.pressed]}>
        <MediaThumbnail uri={item.thumbnailUrl} mediaUri={item.mediaUrl} type={item.type} style={styles.thumbnail} />
        <View style={styles.cardCopy}>
          <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{t(item.type === 'Graphic' ? 'media.image' : 'media.video')} · {formatDuration(item.duration) ?? '—'}</Text>
        </View>
      </Pressable>
      {selected ? <Pressable accessible={false} focusable={false} onPress={onSelect} style={styles.selectedOverlay}><Pressable accessibilityRole="button" accessibilityLabel={t('media.deleteA11y', { name: item.title })} onPress={(event) => { event.stopPropagation(); onRequestDelete(); }} style={({ pressed }) => [styles.trashButton, pressed && styles.pressed]}><MaterialCommunityIcons name="trash-can-outline" color={colors.onImage} size={24} /></Pressable></Pressable> : null}
    </View>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusPill: number, compact: boolean) => StyleSheet.create({
  addButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill, backgroundColor: colors.accent },
  menu: { borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, boxShadow: colors.shadowSoft },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minWidth: 82, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radiusPill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  filterText: { color: colors.textSecondary, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
  filterTextActive: { color: colors.onAccent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { width: compact ? '100%' : '31.8%', minWidth: compact ? 0 : 250, flexGrow: compact ? 0 : 1, maxWidth: compact ? '100%' : 420, overflow: 'hidden', borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, boxShadow: colors.shadowSoft },
  cardSelected: { borderColor: colors.accent },
  cardSurface: { overflow: 'hidden', borderRadius: radiusLg },
  thumbnail: { width: '100%', aspectRatio: 16 / 9 },
  cardCopy: { gap: 5, padding: 12 },
  cardTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  cardMeta: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 11 },
  state: { minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  stateText: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13 },
  retry: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radiusPill, backgroundColor: colors.accent },
  retryText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
  error: { color: colors.danger, fontFamily: brandFonts.body, fontSize: 12 },
  selectedOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlay },
  trashButton: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.overlayStrong },
  dialog: { width: '100%', maxWidth: 390, alignItems: 'center', gap: 10, padding: 24, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, boxShadow: colors.shadowStrong },
  dialogIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerMuted },
  dialogTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 19 },
  dialogText: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13, textAlign: 'center' },
  dialogError: { color: colors.danger, fontFamily: brandFonts.body, fontSize: 12, textAlign: 'center' },
  dialogActions: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 10 },
  dialogButton: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill, backgroundColor: colors.surfaceMuted },
  deleteButton: { backgroundColor: colors.danger },
  cancelText: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  deleteText: { color: colors.onImage, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  pressed: { opacity: 0.72 },
});
