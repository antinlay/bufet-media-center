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
import { useAppTheme } from '../../../providers/AppThemeProvider';
import { useI18n } from '../../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../../theme';

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
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.pill);

  const previewResult = useMemo(() => {
    if (!url.trim()) return { preview: null, error: null };
    try {
      return { preview: buildUrlPreview(url, t('mediaUrl.linkedVideoSource')), error: null };
    } catch {
      return { preview: null, error: t('mediaUrl.invalid') };
    }
  }, [t, url]);

  const save = () => {
    setSubmitted(true);
    setApiError(null);
    if (!screenId || !previewResult.preview) return;
    addMutation.mutate(
      { url, title: title.trim() || previewResult.preview.title },
      {
        onSuccess: () => router.back(),
        onError: () => setApiError(t('mediaUrl.addError')),
      },
    );
  };

  const validationError = submitted && !url.trim()
    ? t('mediaUrl.invalid')
    : previewResult.error;
  const subtitle = editorQuery.data
    ? `${editorQuery.data.organizationName} · ${editorQuery.data.screenName}`
    : t('mediaUrl.fallbackSubtitle');

  return (
    <GalleryShell title={t('mediaUrl.title')} subtitle={subtitle} showBack>
      <View style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('mediaUrl.linkLabel')}</Text>
          <View style={[styles.inputFrame, validationError && styles.inputFrameError]}>
            <MaterialCommunityIcons name="link-variant" color={colors.textMuted} size={21} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://youtube.com/watch?v=…"
              placeholderTextColor={colors.textMuted}
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
          <Text style={styles.hint}>{t('mediaUrl.hint')}</Text>
        </View>

        {previewResult.preview ? (
          <View style={styles.previewCard}>
            <MediaThumbnail uri={previewResult.preview.thumbnailUrl} type="Video" style={styles.previewImage} />
            <View style={styles.previewCopy}>
              <Text style={styles.previewLabel}>{t('mediaUrl.previewWithSource', { source: previewResult.preview.sourceLabel })}</Text>
              <TextInput
                placeholder={previewResult.preview.title}
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                style={styles.titleInput}
              />
            </View>
          </View>
        ) : (
          <View style={styles.previewPlaceholder}>
            <MaterialCommunityIcons name="video-outline" color={colors.accent} size={34} />
            <Text style={styles.placeholderText}>{t('mediaUrl.previewPlaceholder')}</Text>
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
          <ActivityIndicator color={colors.onAccent} size="small" />
        ) : (
          <Text style={styles.saveText}>{t('mediaUrl.submit')}</Text>
        )}
      </Pressable>
    </GalleryShell>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusPill: number) => StyleSheet.create({
  formCard: {
    gap: 22,
    padding: 20,
    borderRadius: radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldGroup: { gap: 8 },
  label: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  inputFrame: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
  },
  inputFrameError: { borderColor: colors.danger },
  input: { minWidth: 0, flex: 1, color: colors.textPrimary, fontFamily: brandFonts.body, fontSize: 14 },
  hint: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 11 },
  errorText: { color: colors.danger, fontFamily: brandFonts.body, fontSize: 12 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: radiusLg,
    backgroundColor: colors.surfaceElevated,
  },
  previewImage: { width: 150, height: 92, borderRadius: 12 },
  previewCopy: { minWidth: 0, flex: 1, gap: 7 },
  previewLabel: { color: colors.accent, fontFamily: brandFonts.bodyEmphasis, fontSize: 11 },
  titleInput: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 14,
    backgroundColor: colors.surface,
  },
  previewPlaceholder: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: radiusLg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  placeholderText: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 12, textAlign: 'center' },
  saveButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radiusPill,
    backgroundColor: colors.accent,
  },
  saveButtonDisabled: { opacity: 0.36 },
  saveText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  pressed: { opacity: 0.72 },
});
