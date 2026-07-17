import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native-paper';

import { GalleryShell } from '../../../features/media-points/GalleryShell';
import { useAddVideoUrl, usePlaylistEditor } from '../../../features/screen-playlist/hooks';
import { MediaThumbnail } from '../../../features/screen-playlist/MediaThumbnail';
import { buildUrlPreview } from '../../../features/screen-playlist/model';
import { useProtectedRoute } from '../../../hooks/useProtectedRoute';
import { brandFonts, palette } from '../../../theme';

type ScreenParams = { id?: string };

export default function AddPlaylistUrlScreen() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams<ScreenParams>();
  const screenId = params.id ? Number(params.id) : null;
  const editorQuery = usePlaylistEditor(screenId);
  const addMutation = useAddVideoUrl(screenId ?? 0);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const previewResult = useMemo(() => {
    if (!url.trim()) return { preview: null, error: null };
    try {
      return { preview: buildUrlPreview(url), error: null };
    } catch (error) {
      return { preview: null, error: error instanceof Error ? error.message : 'Некорректная ссылка' };
    }
  }, [url]);

  const save = () => {
    setSubmitted(true);
    setApiError(null);
    if (!screenId || !previewResult.preview) return;
    addMutation.mutate(
      { url, title: title.trim() || previewResult.preview.title },
      {
        onSuccess: () => router.back(),
        onError: (error) => setApiError(error instanceof Error ? error.message : 'Не удалось добавить ссылку'),
      },
    );
  };

  const validationError = submitted && !url.trim()
    ? 'Введите ссылку на видео'
    : previewResult.error;
  const subtitle = editorQuery.data
    ? `${editorQuery.data.organizationName} · ${editorQuery.data.screenName}`
    : 'Добавление видео';

  return (
    <GalleryShell title="Добавить по ссылке" subtitle={subtitle} showBack>
      <View style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ссылка на видео</Text>
          <View style={[styles.inputFrame, validationError && styles.inputFrameError]}>
            <MaterialCommunityIcons name="link-variant" color={palette.muted} size={21} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://youtube.com/watch?v=…"
              placeholderTextColor={palette.muted}
              value={url}
              onChangeText={(value) => {
                setUrl(value);
                setSubmitted(false);
                setApiError(null);
              }}
              style={styles.input}
            />
          </View>
          {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
          <Text style={styles.hint}>YouTube, Vimeo, TikTok и прямые ссылки на видео.</Text>
        </View>

        {previewResult.preview ? (
          <View style={styles.previewCard}>
            <MediaThumbnail uri={previewResult.preview.thumbnailUrl} type="Video" style={styles.previewImage} />
            <View style={styles.previewCopy}>
              <Text style={styles.previewLabel}>Предпросмотр · {previewResult.preview.sourceLabel}</Text>
              <TextInput
                placeholder={previewResult.preview.title}
                placeholderTextColor={palette.muted}
                value={title}
                onChangeText={setTitle}
                style={styles.titleInput}
              />
            </View>
          </View>
        ) : (
          <View style={styles.previewPlaceholder}>
            <MaterialCommunityIcons name="video-outline" color={palette.gold} size={34} />
            <Text style={styles.placeholderText}>После корректной ссылки здесь появится превью.</Text>
          </View>
        )}

        {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={addMutation.isPending || !previewResult.preview}
        onPress={save}
        style={({ pressed }) => [
          styles.saveButton,
          (addMutation.isPending || !previewResult.preview) && styles.saveButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        {addMutation.isPending ? (
          <ActivityIndicator color={palette.ink} size="small" />
        ) : (
          <Text style={styles.saveText}>Добавить в плейлист</Text>
        )}
      </Pressable>
    </GalleryShell>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: 22,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3037',
    backgroundColor: palette.panel,
  },
  fieldGroup: { gap: 8 },
  label: { color: palette.cream, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  inputFrame: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3B3E46',
    backgroundColor: palette.panelRaised,
  },
  inputFrameError: { borderColor: palette.danger },
  input: { minWidth: 0, flex: 1, color: palette.cream, fontFamily: brandFonts.body, fontSize: 14 },
  hint: { color: palette.muted, fontFamily: brandFonts.body, fontSize: 11 },
  errorText: { color: palette.danger, fontFamily: brandFonts.body, fontSize: 12 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: palette.panelRaised,
  },
  previewImage: { width: 150, height: 92, borderRadius: 12 },
  previewCopy: { minWidth: 0, flex: 1, gap: 7 },
  previewLabel: { color: palette.gold, fontFamily: brandFonts.bodyEmphasis, fontSize: 11 },
  titleInput: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 14,
    backgroundColor: palette.panel,
  },
  previewPlaceholder: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3B3E46',
  },
  placeholderText: { color: palette.muted, fontFamily: brandFonts.body, fontSize: 12, textAlign: 'center' },
  saveButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: palette.gold,
  },
  saveButtonDisabled: { opacity: 0.36 },
  saveText: { color: palette.ink, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  pressed: { opacity: 0.72 },
});
