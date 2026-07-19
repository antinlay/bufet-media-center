import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Network from 'expo-network';
import { router } from 'expo-router';

import { ApiBaseUrl, type ProbeResult } from '@/services/api-base-url';
import { PlayerService } from '@/services/player-service';
import { TvButton } from '@/components/ui/tv-button';

type CheckState = {
  networkState?: Awaited<ReturnType<typeof Network.getNetworkStateAsync>>;
  ip?: string;
  savedBaseUrl?: string | null;
  resolvedBaseUrl?: string | null;
  probe?: ProbeResult | null;
  lastError?: unknown;
  screenError?: string;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>{value}</Text>
    </View>
  );
}

export default function DiagnosticsScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<CheckState>({});
  const abortRef = useRef<AbortController | null>(null);

  const envApiUrl = useMemo(() => process.env.EXPO_PUBLIC_API_URL ?? '(unset)', []);
  const configuredApiUrl = useMemo(() => ApiBaseUrl.getConfiguredApiUrl() ?? '(unset)', []);

  useEffect(() => {
    const init = async () => {
      const saved = await ApiBaseUrl.readSavedBaseUrl();
      setChecks((prev) => ({ ...prev, savedBaseUrl: saved }));

      try {
        const id = await PlayerService.getOrCreateDeviceId();
        setDeviceId(id);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        setChecks((prev) => ({ ...prev, screenError: `Device initialization failed: ${detail}` }));
      }
    };
    void init();
  }, [configuredApiUrl]);

  const runChecks = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setBusy(true);
    try {
      let id = deviceId;
      if (!id) {
        id = await PlayerService.getOrCreateDeviceId();
        setDeviceId(id);
      }

      const [networkState, ip, saved, baseUrlResolved] = await Promise.all([
        Network.getNetworkStateAsync(),
        Network.getIpAddressAsync().catch(() => '0.0.0.0'),
        ApiBaseUrl.readSavedBaseUrl(),
        (async () => {
          // Try to resolve, but don't throw; diagnostics should always render.
          try {
            return await ApiBaseUrl.resolve(id, { abortSignal: abortRef.current?.signal });
          } catch {
            return null;
          }
        })(),
      ]);

      const baseUrl = PlayerService.getCachedApiBaseUrl() ?? baseUrlResolved ?? saved ?? configuredApiUrl;
      const probe = baseUrl ? await ApiBaseUrl.probe(baseUrl, id) : null;
      const lastError = PlayerService.getLastNetworkError();

      setChecks({ networkState, ip, savedBaseUrl: saved, resolvedBaseUrl: baseUrl, probe, lastError });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setChecks((prev) => ({ ...prev, screenError: `Checks failed: ${detail}` }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <Text style={styles.title}>Diagnostics</Text>

      <Row label="deviceId" value={deviceId ?? '(loading)'} />
      <Row label="cached baseUrl" value={PlayerService.getCachedApiBaseUrl() ?? '(none)'} />
      <Row label="saved baseUrl" value={checks.savedBaseUrl ?? '(none)'} />
      <Row label="resolved baseUrl" value={checks.resolvedBaseUrl ?? '(none)'} />
      <Row label="EXPO_PUBLIC_API_URL" value={envApiUrl} />
      <Row label="configured API URL" value={configuredApiUrl} />

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
        <TvButton label="Run checks" onPress={() => void runChecks()} disabled={busy} hasTVPreferredFocus />
        <TvButton
          label="Go to setup"
          variant="secondary"
          onPress={() => router.push('/setup')}
          style={styles.secondaryButton}
        />
      </View>

      {busy ? <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} /> : null}

      {checks.screenError ? <Text style={styles.error} selectable>{checks.screenError}</Text> : null}

      {checks.probe ? (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Probe</Text>
          <Text style={styles.value} selectable>
            {checks.probe.ok ? `OK: ${checks.probe.baseUrl} (${checks.probe.status})` : `FAIL: ${checks.probe.baseUrl} - ${checks.probe.reason}${checks.probe.status ? ` (${checks.probe.status})` : ''}`}
          </Text>
          {!checks.probe.ok && checks.probe.body ? <Text style={styles.muted} selectable>Body: {checks.probe.body}</Text> : null}
        </View>
      ) : null}

      {checks.lastError ? (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Last error</Text>
          <Text style={styles.muted} selectable>{JSON.stringify(checks.lastError, null, 2)}</Text>
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
  secondaryButton: {
    marginTop: 12,
  },
  spinner: {
    marginTop: 14,
  },
  muted: {
    color: '#aaaaaa',
    marginTop: 8,
    fontSize: 12,
  },
  error: {
    color: '#ff8a80',
    marginTop: 14,
    fontSize: 14,
  },
});
