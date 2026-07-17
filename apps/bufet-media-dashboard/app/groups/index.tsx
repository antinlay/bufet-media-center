import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { TextInput } from '../../components/TextInput';
import { GalleryShell } from '../../features/media-points/GalleryShell';
import { useCreateOrganization } from '../../features/media-points/hooks';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';

export default function AddOrganizationScreen() {
  useProtectedRoute();
  const router = useRouter();
  const createMutation = useCreateOrganization();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.xl);

  const submit = () => {
    createMutation.mutate(
      { name, description },
      { onSuccess: () => router.replace('/') },
    );
  };

  return (
    <GalleryShell
      showBack
      title={t('organizations.addTitle')}
      subtitle={t('organizations.addSubtitle')}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{t('organizations.newTitle')}</Text>
        <Text style={styles.hint}>{t('organizations.nameHint')}</Text>
        <TextInput
          mode="outlined"
          label={t('organizations.name')}
          value={name}
          onChangeText={(value) => {
            setName(value);
            createMutation.reset();
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
        {createMutation.isError ? (
          <HelperText type="error" visible style={styles.error}>
            {t('organizations.createError')}
          </HelperText>
        ) : null}
        <Button
          mode="contained"
          buttonColor={colors.accent}
          textColor={colors.onAccent}
          contentStyle={styles.buttonContent}
          disabled={!name.trim() || createMutation.isPending}
          loading={createMutation.isPending}
          onPress={submit}
        >
          {t('organizations.submit')}
        </Button>
      </View>
    </GalleryShell>
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
  title: {
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 20,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.inputBackground,
  },
  error: {
    paddingHorizontal: 0,
  },
  buttonContent: {
    minHeight: 48,
  },
});
