import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, HelperText, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TextInput } from '../components/TextInput';
import { GalleryShell } from '../features/media-points/GalleryShell';
import { useAddScreenByCode } from '../features/media-points/hooks';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useAppTheme } from '../providers/AppThemeProvider';
import { useI18n } from '../providers/I18nProvider';
import { brandFonts, type AppColors } from '../theme';

function parseOrganizationId(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = rawValue ? Number(rawValue) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AddScreen() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    organizationId?: string;
    organizationName?: string;
  }>();
  const organizationId = parseOrganizationId(params.organizationId);
  const organizationName = Array.isArray(params.organizationName)
    ? params.organizationName[0]
    : params.organizationName;
  const initialCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const [code, setCode] = useState(initialCode ?? '');
  const addMutation = useAddScreenByCode();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.xl, radius.lg);

  const submit = () => {
    addMutation.mutate(
      { code, organizationId, screenName: t('pair.defaultScreenName', { code: code.trim().toUpperCase() }) },
      { onSuccess: () => router.replace('/') },
    );
  };

  const openScanner = () => {
    router.push({
      pathname: '/scan',
      params: {
        ...(organizationId ? { organizationId: String(organizationId) } : {}),
        ...(organizationName ? { organizationName } : {}),
      },
    });
  };

  return (
    <GalleryShell
      showBack
      title={t('pair.title')}
      subtitle={organizationName ? t('pair.organization', { name: organizationName }) : t('pair.noOrganization')}
    >
      <View style={styles.card}>
        <View style={styles.qrPlaceholder}>
          <MaterialCommunityIcons name="qrcode" color={colors.textPrimary} size={84} />
        </View>
        <Text style={styles.title}>{t('pair.codeTitle')}</Text>
        <Text style={styles.hint}>{t('pair.codeHint')}</Text>
        <TextInput
          mode="outlined"
          label={t('pair.code')}
          value={code}
          onChangeText={(value) => {
            setCode(value.toUpperCase());
            addMutation.reset();
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        {addMutation.isError ? (
          <HelperText type="error" visible style={styles.error}>
            {t('pair.addError')}
          </HelperText>
        ) : null}
        <Button
          mode="contained"
          buttonColor={colors.accent}
          textColor={colors.onAccent}
          contentStyle={styles.buttonContent}
          disabled={!code.trim() || addMutation.isPending}
          loading={addMutation.isPending}
          onPress={submit}
        >
          {t('pair.submit')}
        </Button>
        <Button
          mode="outlined"
          icon="qrcode-scan"
          textColor={colors.textPrimary}
          style={styles.scanButton}
          contentStyle={styles.scanButtonContent}
          onPress={openScanner}
        >
          {t('pair.scan')}
        </Button>
      </View>
    </GalleryShell>
  );
}

const createStyles = (colors: AppColors, borderRadius: number, smallRadius: number) => StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    alignItems: 'stretch',
    gap: 13,
    padding: 26,
    borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: colors.shadowStrong,
  },
  qrPlaceholder: {
    width: 132,
    height: 132,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderRadius: smallRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 20,
    textAlign: 'center',
  },
  hint: {
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.inputBackground,
  },
  error: {
    paddingHorizontal: 0,
  },
  buttonContent: {
    minHeight: 50,
  },
  scanButton: {
    borderColor: colors.borderStrong,
  },
  scanButtonContent: {
    minHeight: 44,
  },
});
