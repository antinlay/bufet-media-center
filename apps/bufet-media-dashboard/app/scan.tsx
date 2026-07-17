import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TextInput } from '../components/TextInput';
import { GalleryShell } from '../features/media-points/GalleryShell';
import { useAddScreenByCode } from '../features/media-points/hooks';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useAppTheme } from '../providers/AppThemeProvider';
import { useI18n } from '../providers/I18nProvider';
import { brandFonts, type AppColors } from '../theme';

function extractCode(value: string) {
  if (!value) return '';
  try {
    if (value.includes('/pair')) {
      const url = new URL(value);
      return url.searchParams.get('code')?.trim().toUpperCase() ?? '';
    }
  } catch {
    // Continue with the plain-text parser.
  }

  const queryCode = value.match(/code=([A-Z0-9-]+)/i)?.[1];
  return (queryCode ?? value).trim().toUpperCase();
}

function parseOrganizationId(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = rawValue ? Number(rawValue) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ScanScreen() {
  useProtectedRoute();
  const router = useRouter();
  const params = useLocalSearchParams<{ organizationId?: string; organizationName?: string }>();
  const organizationId = parseOrganizationId(params.organizationId);
  const organizationName = Array.isArray(params.organizationName)
    ? params.organizationName[0]
    : params.organizationName;
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const addMutation = useAddScreenByCode();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.xl, radius.lg);

  const addCode = (rawCode: string) => {
    const code = extractCode(rawCode);
    if (!code) {
      setLocalError(t('scan.decodeError'));
      return;
    }

    setLocalError(null);
    setScanned(true);
    addMutation.mutate(
      { code, organizationId, screenName: t('pair.defaultScreenName', { code }) },
      {
        onSuccess: () => router.replace('/'),
        onError: () => setScanned(false),
      },
    );
  };

  const mutationError = addMutation.isError ? t('pair.addError') : null;

  return (
    <GalleryShell
      showBack
      title={t('scan.title')}
      subtitle={organizationName
        ? t('scan.organizationSubtitle', { name: organizationName })
        : t('scan.unassignedSubtitle')}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{t('scan.cameraTitle')}</Text>
        {!permission ? (
          <View style={styles.permissionState}>
            <Text style={styles.hint}>{t('scan.checkingPermission')}</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionState}>
            <Text style={styles.hint}>{t('scan.permissionRequired')}</Text>
            <Button
              mode="contained"
              buttonColor={colors.accent}
              textColor={colors.onAccent}
              onPress={requestPermission}
            >
              {t('scan.allowCamera')}
            </Button>
          </View>
        ) : (
          <View style={styles.cameraFrame}>
            <CameraView
              style={styles.camera}
              facing="back"
              active={!scanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : (event) => addCode(event.data)}
            />
            <View style={styles.scanGuide} pointerEvents="none" />
          </View>
        )}

        <Text style={styles.manualTitle}>{t('scan.manualTitle')}</Text>
        <TextInput
          mode="outlined"
          label={t('pair.code')}
          value={manualCode}
          onChangeText={(value) => {
            setManualCode(value.toUpperCase());
            setLocalError(null);
            addMutation.reset();
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        {localError || mutationError ? (
          <HelperText type="error" visible style={styles.error}>
            {localError ?? mutationError}
          </HelperText>
        ) : null}
        <Button
          mode="contained"
          buttonColor={colors.accent}
          textColor={colors.onAccent}
          contentStyle={styles.buttonContent}
          disabled={!manualCode.trim() || addMutation.isPending}
          loading={addMutation.isPending}
          onPress={() => addCode(manualCode)}
        >
          {t('scan.submit')}
        </Button>
        {process.env.EXPO_OS === 'web' ? (
          <Text style={styles.webHint}>{t('scan.webHint')}</Text>
        ) : null}
      </View>
    </GalleryShell>
  );
}

const createStyles = (colors: AppColors, borderRadius: number, smallRadius: number) => StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 14,
    padding: 22,
    borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: colors.shadowStrong,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 18,
    textAlign: 'center',
  },
  hint: {
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  permissionState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    borderRadius: smallRadius,
    backgroundColor: colors.surfaceElevated,
  },
  cameraFrame: {
    width: '100%',
    maxHeight: 520,
    aspectRatio: 1,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: smallRadius,
    backgroundColor: colors.surfaceMuted,
  },
  camera: {
    flex: 1,
  },
  scanGuide: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    borderRadius: smallRadius,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  manualTitle: {
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 14,
    marginTop: 4,
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
  webHint: {
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 11,
    textAlign: 'center',
  },
});
