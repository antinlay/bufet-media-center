import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, RadioButton, Text } from 'react-native-paper';
import { TextInput } from '../components/TextInput';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { AppShell } from '../components/AppShell';
import { BrandCard } from '../components/BrandCard';
import { EmptyState } from '../components/EmptyState';
import { apiClient } from '../lib/api';
import { buildGroupTree, flattenGroupTree } from '../lib/groupTree';
import { brandFonts, palette } from '../theme';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

function extractCode(value: string) {
  if (!value) return '';
  try {
    if (value.includes('/pair')) {
      const url = new URL(value);
      const code = url.searchParams.get('code');
      return code?.toUpperCase() ?? '';
    }
  } catch {
    // ignore URL parse errors
  }

  const match = value.match(/code=([A-Z0-9]+)/i);
  if (match) return match[1].toUpperCase();

  return value.trim().toUpperCase();
}

export default function ScanScreen() {
  useProtectedRoute();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });

  const availableGroups = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => !group.systemGroup),
    [groupsQuery.data],
  );
  const flatGroups = useMemo(
    () => flattenGroupTree(buildGroupTree(availableGroups)),
    [availableGroups],
  );
  useEffect(() => {
    if (!selectedGroupId && flatGroups.length) {
      setSelectedGroupId(flatGroups[0].group.id);
    }
  }, [flatGroups, selectedGroupId]);

  const pairMutation = useMutation({
    mutationFn: (code: string) => {
      if (!availableGroups.length) throw new Error('Сначала создайте организацию');
      if (!selectedGroupId) throw new Error('Выберите организацию');

      const name = `Экран ${code}`;
      return apiClient.pairDevice({
        code,
        screen: {
          name,
          group_id: selectedGroupId,
        },
      });
    },
    onSuccess: (data) => {
      router.replace(`/screens/${data.screen.id}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Не удалось привязать экран';
      setScanError(message);
      setScanned(false);
    },
  });

  const handleCode = (value: string) => {
    const code = extractCode(value);
    if (!code) {
      setScanError('Не удалось распознать код');
      return;
    }
    setScanError(null);
    setScanned(true);
    pairMutation.mutate(code);
  };

  if (!availableGroups.length) {
    return (
      <AppShell title="Сканирование QR" subtitle="Нужна организация для создания экрана.">
        <EmptyState
          title="Нет организаций"
          subtitle="Создайте организацию, чтобы привязать первый экран."
          actionLabel="Создать организацию"
          onAction={() => router.push('/groups')}
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Сканирование QR" subtitle="Наведите камеру на код с плеера.">
      <BrandCard>
        <Text style={styles.cardTitle}>Сканировать</Text>
        <Text style={styles.cardText}>Организация для нового экрана</Text>
        <RadioButton.Group
          value={selectedGroupId ? String(selectedGroupId) : ''}
          onValueChange={(value) => setSelectedGroupId(Number(value))}
        >
          {flatGroups.map(({ group, depth }) => (
            <RadioButton.Item
              key={group.id}
              label={`${'—'.repeat(depth)} ${group.name}`}
              value={String(group.id)}
              labelStyle={styles.radioLabel}
            />
          ))}
        </RadioButton.Group>
        {!permission ? (
          <Text style={styles.cardText}>Запрашиваем доступ к камере…</Text>
        ) : !permission.granted ? (
          <View>
            <Text style={styles.cardText}>Нужен доступ к камере для сканирования QR‑кода.</Text>
            <Button mode="contained" onPress={requestPermission}>
              Разрешить камеру
            </Button>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={(event) => {
                if (!scanned) {
                  handleCode(event.data);
                }
              }}
            />
          </View>
        )}
        <Text style={styles.cardText}>Не получается сканировать? Введите код вручную.</Text>
        <TextInput
          label="Код"
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="characters"
          style={styles.input}
        />
        <Button mode="outlined" onPress={() => handleCode(manualCode)} disabled={!manualCode || pairMutation.isPending}>
          Привязать вручную
        </Button>
        {scanError ? <HelperText type="error">{scanError}</HelperText> : null}
        {Platform.OS === 'web' ? (
          <HelperText type="info">На web доступ к камере работает только по HTTPS или на localhost.</HelperText>
        ) : null}
      </BrandCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: palette.charcoal,
    marginBottom: 8,
  },
  cardText: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginBottom: 8,
  },
  radioLabel: {
    fontFamily: brandFonts.body,
    fontSize: 14,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#0B0B0D',
  },
  camera: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFDF9',
    marginBottom: 12,
  },
});
