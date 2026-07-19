import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Menu, Text } from 'react-native-paper';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

import { GalleryShell } from '../../features/media-points/GalleryShell';
import {
  usePlaylistDraft,
  usePlaylistDraftActions,
  usePlaylistEditor,
  useSavePlaylistOrder,
  useUpdatePlaylistItemDuration,
  useUploadPlaylistFiles,
} from '../../features/screen-playlist/hooks';
import { DisplayDurationDialog } from '../../features/screen-playlist/DisplayDurationDialog';
import { MediaThumbnail } from '../../features/screen-playlist/MediaThumbnail';
import { formatDuration, type PlaylistItemViewModel } from '../../features/screen-playlist/model';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { pickMediaFiles } from '../../lib/upload';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

type ScreenParams = { id?: string };

function normalizeOrder(items: PlaylistItemViewModel[]) {
  return items.map((item, position) => ({ ...item, position }));
}

function mergeServerItems(current: PlaylistItemViewModel[], server: PlaylistItemViewModel[]) {
  const serverById = new Map(server.map((item) => [item.submissionId, item]));
  const currentIds = new Set(current.flatMap((item) => item.submissionId === null ? [] : [item.submissionId]));
  const kept = current.flatMap((item) => {
    if (item.submissionId === null) return [item];
    const updated = serverById.get(item.submissionId);
    return updated ? [{ ...updated, position: item.position }] : [];
  });
  const added = server.filter((item) => item.submissionId !== null && !currentIds.has(item.submissionId));
  return normalizeOrder([...kept, ...added]);
}

function mergeUploadedItems(current: PlaylistItemViewModel[], uploaded: PlaylistItemViewModel[]) {
  const currentKeys = new Set(current.map((item) => item.key));
  return normalizeOrder([...current, ...uploaded.filter((item) => !currentKeys.has(item.key))]);
}

export default function PlaylistEditorScreen() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams<ScreenParams>();
  const screenId = params.id ? Number(params.id) : null;
  const editorQuery = usePlaylistEditor(screenId);
  const draftQuery = usePlaylistDraft(screenId);
  const draftActions = usePlaylistDraftActions(screenId ?? 0);
  const uploadMutation = useUploadPlaylistFiles();
  const saveMutation = useSavePlaylistOrder(screenId ?? 0);
  const durationMutation = useUpdatePlaylistItemDuration(screenId ?? 0);
  const [items, setItems] = useState<PlaylistItemViewModel[]>([]);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);
  const [durationItem, setDurationItem] = useState<PlaylistItemViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const pendingRouteRef = useRef<'url' | 'library' | null>(null);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.xl);
  const addMenuItemTheme = { colors: { onSurface: colors.textPrimary, onSurfaceVariant: colors.textPrimary } };
  const draftItems = draftQuery.data;
  const displayedItems = useMemo(
    () => mergeUploadedItems(items, draftItems ?? []),
    [draftItems, items],
  );
  const hasUnsavedChanges = dirty || Boolean(draftItems?.length);

  useEffect(() => {
    dirtyRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (addMenuOpen || !pendingRouteRef.current) return;
    const destination = pendingRouteRef.current;
    pendingRouteRef.current = null;
    if (!screenId) return;
    router.push(`/screens/${screenId}/${destination}` as Href);
  }, [addMenuOpen, router, screenId]);

  useEffect(() => {
    const serverItems = editorQuery.data?.items;
    if (!serverItems) return;
    setItems((current) => dirtyRef.current ? mergeServerItems(current, serverItems) : serverItems);
  }, [editorQuery.data?.items]);

  const goBack = () => {
    if (!hasUnsavedChanges) {
      router.back();
      return;
    }
    const leave = () => {
      draftActions.clear();
      router.back();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(t('playlist.unsavedMessage'))) leave();
      return;
    }
    Alert.alert(t('playlist.unsavedTitle'), t('playlist.unsavedMessage'), [
      { text: t('common.stay'), style: 'cancel' },
      { text: t('common.leave'), style: 'destructive', onPress: leave },
    ]);
  };

  const uploadFromDevice = async () => {
    setAddMenuOpen(false);
    setError(null);
    try {
      const files = await pickMediaFiles();
      if (!files.length) return;
      setUploadProgress({ done: 0, total: files.length });
      uploadMutation.mutate(
        {
          files,
          onProgress: (done, total) => setUploadProgress({ done, total }),
        },
        {
          onSuccess: (added) => {
            draftActions.stage(added);
            setSuccess(null);
          },
          onError: (mutationError) => {
            setError(t('playlist.uploadFilesError'));
          },
          onSettled: () => setUploadProgress(null),
        },
      );
    } catch {
      setError(t('playlist.pickFilesError'));
    }
  };

  const save = () => {
    if (!screenId || !hasUnsavedChanges) return;
    setError(null);
    setSuccess(null);
    saveMutation.mutate(displayedItems, {
      onSuccess: (savedItems) => {
        draftActions.clear();
        dirtyRef.current = false;
        setItems(normalizeOrder(savedItems));
        setDirty(false);
        setSuccess(t('playlist.saved'));
      },
      onError: (mutationError) => {
        setError(t('playlist.saveError'));
      },
    });
  };

  const requestDelete = (item: PlaylistItemViewModel) => {
    setItemMenuId(null);
    const remove = () => {
      setItems((current) => normalizeOrder(current.filter((candidate) => candidate.key !== item.key)));
      if (item.submissionId === null) draftActions.remove(item.key);
      setDirty(true);
      setSuccess(null);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(t('playlist.removeConfirm', { name: item.title }))) remove();
      return;
    }
    Alert.alert(t('playlist.deleteTitle'), item.title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: remove },
    ]);
  };

  const saveDuration = async (displayDurationSeconds: number) => {
    if (!durationItem || !screenId) return;
    const updateItem = (item: PlaylistItemViewModel) => (
      item.key === durationItem.key ? { ...item, displayDurationSeconds } : item
    );

    if (durationItem.submissionId !== null) {
      const savedItem = await durationMutation.mutateAsync({
        submissionId: durationItem.submissionId,
        displayDurationSeconds,
      });
      setItems((current) => current.map((item) => item.key === durationItem.key ? savedItem : item));
    } else {
      const savedItems = await saveMutation.mutateAsync(normalizeOrder(displayedItems.map(updateItem)));
      draftActions.clear();
      dirtyRef.current = false;
      setItems(normalizeOrder(savedItems));
      setDirty(false);
    }

    setSuccess(t('playlist.displayTimeSaved'));
    setError(null);
  };

  const plusButton = (
    <Menu
      visible={addMenuOpen}
      onDismiss={() => setAddMenuOpen(false)}
      contentStyle={styles.addMenu}
      elevation={3}
      anchor={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('playlist.addMedia')}
          onPress={() => setAddMenuOpen(true)}
          style={({ pressed }) => [styles.plusButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="plus" color={colors.onAccent} size={25} />
        </Pressable>
      }
    >
      <Menu.Item
        leadingIcon="cellphone"
        title={t('playlist.addFromDevice')}
        onPress={uploadFromDevice}
        style={styles.addMenuItem}
        titleStyle={styles.addMenuTitle}
        theme={addMenuItemTheme}
        rippleColor={colors.accentMuted}
      />
      <Menu.Item
        leadingIcon="link-variant"
        title={t('playlist.addByLink')}
        onPress={() => {
          pendingRouteRef.current = 'url';
          setAddMenuOpen(false);
        }}
        style={styles.addMenuItem}
        titleStyle={styles.addMenuTitle}
        theme={addMenuItemTheme}
        rippleColor={colors.accentMuted}
      />
      <Menu.Item
        leadingIcon="image-multiple-outline"
        title={t('playlist.addFromLibrary')}
        onPress={() => {
          pendingRouteRef.current = 'library';
          setAddMenuOpen(false);
        }}
        style={styles.addMenuItem}
        titleStyle={styles.addMenuTitle}
        theme={addMenuItemTheme}
        rippleColor={colors.accentMuted}
      />
    </Menu>
  );

  if (!screenId || Number.isNaN(screenId)) {
    return <StateScreen title={t('playlist.notFound')} message={t('playlist.notFoundMessage')} />;
  }

  if (editorQuery.isLoading) {
    return <StateScreen loading title={t('playlist.editTitle')} message={t('playlist.loading')} />;
  }

  if (editorQuery.isError || !editorQuery.data) {
    return (
      <StateScreen
        title={t('playlist.notFound')}
        message={t('playlist.loadError')}
        onRetry={() => editorQuery.refetch()}
      />
    );
  }

  return (
    <GalleryShell
      title={t('playlist.editTitle')}
      subtitle={`${editorQuery.data.organizationName} · ${editorQuery.data.screenName}`}
      showBack
      scrollable={false}
      onBackPress={goBack}
      toolbarActions={plusButton}
    >
      <View style={styles.editor}>
        {error ? <MessageBanner text={error} danger /> : null}
        {success && !hasUnsavedChanges ? <MessageBanner text={success} /> : null}
        {uploadProgress ? (
          <View style={styles.progressBanner}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.progressText}>
              {t('playlist.loadingProgress', { current: uploadProgress.done + 1 > uploadProgress.total ? uploadProgress.total : uploadProgress.done + 1, total: uploadProgress.total })}
            </Text>
          </View>
        ) : null}

        <DraggableFlatList
          data={displayedItems}
          keyExtractor={(item) => item.key}
          activationDistance={8}
          autoscrollThreshold={72}
          containerStyle={styles.list}
          contentContainerStyle={displayedItems.length ? styles.listContent : styles.emptyListContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="playlist-plus" color={colors.accent} size={38} />
              <Text style={styles.emptyTitle}>{t('playlist.emptyTitle')}</Text>
              <Text style={styles.emptyText}>{t('playlist.emptySubtitle')}</Text>
            </View>
          }
          onDragEnd={({ data }) => {
            setItems(normalizeOrder(data));
            setDirty(true);
            setSuccess(null);
          }}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <View style={[styles.playlistRow, isActive && styles.playlistRowActive]}>
                <MediaThumbnail uri={item.thumbnailUrl} type={item.type} style={styles.thumbnail} />
                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemMeta}>
                    {item.type === 'Graphic'
                      ? t('playlist.imageDuration', {
                          seconds: item.displayDurationSeconds ?? 15,
                          compact: formatDuration(item.displayDurationSeconds ?? 15) ?? '00:15',
                        })
                      : `${t('playlist.mediaVideo')} · ${formatDuration(item.duration) ?? t('playlist.durationAuto')}`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('playlist.moveA11y', { name: item.title })}
                  onLongPress={drag}
                  onPressIn={drag}
                  style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="drag-vertical" color={colors.textMuted} size={25} />
                </Pressable>
                <Menu
                  visible={itemMenuId === item.key}
                  onDismiss={() => setItemMenuId(null)}
                  contentStyle={styles.itemMenu}
                  anchor={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('playlist.actionsA11y', { name: item.title })}
                      onPress={() => setItemMenuId(item.key)}
                      style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
                    >
                      <MaterialCommunityIcons name="dots-vertical" color={colors.textPrimary} size={23} />
                    </Pressable>
                  }
                >
                  {displayedItems.length >= 2 && item.type === 'Graphic' ? (
                    <Menu.Item
                      leadingIcon="timer-edit-outline"
                      title={t('playlist.changeDisplayTime')}
                      onPress={() => {
                        setItemMenuId(null);
                        setDurationItem(item);
                      }}
                      style={styles.itemMenuRow}
                      titleStyle={styles.itemMenuTitle}
                      theme={addMenuItemTheme}
                      rippleColor={colors.accentMuted}
                    />
                  ) : null}
                  <Menu.Item
                    leadingIcon="trash-can-outline"
                    title={t('common.delete')}
                    onPress={() => requestDelete(item)}
                    style={styles.itemMenuRow}
                    titleStyle={styles.itemMenuTitle}
                    theme={addMenuItemTheme}
                    rippleColor={colors.dangerMuted}
                  />
                </Menu>
              </View>
            </ScaleDecorator>
          )}
        />

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={!hasUnsavedChanges || saveMutation.isPending}
            onPress={save}
            style={({ pressed }) => [
              styles.saveButton,
              (!hasUnsavedChanges || saveMutation.isPending) && styles.saveButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color={colors.onAccent} size="small" />
            ) : (
              <Text style={styles.saveText}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>
      </View>
      <DisplayDurationDialog
        item={durationItem}
        onClose={() => setDurationItem(null)}
        onSave={saveDuration}
      />
    </GalleryShell>
  );
}

function MessageBanner({ text, danger = false }: { text: string; danger?: boolean }) {
  const { colors, radius } = useAppTheme();
  const styles = createStyles(colors, radius.lg, radius.xl);
  return (
    <View style={[styles.messageBanner, danger && styles.messageBannerDanger]}>
      <MaterialCommunityIcons
        name={danger ? 'alert-circle-outline' : 'check-circle-outline'}
        color={danger ? colors.danger : colors.success}
        size={18}
      />
      <Text style={[styles.messageText, danger && styles.messageTextDanger]}>{text}</Text>
    </View>
  );
}

function StateScreen({
  title,
  message,
  loading = false,
  onRetry,
}: {
  title: string;
  message: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.xl);
  return (
    <GalleryShell title={title} showBack onBackPress={() => router.replace('/')}>
      <View style={styles.stateCard}>
        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : (
          <MaterialCommunityIcons name="monitor-off" color={colors.danger} size={38} />
        )}
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{message}</Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        ) : null}
      </View>
    </GalleryShell>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusXl: number) => StyleSheet.create({
  editor: { flex: 1, minHeight: 0 },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: radiusXl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  addMenu: {
    paddingVertical: 6,
    borderRadius: radiusLg,
    borderWidth: 1,
    borderColor: colors.accentPressed,
    backgroundColor: colors.surface,
    boxShadow: colors.shadowSoft,
  },
  addMenuItem: {
    height: 52,
  },
  addMenuTitle: {
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 15,
  },
  itemMenu: { paddingVertical: 6, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, boxShadow: colors.shadowSoft },
  itemMenuRow: { height: 50 },
  itemMenuTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  list: { flex: 1 },
  listContent: { gap: 10, paddingTop: 16, paddingBottom: 18 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  playlistRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 10,
    borderRadius: radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  playlistRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
    boxShadow: colors.shadowSoft,
  },
  thumbnail: { width: 112, height: 70, borderRadius: 11 },
  itemCopy: { minWidth: 0, flex: 1, gap: 5 },
  itemTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 15 },
  itemMeta: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 12 },
  rowAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.accent,
  },
  saveButtonDisabled: { opacity: 0.36 },
  saveText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  messageBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.successMuted,
  },
  messageBannerDanger: { backgroundColor: colors.dangerMuted },
  messageText: { flex: 1, color: colors.success, fontFamily: brandFonts.body, fontSize: 12 },
  messageTextDanger: { color: colors.danger },
  progressBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  progressText: { color: colors.textPrimary, fontFamily: brandFonts.body, fontSize: 12 },
  emptyState: { alignItems: 'center', gap: 8, padding: 28 },
  emptyTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 18 },
  emptyText: {
    maxWidth: 420,
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
  stateCard: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  retryButton: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radiusXl, backgroundColor: colors.accent },
  retryText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  pressed: { opacity: 0.7 },
});
