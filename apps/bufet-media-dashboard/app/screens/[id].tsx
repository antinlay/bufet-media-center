import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { TextInput } from '../../components/TextInput';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DraggableFlatList from 'react-native-draggable-flatlist';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiBaseUrl, apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import type { ConcertoPlaylistItem } from '@bufet/shared';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

type ScreenParams = {
  id?: string;
};

type MediaFormState = {
  open: boolean;
  mode: 'upload' | 'library';
  type: 'Graphic' | 'Video';
  source: 'url' | 'file';
  name: string;
  duration: string;
  url: string;
  file: DocumentPicker.DocumentPickerAsset | null;
  error: string | null;
  selectedContentId: number | null;
  selectedContentType: 'Graphic' | 'Video' | null;
  libraryDuration: string;
};

const emptyForm: MediaFormState = {
  open: false,
  mode: 'upload',
  type: 'Graphic',
  source: 'url',
  name: '',
  duration: '15',
  url: '',
  file: null,
  error: null,
  selectedContentId: null,
  selectedContentType: null,
  libraryDuration: '15',
};

function isAbsoluteUrl(url?: string | null) {
  return Boolean(url && /^(https?:)?\/\//i.test(url));
}

function resolveMediaUrl(url?: string | null) {
  if (!url) return undefined;
  return isAbsoluteUrl(url) ? url : `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function ScreenEditor() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams<ScreenParams>();
  const screenId = params.id ? Number(params.id) : null;
  const queryClient = useQueryClient();

  const screenQuery = useQuery({
    queryKey: ['screen', screenId],
    queryFn: () => apiClient.getScreen(screenId as number),
    enabled: Boolean(screenId),
  });

  const playlistQuery = useQuery({
    queryKey: ['screen-playlist', screenId],
    queryFn: () => apiClient.getScreenPlaylist(screenId as number),
    enabled: Boolean(screenId),
  });

  const contentsQuery = useQuery({
    queryKey: ['contents'],
    queryFn: () => apiClient.getContents(),
  });

  const screensListQuery = useQuery({
    queryKey: ['screens'],
    queryFn: () => apiClient.getScreens(),
  });

  const [screenName, setScreenName] = useState('');
  const [form, setForm] = useState<MediaFormState>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<number, string>>({});
  const [orderedItems, setOrderedItems] = useState<ConcertoPlaylistItem[]>([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [sourceScreenId, setSourceScreenId] = useState<number | null>(null);
  const [imageSizes, setImageSizes] = useState<Record<number, { width: number; height: number }>>({});

  useEffect(() => {
    if (screenQuery.data?.name) {
      setScreenName(screenQuery.data.name);
    }
  }, [screenQuery.data?.name]);

  useEffect(() => {
    const items = [...(playlistQuery.data?.items ?? [])].sort((a, b) => {
      const aPos = a.position ?? a.order ?? 0;
      const bPos = b.position ?? b.order ?? 0;
      return aPos - bPos;
    });
    setOrderedItems(items);
    const map: Record<number, string> = {};
    items.forEach((item) => {
      map[item.submissionId] = String(item.duration ?? 15);
    });
    setDurations(map);
  }, [playlistQuery.data?.items]);

  const updateScreenMutation = useMutation({
    mutationFn: () => apiClient.updateScreen(screenId as number, { name: screenName }),
    onSuccess: (data) => {
      queryClient.setQueryData(['screen', screenId], data);
      queryClient.invalidateQueries({ queryKey: ['screens'] });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async () => {
      if (!screenId) throw new Error('Экран не найден');

      // library path
      if (form.mode === 'library') {
        if (!form.selectedContentId) throw new Error('Выберите медиа из библиотеки');
        const durationNumber = form.selectedContentType === 'Graphic' && form.libraryDuration
          ? Number(form.libraryDuration)
          : undefined;
        return apiClient.addContentToScreenPlaylist(screenId, form.selectedContentId, durationNumber);
      }

      // upload path -> always go through contents
      if (form.type === 'Graphic' && !form.file) throw new Error('Выберите изображение');
      if (form.type === 'Video' && form.source === 'url' && !form.url) {
        throw new Error('Укажите ссылку на видео');
      }
      if (form.type === 'Video' && form.source === 'file' && !form.file) {
        throw new Error('Выберите видеофайл');
      }
      if (form.type === 'Video' && form.source === 'file' && form.file?.size && form.file.size > 100 * 1024 * 1024) {
        throw new Error('Видео больше 100MB');
      }

      // try find existing in contents
      const contents = contentsQuery.data ?? [];
      const existing = contents.find((c) => {
        if (c.type !== form.type) return false;
        if (form.type === 'Graphic') {
          return form.name && c.name === form.name;
        }
        if (form.type === 'Video') {
          return form.source === 'url' ? c.url === form.url : c.name === form.name;
        }
        return false;
      });

      let contentId = existing?.id;

      if (!contentId) {
        const payload: any = {
          type: form.type,
          name: form.name || undefined,
          duration: form.type === 'Graphic' && form.duration ? Number(form.duration) : undefined,
          url: form.type === 'Video' && form.source === 'url' ? form.url : undefined,
        };
        const file = form.file
          ? {
              uri: form.file.uri,
              name: form.file.name ?? 'upload',
              type: form.file.mimeType ?? 'application/octet-stream',
            }
          : undefined;
        const created = await apiClient.createContent(payload, file);
        contentId = created.id;
        await queryClient.invalidateQueries({ queryKey: ['contents'] });
      }

      const durationNumber = form.type === 'Graphic' && form.duration ? Number(form.duration) : undefined;
      return apiClient.addContentToScreenPlaylist(screenId, contentId, durationNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-playlist', screenId] });
      setForm({ ...emptyForm, open: false });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Не удалось добавить медиа';
      setForm((prev) => ({ ...prev, error: message }));
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ submissionId, payload }: { submissionId: number; payload: { name?: string; duration?: number } }) =>
      apiClient.updateScreenPlaylistItem(screenId as number, submissionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['screen-playlist', screenId] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (submissionId: number) => apiClient.deleteScreenPlaylistItem(screenId as number, submissionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['screen-playlist', screenId] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => apiClient.reorderScreenPlaylist(screenId as number, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['screen-playlist', screenId] }),
  });

  const applyPlaylistMutation = useMutation({
    mutationFn: () => apiClient.applyScreenPlaylist(screenId as number, sourceScreenId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-playlist', screenId] });
      setApplyModalOpen(false);
      setSourceScreenId(null);
    },
  });

  const items = orderedItems;

  const headerSubtitle = useMemo(() => {
    if (screenQuery.isLoading) return 'Загружаем экран…';
    return 'Список медиа‑блоков. Тяните за иконку ≡, чтобы менять порядок.';
  }, [screenQuery.isLoading]);

  const libraryItems = useMemo(() => {
    const all = contentsQuery.data ?? [];
    return all.filter((item) => item.type === 'Graphic' || item.type === 'Video');
  }, [contentsQuery.data]);

  const availableScreens = useMemo(() => {
    const screens = screensListQuery.data ?? [];
    return screens.filter((s) => s.id !== screenId);
  }, [screensListQuery.data, screenId]);

  const contentById = useMemo(() => {
    const map: Record<number, any> = {};
    (contentsQuery.data ?? []).forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [contentsQuery.data]);

  const formatDuration = (seconds?: number | null) => {
    if (!seconds || !Number.isFinite(seconds)) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!screenId) {
    return (
      <AppShell title="Экран" subtitle="Экран не найден.">
        <EmptyState title="Нет данных" subtitle="Проверьте ссылку на экран." />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Экран"
      subtitle={headerSubtitle}
      actions={
        <View style={styles.headerActions}>
          <Button mode="outlined" onPress={() => router.push('/scan')}>
            Сканировать QR
          </Button>
          <Button mode="contained" onPress={() => setForm((prev) => ({ ...prev, open: true }))}>
            Добавить медиа
          </Button>
        </View>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Название экрана</Text>
        <TextInput
          label="Экран"
          value={screenName}
          onChangeText={setScreenName}
          onBlur={() => {
            if (screenName && screenName !== screenQuery.data?.name) {
              updateScreenMutation.mutate();
            }
          }}
          style={styles.input}
        />
      </BrandCard>

      <Section
        title="Плейлист"
        subtitle="Медиа‑блоки идут сверху вниз. Тяните за иконку ≡, чтобы упорядочить."
        actions={
          <View style={styles.sectionActions}>
            <Button mode="outlined" onPress={() => setApplyModalOpen(true)}>
              Применить плейлист экрана
            </Button>
          </View>
        }
      >
        {items.length === 0 ? (
          <EmptyState title="Плейлист пуст" subtitle="Добавьте изображения или видео, чтобы начать показ." />
        ) : (
          <DraggableFlatList
            data={items}
            keyExtractor={(item) => String(item.submissionId)}
            activationDistance={8}
            autoscrollThreshold={64}
            onDragEnd={({ data }) => {
              const normalized = data.map((item, index) => ({
                ...item,
                position: index,
                order: index,
              }));
              setOrderedItems(normalized);
              reorderMutation.mutate(normalized.map((item) => item.submissionId));
            }}
            renderItem={({ item, drag, isActive }) => {
              const content = contentById[item.contentId ?? -1];
              const mediaUrl =
                resolveMediaUrl(item.mediaUrl) ??
                resolveMediaUrl((item as any).url) ??
                resolveMediaUrl(content?.url) ??
                resolveMediaUrl(content?.imageUrl);
              const thumbnailUrl =
                resolveMediaUrl(item.thumbnailUrl) ??
                resolveMediaUrl((item as any).thumbnailUrl) ??
                resolveMediaUrl(content?.thumbnailUrl) ??
                resolveMediaUrl(content?.imageUrl) ??
                mediaUrl;
              const durationValue = durations[item.submissionId] ?? String(item.duration ?? 15);
              const isVideo = item.type === 'Video';

              return (
                <Pressable
                  disabled={isActive}
                  style={[styles.mediaCard, isActive && styles.mediaCardActive]}
                >
                  <Pressable onPressIn={drag} style={styles.dragHandle}>
                    <MaterialCommunityIcons name="drag-vertical" size={24} color={palette.slate} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (isVideo) {
                        if (mediaUrl) {
                          if (Platform.OS === 'web') {
                            window.open(mediaUrl, '_blank');
                          } else {
                            Linking.openURL(mediaUrl);
                          }
                        }
                      } else if (thumbnailUrl) {
                        setPreviewUrl(thumbnailUrl);
                      }
                    }}
                  >
                    {thumbnailUrl ? (
                      <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <MaterialCommunityIcons name={isVideo ? 'video' : 'image'} size={28} color={palette.goldDeep} />
                      </View>
                    )}
                  </Pressable>

                  <View style={styles.mediaInfo}>
                    <Text style={styles.mediaTitle}>{item.name ?? (isVideo ? 'Видео' : 'Изображение')}</Text>
                    <Text style={styles.mediaMeta}>Тип: {isVideo ? 'Видео' : 'Картинка'}</Text>
                    {isVideo ? (
                      <Text style={styles.mediaMeta}>Длительность: авто</Text>
                    ) : (
                      <TextInput
                        label="Длительность (сек)"
                        value={durationValue}
                        keyboardType="numeric"
                        onChangeText={(value) => setDurations((prev) => ({ ...prev, [item.submissionId]: value }))}
                        onBlur={() => {
                          const parsed = Number(durationValue);
                          if (Number.isFinite(parsed) && parsed > 0 && parsed !== item.duration) {
                            updateItemMutation.mutate({ submissionId: item.submissionId, payload: { duration: parsed } });
                          }
                        }}
                        style={styles.durationInput}
                      />
                    )}
                  </View>

                  <View style={styles.mediaActions}>
                    <IconButton
                      icon="trash-can-outline"
                      onPress={() => deleteItemMutation.mutate(item.submissionId)}
                    />
                  </View>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Section>

      <Modal visible={Boolean(previewUrl)} transparent animationType="fade">
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewUrl(null)}>
          {previewUrl ? <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>

      <Modal visible={form.open} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setForm({ ...emptyForm, open: false })}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Добавить медиа</Text>
            <View style={styles.modalTypeRow}>
              <Button
                mode={form.mode === 'upload' ? 'contained' : 'outlined'}
                onPress={() => setForm((prev) => ({ ...emptyForm, open: true, mode: 'upload' }))}
              >
                Загрузить
              </Button>
              <Button
                mode={form.mode === 'library' ? 'contained' : 'outlined'}
                onPress={() => setForm((prev) => ({ ...emptyForm, open: true, mode: 'library' }))}
              >
                Библиотека
              </Button>
            </View>
            {form.mode === 'upload' ? (
              <View style={styles.modalTypeRow}>
                <Button
                  mode={form.type === 'Graphic' ? 'contained' : 'outlined'}
                  onPress={() => setForm((prev) => ({ ...prev, type: 'Graphic', source: 'url', file: null, url: '', error: null }))}
                  >
                  Картинка
                </Button>
                <Button
                  mode={form.type === 'Video' && form.source === 'url' ? 'contained' : 'outlined'}
                  onPress={() => setForm((prev) => ({ ...prev, type: 'Video', source: 'url', file: null, error: null }))}
                >
                  Видео (URL)
                </Button>
                <Button
                  mode={form.type === 'Video' && form.source === 'file' ? 'contained' : 'outlined'}
                  onPress={() => setForm((prev) => ({ ...prev, type: 'Video', source: 'file', url: '', error: null }))}
                >
                  Видео (файл до 100MB)
                </Button>
              </View>
            ) : null}
            {form.error ? <Text style={styles.errorText}>{form.error}</Text> : null}
            {form.mode === 'upload' ? (
              <>
                <TextInput
                  label="Название"
                  value={form.name}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                  style={styles.input}
                />
                {form.type === 'Graphic' ? (
                  <TextInput
                    label="Длительность (сек)"
                    value={form.duration}
                    keyboardType="numeric"
                    onChangeText={(value) => setForm((prev) => ({ ...prev, duration: value }))}
                    style={styles.input}
                  />
                ) : (
                  <Text style={styles.mediaMeta}>Длительность видео берётся автоматически.</Text>
                )}
                {form.type === 'Graphic' ? (
                  <Button
                    mode="outlined"
                    onPress={async () => {
                      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
                      if (!result.canceled) {
                        setForm((prev) => ({ ...prev, file: result.assets[0], error: null }));
                      }
                    }}
                  >
                    {form.file ? `Файл: ${form.file.name}` : 'Выбрать изображение'}
                  </Button>
                ) : form.source === 'file' ? (
                  <Button
                    mode="outlined"
                    onPress={async () => {
                      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
                      if (!result.canceled) {
                        const asset = result.assets[0];
                        if (asset?.size && asset.size > 100 * 1024 * 1024) {
                          setForm((prev) => ({ ...prev, file: null, error: 'Видео больше 100MB' }));
                        } else {
                          setForm((prev) => ({ ...prev, file: asset, error: null }));
                        }
                      }
                    }}
                  >
                    {form.file ? `Файл: ${form.file.name}` : 'Выбрать видео (до 100MB)'}
                  </Button>
                ) : (
                  <TextInput
                    label="URL видео"
                    value={form.url}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, url: value }))}
                    style={styles.input}
                  />
                )}
              </>
            ) : (
              <>
                <Text style={styles.mediaMeta}>Выберите медиа из библиотеки</Text>
                <View style={styles.libraryWrapper}>
                  <FlatList
                    data={libraryItems}
                    numColumns={3}
                    keyExtractor={(item) => String(item.id)}
                    columnWrapperStyle={styles.libraryRow}
                    contentContainerStyle={styles.libraryList}
                    scrollEnabled
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    renderItem={({ item }) => {
                      const selected = form.selectedContentId === item.id;
                      const thumb = item.thumbnailUrl ?? item.imageUrl ?? item.url ?? undefined;
                      if (item.type === 'Graphic' && thumb && !imageSizes[item.id]) {
                        Image.getSize(
                          resolveMediaUrl(thumb) ?? thumb,
                          (width, height) => setImageSizes((prev) => ({ ...prev, [item.id]: { width, height } })),
                          () => undefined,
                        );
                      }
                      const badgeText =
                        item.type === 'Video'
                          ? formatDuration(item.duration)
                          : imageSizes[item.id]
                            ? `${imageSizes[item.id].width}×${imageSizes[item.id].height}`
                            : '…';
                      return (
                        <Pressable
                          onPress={() =>
                            setForm((prev) => ({
                              ...prev,
                              selectedContentId: item.id,
                              selectedContentType: item.type as 'Graphic' | 'Video',
                              libraryDuration:
                                item.type === 'Graphic'
                                  ? prev.libraryDuration || String(item.duration ?? 15)
                                  : prev.libraryDuration,
                              error: null,
                            }))
                          }
                          style={[styles.libraryCard, selected && styles.libraryCardSelected]}
                        >
                          {thumb ? (
                            <Image source={{ uri: resolveMediaUrl(thumb) }} style={styles.libraryThumb} />
                          ) : (
                            <View style={styles.libraryThumbPlaceholder}>
                              <MaterialCommunityIcons
                                name={item.type === 'Video' ? 'video' : 'image'}
                                size={24}
                                color={palette.goldDeep}
                              />
                            </View>
                          )}
                          <View style={styles.libraryBadge}>
                            <Text style={styles.libraryBadgeText}>{badgeText}</Text>
                          </View>
                          <Text style={styles.libraryName} numberOfLines={1}>
                            {item.name ?? `#${item.id}`}
                          </Text>
                          <Text style={styles.libraryMeta}>{item.type === 'Video' ? 'Видео' : 'Картинка'}</Text>
                        </Pressable>
                      );
                    }}
                  />
                </View>
                {form.selectedContentType === 'Graphic' ? (
                  <TextInput
                    label="Длительность (сек)"
                    value={form.libraryDuration}
                    keyboardType="numeric"
                    onChangeText={(value) => setForm((prev) => ({ ...prev, libraryDuration: value }))}
                    style={styles.input}
                  />
                ) : null}
              </>
            )}
            <View style={styles.modalActions}>
              <Button mode="text" onPress={() => setForm({ ...emptyForm, open: false })}>
                Отмена
              </Button>
              <Button mode="contained" onPress={() => createItemMutation.mutate()} loading={createItemMutation.isPending}>
                Добавить
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={applyModalOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setApplyModalOpen(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Применить плейлист другого экрана</Text>
            {availableScreens.length === 0 ? (
              <Text style={styles.mediaMeta}>Других экранов пока нет.</Text>
            ) : (
              <FlatList
                data={availableScreens}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.applyScreenRow, sourceScreenId === item.id && styles.libraryCardSelected]}
                    onPress={() => setSourceScreenId(item.id)}
                  >
                    <Text style={styles.mediaTitle}>{item.name}</Text>
                    <Text style={styles.mediaMeta}>ID: {item.id}</Text>
                  </Pressable>
                )}
              />
            )}
            <View style={styles.modalActions}>
              <Button mode="text" onPress={() => setApplyModalOpen(false)}>
                Отмена
              </Button>
              <Button
                mode="contained"
                disabled={!sourceScreenId}
                loading={applyPlaylistMutation.isPending}
                onPress={() => applyPlaylistMutation.mutate()}
              >
                Применить
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  listContent: {
    gap: 12,
  },
  sectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  mediaCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#F1E6D6',
    alignItems: 'center',
  },
  mediaCardActive: {
    borderColor: palette.goldDeep,
    backgroundColor: '#FFF7E5',
  },
  dragHandle: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  thumbnail: {
    width: 96,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3EDE3',
  },
  thumbnailPlaceholder: {
    width: 96,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaInfo: {
    flex: 1,
  },
  mediaTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 16,
    color: palette.charcoal,
  },
  mediaMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
  durationInput: {
    backgroundColor: '#FFFDF9',
    marginTop: 8,
  },
  mediaActions: {
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 8, 8, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: palette.charcoal,
  },
  modalTypeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    fontFamily: brandFonts.bodyEmphasis,
    color: '#B42318',
  },
  libraryRow: {
    gap: 12,
    marginBottom: 12,
  },
  libraryList: {
    paddingVertical: 8,
  },
  libraryWrapper: {
    maxHeight: 480,
    paddingHorizontal: 4,
  },
  libraryCard: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#F1E6D6',
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },
  libraryCardSelected: {
    borderColor: palette.goldDeep,
    backgroundColor: '#FFF7E5',
  },
  libraryThumb: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: '#F3EDE3',
  },
  libraryThumbPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: '#F3EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  libraryBadgeText: {
    fontFamily: brandFonts.body,
    color: '#FFFDF9',
    fontSize: 12,
  },
  libraryName: {
    fontFamily: brandFonts.bodyEmphasis,
    color: palette.charcoal,
  },
  libraryMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    fontSize: 12,
  },
  applyScreenRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1E6D6',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
