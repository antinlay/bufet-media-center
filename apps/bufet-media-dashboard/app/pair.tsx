import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, HelperText, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TextInput } from '../components/TextInput';
import { GalleryShell } from '../features/media-points/GalleryShell';
import { useAddScreenByCode } from '../features/media-points/hooks';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { brandFonts, palette } from '../theme';

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

  const submit = () => {
    addMutation.mutate(
      { code, organizationId },
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
      title="Добавить экран"
      subtitle={organizationName ? `Организация: ${organizationName}` : 'Без выбранной организации'}
    >
      <View style={styles.card}>
        <View style={styles.qrPlaceholder}>
          <MaterialCommunityIcons name="qrcode" color={palette.cream} size={84} />
        </View>
        <Text style={styles.title}>Введите код экрана</Text>
        <Text style={styles.hint}>Код берётся из QR-кода, который генерирует плеер на устройстве.</Text>
        <TextInput
          mode="outlined"
          label="Код экрана"
          value={code}
          onChangeText={(value) => {
            setCode(value.toUpperCase());
            addMutation.reset();
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          textColor={palette.cream}
          outlineColor="#4A4D55"
          activeOutlineColor={palette.gold}
          style={styles.input}
        />
        {addMutation.isError ? (
          <HelperText type="error" visible style={styles.error}>
            {addMutation.error instanceof Error ? addMutation.error.message : 'Не удалось добавить экран'}
          </HelperText>
        ) : null}
        <Button
          mode="contained"
          buttonColor={palette.gold}
          textColor={palette.ink}
          contentStyle={styles.buttonContent}
          disabled={!code.trim() || addMutation.isPending}
          loading={addMutation.isPending}
          onPress={submit}
        >
          Добавить
        </Button>
        <Button
          mode="outlined"
          icon="qrcode-scan"
          textColor={palette.cream}
          style={styles.scanButton}
          contentStyle={styles.scanButtonContent}
          onPress={openScanner}
        >
          Сканировать QR
        </Button>
      </View>
    </GalleryShell>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    alignItems: 'stretch',
    gap: 13,
    padding: 26,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2E3138',
    backgroundColor: palette.panel,
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)',
  },
  qrPlaceholder: {
    width: 132,
    height: 132,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#373A42',
    backgroundColor: palette.panelRaised,
  },
  title: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 20,
    textAlign: 'center',
  },
  hint: {
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 4,
  },
  input: {
    backgroundColor: palette.panelRaised,
  },
  error: {
    paddingHorizontal: 0,
  },
  buttonContent: {
    minHeight: 50,
  },
  scanButton: {
    borderColor: '#454850',
  },
  scanButtonContent: {
    minHeight: 44,
  },
});
