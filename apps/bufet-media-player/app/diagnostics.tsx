import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Network from 'expo-network';
import { router } from 'expo-router';

import {
  HeartbeatIcon,
  PlayerButton,
  PlayerSurface,
  SetupIcon,
  usePlayerLayout,
} from '@/components/ui/player-design';
import { ApiBaseUrl, type ProbeResult } from '@/services/api-base-url';
import { PlayerService } from '@/services/player-service';

type CheckState = {
  networkState?: Awaited<ReturnType<typeof Network.getNetworkStateAsync>>;
  ip?: string;
  savedBaseUrl?: string | null;
  resolvedBaseUrl?: string | null;
  probe?: ProbeResult | null;
  manifest?: { itemCount: number; screenId: string | number | null };
  manifestError?: string;
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
  const { compactPadding, actionInset } = usePlayerLayout();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<CheckState>({});
  const abortRef = useRef<AbortController | null>(null);

  const envApiUrl = useMemo(() => process.env.EXPO_PUBLIC_API_URL ?? '(unset)', []);
  const configuredApiUrl = useMemo(() => ApiBaseUrl.getConfiguredApiUrl(), []);
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
      let manifest: CheckState['manifest'];
      let manifestError: string | undefined;
      if (baseUrl) {
        try {
          const config = await PlayerService.getDeviceConfig(id, baseUrl, abortRef.current?.signal);
          const screenId = config.settings?.screen_id;
          manifest = {
            itemCount: config.playlist.items.length,
            screenId: typeof screenId === 'string' || typeof screenId === 'number' ? screenId : null,
          };
        } catch (error) {
          manifestError = error instanceof Error ? error.message : String(error);
        }
      }
      const lastError = PlayerService.getLastNetworkError();

      setChecks({ networkState, ip, savedBaseUrl: saved, resolvedBaseUrl: baseUrl, probe, manifest, manifestError, lastError });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setChecks((prev) => ({ ...prev, screenError: `Checks failed: ${detail}` }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlayerSurface contentContainerStyle={[styles.container, { paddingHorizontal: compactPadding }]}>
        <View style={styles.header}>
          <HeartbeatIcon />
          <Text style={styles.title}>Diagnostics</Text>
        </View>

        <View style={styles.details}>
          <Row label="deviceId" value={deviceId ?? '(loading)'} />
          <Row label="cached baseUrl" value={PlayerService.getCachedApiBaseUrl() ?? '(none)'} />
          <Row label="saved baseUrl" value={checks.savedBaseUrl ?? '(none)'} />
          <Row label="EXPO_PUBLIC_API_URL" value={envApiUrl} />
          <Row label="configured API URL" value={configuredApiUrl ?? '(unset)'} />

          <Row
            label="network"
            value={
              checks.networkState
                ? `${checks.networkState.type} connected=${String(checks.networkState.isConnected)} internet=${String(checks.networkState.isInternetReachable)}`
                : '(unknown)'
            }
          />
          <Row label="ip" value={checks.ip ?? '(unknown)'} />
        </View>

        <View style={[styles.actions, { marginHorizontal: actionInset }]}>
          <PlayerButton
            label="Run checks"
            icon={<HeartbeatIcon size={36} color="#ffffff" />}
            onPress={() => void runChecks()}
            disabled={busy}
            hasTVPreferredFocus
            variant="primary"
            style={styles.diagnosticsButton}
          />
          <PlayerButton
            label="Go to setup"
            icon={<SetupIcon color="#ffffff" />}
            variant="secondary"
            onPress={() => router.push('/setup')}
            style={styles.diagnosticsButton}
          />
        </View>

        {busy ? <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} /> : null}

        {checks.screenError ? <Text style={styles.error} selectable>{checks.screenError}</Text> : null}

        {checks.probe ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Probe</Text>
            <Text style={styles.probeValue} selectable>
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
    </PlayerSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 54,
    paddingBottom: 42,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginBottom: 36,
  },
  title: {
    color: '#ffffff',
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
  },
  details: {
    gap: 12,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
  },
  label: {
    width: '20%',
    color: '#a9aaad',
    fontSize: 24,
    lineHeight: 31,
  },
  value: {
    flex: 1,
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 31,
  },
  actions: {
    marginTop: 28,
    gap: 24,
  },
  diagnosticsButton: {
    minHeight: 88,
  },
  section: {
    marginTop: 40,
  },
  spinner: {
    marginTop: 14,
  },
  probeValue: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 31,
  },
  muted: {
    color: '#a9aaad',
    marginTop: 8,
    fontSize: 18,
    lineHeight: 24,
  },
  error: {
    color: '#ff8a80',
    marginTop: 14,
    fontSize: 18,
  },
});
