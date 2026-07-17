import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Menu, Text } from 'react-native-paper';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

import { GalleryShell } from '../../features/media-points/GalleryShell';
import {
  useDeletePlaylistItem,
  usePlaylistEditor,
  useSavePlaylistOrder,
  useUploadPlaylistFiles,
} from '../../features/screen-playlist/hooks';
import { MediaThumbnail } from '../../features/screen-playlist/MediaThumbnail';
import { formatDuration, type PlaylistItemViewModel } from '../../features/screen-playlist/model';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { pickMediaFiles } from '../../lib/upload';
import { brandFonts, palette } from '../../theme';

type ScreenParams = { id?: string };

function normalizeOrder(items: PlaylistItemViewModel[]) {
  return items.map((item, position) => ({ ...item, position }));
}

function mergeServerItems(current: PlaylistItemViewModel[], server: PlaylistItemViewModel[]) {
  const serverById = new Map(server.map((item) => [item.submissionId, item]));
  const currentIds = new Set(current.map((item) => item.submissionId));
  const kept = current.flatMap((item) => {
    const updated = serverById.get(item.submissionId);
    return updated ? [{ ...updated, position: item.position }] : [];
  });
  const added = server.filter((item) => !currentIds.has(item.submissionId));
  return normalizeOrder([...kept, ...added]);
}

export default function PlaylistEditorScreen() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams<ScreenParams>();
  const screenId = params.id ? Number(params.id) : null;
  const editorQuery = usePlaylistEditor(screenId);
  const uploadMutation = useUploadPlaylistFiles(screenId ?? 0);
  const saveMutation = useSavePlaylistOrder(screenId ?? 0);
  const deleteMutation = useDeletePlaylistItem(screenId ?? 0);
  const [items, setItems] = useState<PlaylistItemViewModel[]>([]);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [itemMenuId, setItemMenuId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const pendingRouteRef = useRef<'url' | 'library' | null>(null);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

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
    if (!dirty) {
      router.back();
      return;
    }
    const leave = () => router.back();
    if (Platform.OS === 'web') {
      if (window.confirm('Выйти без сохранения порядка?')) leave();
      return;
    }
    Alert.alert('Несохранённые изменения', 'Выйти без сохранения порядка?', [
      { text: 'Остаться', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: leave },
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
            setItems((current) => normalizeOrder([...current, ...added]));
            setDirty(true);
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : 'Не удалось загрузить файлы');
          },
          onSettled: () => setUploadProgress(null),
        },
      );
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Не удалось выбрать файлы');
    }
  };

  const save = () => {
    if (!screenId || !items.length || !dirty) return;
    setError(null);
    setSuccess(null);
    saveMutation.mutate(items, {
      onSuccess: () => {
        setItems((current) => normalizeOrder(current));
        setDirty(false);
        setSuccess('Плейлист сохранён');
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : 'Не удалось сохранить плейлист');
      },
    });
  };

  const requestDelete = (item: PlaylistItemViewModel) => {
    setItemMenuId(null);
    const remove = () => deleteMutation.mutate(item.submissionId, {
      onSuccess: () => {
        setItems((current) => normalizeOrder(current.filter((candidate) => candidate.submissionId !== item.submissionId)));
        setDirty(true);
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : 'Не удалось удалить медиа');
      },
    });
    if (Platform.OS === 'web') {
      if (window.confirm(`Удалить «${item.title}» из плейлиста?`)) remove();
      return;
    }
    Alert.alert('Удалить медиа?', item.title, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: remove },
    ]);
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
          accessibilityLabel="Добавить медиа"
          onPress={() => setAddMenuOpen(true)}
          style={({ pressed }) => [styles.plusButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="plus" color={palette.ink} size={25} />
        </Pressable>
      }
    >
      <Menu.Item
        leadingIcon="cellphone"
        title="С устройства"
        onPress={uploadFromDevice}
        style={styles.addMenuItem}
        titleStyle={styles.addMenuTitle}
        theme={addMenuItemTheme}
        rippleColor="rgba(242, 160, 24, 0.16)"
      />
      <Menu.Item
        leadingIcon="link-variant"
        title="По ссылке"
        onPress={() => {
          pendingRouteRef.current = 'url';
          setAddMenuOpen(false);
        }}
        style={styles.addMenuItem}
        titleStyle={styles.addMenuTitle}
        theme={addMenuItemTheme}
        rippleColor="rgba(242, 160, 24, 0.16)"
      />
      <Menu.Item
        leadingIcon="image-multiple-outline"
        title="Из библиотеки"
        onPress={() => {
          pendingRouteRef.current = 'library';
          setAddMenuOpen(false);
        }}
        style={styles.addMenuItem}
        titleStyle={styles.addMenuTitle}
        theme={addMenuItemTheme}
        rippleColor="rgba(242, 160, 24, 0.16)"
      />
    </Menu>
  );

  if (!screenId || Number.isNaN(screenId)) {
    return <StateScreen title="Экран не найден" message="Проверьте ссылку и вернитесь в галерею." />;
  }

  if (editorQuery.isLoading) {
    return <StateScreen loading title="Редактирование плейлиста" message="Загружаем экран…" />;
  }

  if (editorQuery.isError || !editorQuery.data) {
    return (
      <StateScreen
        title="Экран не найден"
        message={editorQuery.error instanceof Error ? editorQuery.error.message : 'Не удалось загрузить плейлист'}
        onRetry={() => editorQuery.refetch()}
      />
    );
  }

  return (
    <GalleryShell
      title="Редактирование плейлиста"
      subtitle={`${editorQuery.data.organizationName} · ${editorQuery.data.screenName}`}
      showBack
      scrollable={false}
      onBackPress={goBack}
      toolbarActions={plusButton}
    >
      <View style={styles.editor}>
        {error ? <MessageBanner text={error} danger /> : null}
        {success ? <MessageBanner text={success} /> : null}
        {uploadProgress ? (
          <View style={styles.progressBanner}>
            <ActivityIndicator color={palette.gold} size="small" />
            <Text style={styles.progressText}>
              Загружаем {uploadProgress.done + 1 > uploadProgress.total ? uploadProgress.total : uploadProgress.done + 1}
              {' '}из {uploadProgress.total}
            </Text>
          </View>
        ) : null}

        <DraggableFlatList
          data={items}
          keyExtractor={(item) => String(item.submissionId)}
          activationDistance={8}
          autoscrollThreshold={72}
          containerStyle={styles.list}
          contentContainerStyle={items.length ? styles.listContent : styles.emptyListContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="playlist-plus" color={palette.gold} size={38} />
              <Text style={styles.emptyTitle}>Плейлист пуст</Text>
              <Text style={styles.emptyText}>Нажмите +, чтобы добавить изображение или видео.</Text>
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
                    {item.type === 'Video' ? 'Видео' : 'Изображение'} · {formatDuration(item.duration)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Переместить ${item.title}`}
                  onLongPress={drag}
                  onPressIn={drag}
                  style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="drag-vertical" color={palette.muted} size={25} />
                </Pressable>
                <Menu
                  visible={itemMenuId === item.submissionId}
                  onDismiss={() => setItemMenuId(null)}
                  contentStyle={styles.itemMenu}
                  anchor={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Действия с ${item.title}`}
                      onPress={() => setItemMenuId(item.submissionId)}
                      style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
                    >
                      <MaterialCommunityIcons name="dots-vertical" color={palette.cream} size={23} />
                    </Pressable>
                  }
                >
                  <Menu.Item
                    leadingIcon="trash-can-outline"
                    title="Удалить"
                    onPress={() => requestDelete(item)}
                  />
                </Menu>
              </View>
            </ScaleDecorator>
          )}
        />

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={!items.length || !dirty || saveMutation.isPending}
            onPress={save}
            style={({ pressed }) => [
              styles.saveButton,
              (!items.length || !dirty || saveMutation.isPending) && styles.saveButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color={palette.ink} size="small" />
            ) : (
              <Text style={styles.saveText}>Сохранить</Text>
            )}
          </Pressable>
        </View>
      </View>
    </GalleryShell>
  );
}

function MessageBanner({ text, danger = false }: { text: string; danger?: boolean }) {
  return (
    <View style={[styles.messageBanner, danger && styles.messageBannerDanger]}>
      <MaterialCommunityIcons
        name={danger ? 'alert-circle-outline' : 'check-circle-outline'}
        color={danger ? palette.danger : palette.success}
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
  return (
    <GalleryShell title={title} showBack onBackPress={() => router.replace('/')}>
      <View style={styles.stateCard}>
        {loading ? (
          <ActivityIndicator color={palette.gold} size="large" />
        ) : (
          <MaterialCommunityIcons name="monitor-off" color={palette.danger} size={38} />
        )}
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{message}</Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        ) : null}
      </View>
    </GalleryShell>
  );
}

const addMenuItemTheme = {
  colors: {
    onSurface: palette.cream,
    onSurfaceVariant: palette.cream,
  },
};

const styles = StyleSheet.create({
  editor: { flex: 1, minHeight: 0 },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
  },
  addMenu: {
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.goldDeep,
    backgroundColor: palette.panel,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.34)',
  },
  addMenuItem: {
    height: 52,
  },
  addMenuTitle: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 15,
  },
  itemMenu: { backgroundColor: palette.cream },
  list: { flex: 1 },
  listContent: { gap: 10, paddingTop: 16, paddingBottom: 18 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  playlistRow: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2F323A',
    backgroundColor: palette.panel,
  },
  playlistRowActive: {
    borderColor: palette.gold,
    backgroundColor: palette.panelRaised,
    boxShadow: '0 14px 30px rgba(0, 0, 0, 0.34)',
  },
  thumbnail: { width: 112, height: 70, borderRadius: 11 },
  itemCopy: { minWidth: 0, flex: 1, gap: 5 },
  itemTitle: { color: palette.cream, fontFamily: brandFonts.bodyEmphasis, fontSize: 15 },
  itemMeta: { color: palette.muted, fontFamily: brandFonts.body, fontSize: 12 },
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
    borderTopColor: '#2A2D34',
  },
  saveButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: palette.gold,
  },
  saveButtonDisabled: { opacity: 0.36 },
  saveText: { color: palette.ink, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  messageBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(105, 227, 69, 0.1)',
  },
  messageBannerDanger: { backgroundColor: 'rgba(255, 56, 71, 0.12)' },
  messageText: { flex: 1, color: palette.success, fontFamily: brandFonts.body, fontSize: 12 },
  messageTextDanger: { color: palette.danger },
  progressBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.panelRaised,
  },
  progressText: { color: palette.cream, fontFamily: brandFonts.body, fontSize: 12 },
  emptyState: { alignItems: 'center', gap: 8, padding: 28 },
  emptyTitle: { color: palette.cream, fontFamily: brandFonts.bodyEmphasis, fontSize: 18 },
  emptyText: {
    maxWidth: 420,
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
  stateCard: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2D34',
    backgroundColor: palette.panel,
  },
  retryButton: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: palette.gold },
  retryText: { color: palette.ink, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  pressed: { opacity: 0.7 },
});
