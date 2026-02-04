import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
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
  type: 'Graphic' | 'Video';
  name: string;
  duration: string;
  url: string;
  file: DocumentPicker.DocumentPickerAsset | null;
  error: string | null;
};

const emptyForm: MediaFormState = {
  open: false,
  type: 'Graphic',
  name: '',
  duration: '15',
  url: '',
  file: null,
  error: null,
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

  const [screenName, setScreenName] = useState('');
  const [form, setForm] = useState<MediaFormState>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<number, string>>({});
  const [orderedItems, setOrderedItems] = useState<ConcertoPlaylistItem[]>([]);

  useEffect(() => {
    if (screenQuery.data?.name) {
      setScreenName(screenQuery.data.name);
    }
  }, [screenQuery.data?.name]);

  useEffect(() => {
    const items = playlistQuery.data?.items ?? [];
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
      if (form.type === 'Graphic' && !form.file) throw new Error('Выберите изображение');
      if (form.type === 'Video' && !form.url) throw new Error('Укажите ссылку на видео');

      const payload = {
        type: form.type,
        name: form.name || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        url: form.type === 'Video' ? form.url : undefined,
      };

      const file = form.file
        ? { uri: form.file.uri, name: form.file.name ?? 'upload', type: form.file.mimeType ?? 'image/jpeg' }
        : undefined;

      return apiClient.createScreenPlaylistItem(screenId, payload, file);
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

  const items = orderedItems;

  const headerSubtitle = useMemo(() => {
    if (screenQuery.isLoading) return 'Загружаем экран…';
    return 'Список медиа‑блоков. Перетаскивайте, чтобы менять порядок.';
  }, [screenQuery.isLoading]);

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

      <Section title="Плейлист" subtitle="Медиа‑блоки идут сверху вниз.">
        {items.length === 0 ? (
          <EmptyState title="Плейлист пуст" subtitle="Добавьте изображения или видео, чтобы начать показ." />
        ) : (
          <DraggableFlatList
            data={items}
            keyExtractor={(item) => String(item.submissionId)}
            onDragEnd={({ data }) => {
              setOrderedItems(data);
              reorderMutation.mutate(data.map((item) => item.submissionId));
            }}
            renderItem={({ item, drag, isActive }) => {
              const mediaUrl = resolveMediaUrl(item.mediaUrl);
              const thumbnailUrl = resolveMediaUrl(item.thumbnailUrl) ?? mediaUrl;
              const durationValue = durations[item.submissionId] ?? String(item.duration ?? 15);
              const isVideo = item.type === 'Video';

              return (
                <ScaleDecorator>
                  <Pressable
                    onLongPress={drag}
                    disabled={isActive}
                    style={[styles.mediaCard, isActive && styles.mediaCardActive]}
                  >
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
                    </View>

                    <View style={styles.mediaActions}>
                      <IconButton
                        icon="trash-can-outline"
                        onPress={() => deleteItemMutation.mutate(item.submissionId)}
                      />
                    </View>
                  </Pressable>
                </ScaleDecorator>
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
                mode={form.type === 'Graphic' ? 'contained' : 'outlined'}
                onPress={() => setForm((prev) => ({ ...prev, type: 'Graphic' }))}
              >
                Картинка
              </Button>
              <Button
                mode={form.type === 'Video' ? 'contained' : 'outlined'}
                onPress={() => setForm((prev) => ({ ...prev, type: 'Video' }))}
              >
                Видео (URL)
              </Button>
            </View>
            {form.error ? <Text style={styles.errorText}>{form.error}</Text> : null}
            <TextInput
              label="Название"
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              style={styles.input}
            />
            <TextInput
              label="Длительность (сек)"
              value={form.duration}
              keyboardType="numeric"
              onChangeText={(value) => setForm((prev) => ({ ...prev, duration: value }))}
              style={styles.input}
            />
            {form.type === 'Graphic' ? (
              <Button
                mode="outlined"
                onPress={async () => {
                  const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
                  if (!result.canceled) {
                    setForm((prev) => ({ ...prev, file: result.assets[0] }));
                  }
                }}
              >
                {form.file ? `Файл: ${form.file.name}` : 'Выбрать изображение'}
              </Button>
            ) : (
              <TextInput
                label="URL видео"
                value={form.url}
                onChangeText={(value) => setForm((prev) => ({ ...prev, url: value }))}
                style={styles.input}
              />
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
