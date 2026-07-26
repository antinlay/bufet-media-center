import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, HelperText, Text } from 'react-native-paper';

import { TextInput } from '../../components/TextInput';
import {
  useCreateOrganization,
  useDeleteOrganization,
  useUpdateOrganization,
} from '../media-points/hooks';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';
import type { ConcertoGroup } from '@bufet/shared';

export function OrganizationForm({ organization, onSuccess }: { organization?: ConcertoGroup; onSuccess: () => void }) {
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();
  const [name, setName] = useState(organization?.name ?? '');
  const [description, setDescription] = useState(organization?.description ?? '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.xl, radius.pill);
  const isEditing = Boolean(organization);
  const mutation = isEditing ? updateMutation : createMutation;

  useEffect(() => {
    setName(organization?.name ?? '');
    setDescription(organization?.description ?? '');
  }, [organization]);

  const submit = () => {
    if (organization) {
      updateMutation.mutate(
        { id: organization.id, name, description },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate({ name, description }, { onSuccess });
  };

  const openDeleteDialog = () => {
    deleteMutation.reset();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!organization) return;
    try {
      await deleteMutation.mutateAsync(organization.id);
      setDeleteDialogOpen(false);
      onSuccess();
    } catch {
      // The mutation error is rendered inside the confirmation dialog.
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t(isEditing ? 'organizations.editTitle' : 'organizations.newTitle')}</Text>
      <Text style={styles.hint}>{t('organizations.nameHint')}</Text>
      <TextInput
        mode="outlined"
        label={t('organizations.name')}
        value={name}
        onChangeText={(value) => {
          setName(value);
          mutation.reset();
        }}
        autoFocus
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        label={t('organizations.description')}
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      {mutation.isError ? (
        <HelperText type="error" visible style={styles.error}>
          {t(isEditing ? 'organizations.updateError' : 'organizations.createError')}
        </HelperText>
      ) : null}
      <Button
        mode="contained"
        buttonColor={colors.accent}
        textColor={colors.onAccent}
        contentStyle={styles.buttonContent}
        disabled={!name.trim() || mutation.isPending || deleteMutation.isPending}
        loading={mutation.isPending}
        onPress={submit}
      >
        {t(isEditing ? 'organizations.save' : 'organizations.submit')}
      </Button>
      {isEditing ? (
        <Button
          mode="outlined"
          textColor={colors.danger}
          buttonColor={colors.surface}
          disabled={mutation.isPending || deleteMutation.isPending}
          loading={deleteMutation.isPending}
          onPress={openDeleteDialog}
        >
          {t('organizations.delete')}
        </Button>
      ) : null}
      <Modal visible={deleteDialogOpen} transparent animationType="fade" onRequestClose={() => !deleteMutation.isPending && setDeleteDialogOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => !deleteMutation.isPending && setDeleteDialogOpen(false)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogIcon}><MaterialCommunityIcons name="trash-can-outline" color={colors.danger} size={25} /></View>
            <Text style={styles.dialogTitle}>{t('organizations.deleteTitle')}</Text>
            <Text style={styles.dialogText}>{organization ? t('organizations.deleteMessage', { name: organization.name }) : ''}</Text>
            {deleteMutation.isError ? <Text accessibilityRole="alert" style={styles.dialogError}>{t('organizations.deleteError')}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" disabled={deleteMutation.isPending} onPress={() => setDeleteDialogOpen(false)} style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={deleteMutation.isPending} onPress={confirmDelete} style={({ pressed }) => [styles.dialogButton, styles.deleteButton, pressed && styles.pressed]}>
                {deleteMutation.isPending ? <ActivityIndicator color={colors.onImage} size="small" /> : <Text style={styles.deleteText}>{t('common.delete')}</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: AppColors, borderRadius: number, radiusPill: number) => StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: 14,
    padding: 24,
    borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: colors.shadowStrong,
  },
  title: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 20 },
  hint: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  input: { backgroundColor: colors.inputBackground },
  error: { paddingHorizontal: 0 },
  buttonContent: { minHeight: 48 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.overlayStrong },
  dialog: { width: '100%', maxWidth: 390, alignItems: 'center', gap: 10, padding: 24, borderRadius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, boxShadow: colors.shadowStrong },
  dialogIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.dangerMuted },
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
