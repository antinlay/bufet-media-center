import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

export function AddMediaUrlDialog({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (url: string, title: string) => Promise<void> }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.xl, radius.pill);

  useEffect(() => {
    if (!visible) return;
    setError(null);
  }, [visible]);

  const valid = /^https?:\/\/\S+$/i.test(url.trim());
  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(url.trim(), title.trim());
      setUrl('');
      setTitle('');
      onClose();
    } catch {
      setError(t('media.addUrlError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onClose}>
        <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{t('media.addByLink')}</Text>
          <View style={styles.field}>
            <Text style={styles.label}>{t('media.mediaTitle')}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t('media.mediaTitlePlaceholder')} placeholderTextColor={colors.textMuted} style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{t('media.url')}</Text>
            <TextInput value={url} onChangeText={(value) => { setUrl(value); setError(null); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://" placeholderTextColor={colors.textMuted} style={styles.input} />
            {!valid && url.length ? <Text style={styles.error}>{t('media.invalidUrl')}</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          </View>
          <View style={styles.actions}>
            <Pressable disabled={saving} onPress={onClose} style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>{t('common.cancel')}</Text></Pressable>
            <Pressable disabled={!valid || saving} onPress={submit} style={({ pressed }) => [styles.button, styles.save, (!valid || saving) && styles.disabled, pressed && styles.pressed]}>{saving ? <ActivityIndicator color={colors.onAccent} size="small" /> : <Text style={styles.saveText}>{t('common.add')}</Text>}</Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusXl: number, radiusPill: number) => StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.overlayStrong },
  dialog: { width: '100%', maxWidth: 480, gap: 18, padding: 24, borderRadius: radiusXl, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surfaceElevated, boxShadow: colors.shadowStrong },
  title: { color: colors.textPrimary, fontFamily: brandFonts.heading, fontSize: 24 },
  field: { gap: 7 },
  label: { color: colors.textSecondary, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 },
  input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground, fontFamily: brandFonts.body, fontSize: 14 },
  error: { color: colors.danger, fontFamily: brandFonts.body, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill },
  cancel: { backgroundColor: colors.surfaceMuted },
  save: { backgroundColor: colors.accent },
  cancelText: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  saveText: { color: colors.onAccent, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.72 },
});
