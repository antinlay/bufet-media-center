import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.xl);
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

  const confirmDelete = () => {
    if (!organization) return;
    Alert.alert(t('organizations.deleteTitle'), t('organizations.deleteMessage', { name: organization.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(organization.id, { onSuccess }),
      },
    ]);
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
      {mutation.isError || deleteMutation.isError ? (
        <HelperText type="error" visible style={styles.error}>
          {deleteMutation.isError
            ? t('organizations.deleteError')
            : t(isEditing ? 'organizations.updateError' : 'organizations.createError')}
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
          onPress={confirmDelete}
        >
          {t('organizations.delete')}
        </Button>
      ) : null}
    </View>
  );
}

const createStyles = (colors: AppColors, borderRadius: number) => StyleSheet.create({
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
});
