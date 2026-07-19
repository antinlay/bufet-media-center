import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';
import { MediaThumbnail } from './MediaThumbnail';
import type { PlaylistItemViewModel } from './model';

const PRESETS = [5, 10, 15, 20, 30, 60] as const;

export function DisplayDurationDialog({
  item,
  onClose,
  onSave,
}: {
  item: PlaylistItemViewModel | null;
  onClose: () => void;
  onSave: (seconds: number) => Promise<void>;
}) {
  const [value, setValue] = useState('15');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.xl, radius.pill);

  useEffect(() => {
    if (!item) return;
    setValue(String(item.displayDurationSeconds ?? 15));
    setSaveError(null);
  }, [item]);

  const validationError = useMemo(() => {
    if (!value.trim()) return t('playlist.validationDurationRequired');
    if (!/^\d+$/.test(value.trim())) return t('playlist.validationDurationPositive');
    const seconds = Number(value);
    if (seconds < 1) return t('playlist.validationDurationMin');
    if (seconds > 3600) return t('playlist.validationDurationMax');
    return null;
  }, [t, value]);
  const seconds = validationError ? null : Number(value);

  const submit = async () => {
    if (!seconds || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(seconds);
      onClose();
    } catch {
      setSaveError(t('playlist.displayTimeSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={Boolean(item)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onClose}>
        <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t('playlist.displayTimeTitle')}</Text>
              <Text style={styles.subtitle}>{t('playlist.displayTimeSubtitle')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              disabled={saving}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="close" color={colors.textPrimary} size={22} />
            </Pressable>
          </View>

          {item ? (
            <View style={styles.mediaCard}>
              <MediaThumbnail uri={item.thumbnailUrl} type={item.type} style={styles.thumbnail} />
              <View style={styles.mediaCopy}>
                <Text style={styles.mediaTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.mediaType}>{t('playlist.mediaImage')}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.inputSection}>
            <Text style={styles.label}>{t('playlist.displayTimeSeconds')}</Text>
            <View style={[styles.inputFrame, (validationError || saveError) && styles.inputFrameError]}>
              <TextInput
                accessibilityLabel={t('playlist.displayTimeSeconds')}
                keyboardType="number-pad"
                maxLength={4}
                onChangeText={(next) => {
                  setValue(next);
                  setSaveError(null);
                }}
                selectTextOnFocus
                style={styles.input}
                value={value}
              />
              <Text style={styles.inputUnit}>{t('playlist.secondsShort')}</Text>
            </View>
            {validationError ? <Text accessibilityRole="alert" selectable style={styles.error}>{validationError}</Text> : null}
            {saveError ? <Text accessibilityRole="alert" selectable style={styles.error}>{saveError}</Text> : null}
          </View>

          <View style={styles.presets}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset}
                accessibilityRole="button"
                accessibilityState={{ selected: seconds === preset }}
                onPress={() => {
                  setValue(String(preset));
                  setSaveError(null);
                }}
                style={({ pressed }) => [
                  styles.preset,
                  seconds === preset && styles.presetActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.presetText, seconds === preset && styles.presetTextActive]}>
                  {preset} {t('playlist.secondsShort')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.explanation}>
            {t('playlist.displayTimeExplanation', { seconds: seconds ?? '—' })}
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onClose}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(validationError) || saving}
              onPress={submit}
              style={({ pressed }) => [
                styles.button,
                styles.saveButton,
                (validationError || saving) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {saving ? <ActivityIndicator color={colors.onAccent} size="small" /> : <Text style={styles.saveText}>{t('common.save')}</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusXl: number, radiusPill: number) => StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.overlayStrong },
  dialog: { width: '100%', maxWidth: 520, gap: 18, padding: 24, borderRadius: radiusXl, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surfaceElevated, boxShadow: colors.shadowStrong },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  headerCopy: { minWidth: 0, flex: 1, gap: 4 },
  title: { color: colors.textPrimary, fontFamily: brandFonts.heading, fontSize: 24 },
  subtitle: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill, backgroundColor: colors.surfaceMuted },
  mediaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  thumbnail: { width: 112, height: 70, borderRadius: 11 },
  mediaCopy: { minWidth: 0, flex: 1, gap: 5 },
  mediaTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 15 },
  mediaType: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 12 },
  inputSection: { gap: 8 },
  label: { color: colors.textSecondary, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  inputFrame: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
  inputFrameError: { borderColor: colors.danger },
  input: { minWidth: 0, flex: 1, paddingVertical: 10, color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 30, fontVariant: ['tabular-nums'] },
  inputUnit: { color: colors.textMuted, fontFamily: brandFonts.bodyEmphasis, fontSize: 14 },
  error: { color: colors.danger, fontFamily: brandFonts.body, fontSize: 12 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { minWidth: 68, alignItems: 'center', paddingHorizontal: 13, paddingVertical: 9, borderRadius: radiusPill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  presetActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  presetText: { color: colors.textSecondary, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
  presetTextActive: { color: colors.accent },
  explanation: { color: colors.textSecondary, fontFamily: brandFonts.body, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill },
  cancelButton: { backgroundColor: colors.surfaceMuted },
  saveButton: { backgroundColor: colors.accent },
  cancelText: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  saveText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.72 },
});
