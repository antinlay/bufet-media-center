import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
import { router } from 'expo-router';

import { ApiBaseUrl, type ProbeResult } from '@/services/api-base-url';
import { PlayerService } from '@/services/player-service';

type CheckState = {
  networkState?: Awaited<ReturnType<typeof Network.getNetworkStateAsync>>;
  ip?: string;
  baseUrl?: string | null;
  probe?: ProbeResult | null;
  lastError?: unknown;
};

export default function DiagnosticsScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<CheckState>({});
  const abortRef = useRef<AbortController | null>(null);

  const envApiUrl = useMemo(() => process.env.EXPO_PUBLIC_API_URL ?? '(unset)', []);
  const configApiUrl = useMemo(() => {
    const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
    const raw = extra?.apiUrl;
    return typeof raw === 'string' ? raw : '(unset)';
  }, []);

  useEffect(() => {
    const init = async () => {
      const id = await PlayerService.getOrCreateDeviceId();
      setDeviceId(id);
      const saved = await ApiBaseUrl.readSavedBaseUrl();
      setChecks((prev) => ({ ...prev, baseUrl: PlayerService.getCachedApiBaseUrl() ?? saved }));
    };
    init();
  }, []);

  const runChecks = async () => {
    if (!deviceId) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setBusy(true);
    try {
      const [networkState, ip, saved, baseUrlResolved] = await Promise.all([
        Network.getNetworkStateAsync(),
        Network.getIpAddressAsync().catch(() => '0.0.0.0'),
        ApiBaseUrl.readSavedBaseUrl(),
        (async () => {
          // Try to resolve, but don't throw; diagnostics should always render.
          try {
            return await ApiBaseUrl.resolve(deviceId, { abortSignal: abortRef.current?.signal });
          } catch {
            return null;
          }
        })(),
      ]);

      const baseUrl = PlayerService.getCachedApiBaseUrl() ?? baseUrlResolved ?? saved;
      const probe = baseUrl ? await ApiBaseUrl.probe(baseUrl, deviceId) : null;
      const lastError = PlayerService.getLastNetworkError();

      setChecks({ networkState, ip, baseUrl, probe, lastError });
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Diagnostics</Text>

      <Row label="deviceId" value={deviceId ?? '(loading)'} />
      <Row label="cached baseUrl" value={PlayerService.getCachedApiBaseUrl() ?? '(none)'} />
      <Row label="saved baseUrl" value={(checks.baseUrl ?? null) ? String(checks.baseUrl) : '(none)'} />
      <Row label="EXPO_PUBLIC_API_URL" value={envApiUrl} />
      <Row label="config extra.apiUrl" value={configApiUrl} />

      <Row
        label="network"
        value={
          checks.networkState
            ? `${checks.networkState.type} connected=${String(checks.networkState.isConnected)} internet=${String(checks.networkState.isInternetReachable)}`
            : '(unknown)'
        }
      />
      <Row label="ip" value={checks.ip ?? '(unknown)'} />

      <View style={styles.section}>
        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={runChecks} disabled={busy}>
          <Text style={styles.buttonText}>Run checks</Text>
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={() => router.push('/setup')}>
          <Text style={styles.buttonText}>Go to setup</Text>
        </Pressable>
      </View>

      {busy ? <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} /> : null}

      {checks.probe ? (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Probe</Text>
          <Text style={styles.value}>
            {checks.probe.ok ? `OK: ${checks.probe.baseUrl} (${checks.probe.status})` : `FAIL: ${checks.probe.baseUrl} - ${checks.probe.reason}${checks.probe.status ? ` (${checks.probe.status})` : ''}`}
          </Text>
          {!checks.probe.ok && checks.probe.body ? <Text style={styles.muted}>Body: {checks.probe.body}</Text> : null}
        </View>
      ) : null}

      {checks.lastError ? (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Last error</Text>
          <Text style={styles.muted}>{JSON.stringify(checks.lastError, null, 2)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    padding: 24,
    flexGrow: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 18,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  value: {
    color: '#ffffff',
    fontSize: 14,
  },
  section: {
    marginTop: 18,
  },
  button: {
    backgroundColor: '#2a7bff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginTop: 14,
  },
  muted: {
    color: '#aaaaaa',
    marginTop: 8,
    fontSize: 12,
  },
});
