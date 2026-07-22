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
import { playerColors } from '@/components/ui/player-theme';
import { usePlayerLocalization } from '@/localization/player-localization';
import type { TranslationKey } from '@/localization/translations';
import {
  ApiBaseUrl,
  type ProbeFailureReason,
  type ProbeResult,
} from '@/services/api-base-url';
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
  screenError?: TranslationKey;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>{value}</Text>
    </View>
  );
}

function probeReasonKey(reason: ProbeFailureReason): TranslationKey {
  switch (reason) {
    case 'networkError':
      return 'diagnostics.probeNetworkError';
    case 'timeout':
      return 'diagnostics.probeTimeout';
    case 'unexpectedResponse':
      return 'diagnostics.probeUnexpectedResponse';
  }
}

export default function DiagnosticsScreen() {
  const { compactPadding, actionInset } = usePlayerLayout();
  const { t } = usePlayerLocalization();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<CheckState>({});
  const abortRef = useRef<AbortController | null>(null);

  const envApiUrl = useMemo(() => process.env.EXPO_PUBLIC_API_URL ?? null, []);
  const configuredApiUrl = useMemo(() => ApiBaseUrl.getConfiguredApiUrl(), []);
  useEffect(() => {
    const init = async () => {
      const saved = await ApiBaseUrl.readSavedBaseUrl();
      setChecks((prev) => ({ ...prev, savedBaseUrl: saved }));

      try {
        const id = await PlayerService.getOrCreateDeviceId();
        setDeviceId(id);
      } catch (error) {
        console.error('Device initialization failed:', error);
        setChecks((prev) => ({ ...prev, screenError: 'setup.deviceInitializationFailed' }));
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
      console.error('Diagnostics failed:', error);
      setChecks((prev) => ({ ...prev, screenError: 'diagnostics.checksFailed' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlayerSurface contentContainerStyle={[styles.container, { paddingHorizontal: compactPadding }]}>
        <View style={styles.header}>
          <HeartbeatIcon />
          <Text style={styles.title}>{t('diagnostics.title')}</Text>
        </View>

        <View style={styles.details}>
          <Row label={t('diagnostics.deviceId')} value={deviceId ?? `(${t('common.loading')})`} />
          <Row label={t('diagnostics.cachedBaseUrl')} value={PlayerService.getCachedApiBaseUrl() ?? `(${t('common.none')})`} />
          <Row label={t('diagnostics.savedBaseUrl')} value={checks.savedBaseUrl ?? `(${t('common.none')})`} />
          <Row label={t('diagnostics.envApiUrl')} value={envApiUrl ?? `(${t('common.unset')})`} />
          <Row label={t('diagnostics.configuredApiUrl')} value={configuredApiUrl ?? `(${t('common.unset')})`} />

          <Row
            label={t('diagnostics.network')}
            value={
              checks.networkState
                ? `${checks.networkState.type} ${t('diagnostics.connected')}=${String(checks.networkState.isConnected)} ${t('diagnostics.internet')}=${String(checks.networkState.isInternetReachable)}`
                : `(${t('common.unknown')})`
            }
          />
          <Row label={t('diagnostics.ipAddress')} value={checks.ip ?? `(${t('common.unknown')})`} />
        </View>

        <View style={[styles.actions, { marginHorizontal: actionInset }]}>
          <PlayerButton
            label={t('diagnostics.runChecks')}
            icon={<HeartbeatIcon size={36} color={playerColors.primaryText} />}
            onPress={() => void runChecks()}
            disabled={busy}
            hasTVPreferredFocus
            variant="primary"
            style={styles.diagnosticsButton}
          />
          <PlayerButton
            label={t('diagnostics.goToSetup')}
            icon={<SetupIcon color={playerColors.primaryText} />}
            variant="secondary"
            onPress={() => router.push('/setup')}
            style={styles.diagnosticsButton}
          />
        </View>

        {busy ? <ActivityIndicator size="large" color={playerColors.accent} style={styles.spinner} /> : null}

        {checks.screenError ? <Text style={styles.error} selectable>{t(checks.screenError)}</Text> : null}

        {checks.probe ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>{t('diagnostics.probe')}</Text>
            <Text style={styles.probeValue} selectable>
              {checks.probe.ok ? `${t('diagnostics.ok')}: ${checks.probe.baseUrl} (${checks.probe.status})` : `${t('diagnostics.fail')}: ${checks.probe.baseUrl} - ${t(probeReasonKey(checks.probe.reason))}${checks.probe.status ? ` (${checks.probe.status})` : ''}`}
            </Text>
            {!checks.probe.ok && checks.probe.body ? <Text style={styles.muted} selectable>{t('diagnostics.body')}: {checks.probe.body}</Text> : null}
          </View>
        ) : null}

        {checks.lastError ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>{t('diagnostics.lastError')}</Text>
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
    color: playerColors.primaryText,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
  },
  details: {
    gap: 12,
  },
  subtitle: {
    color: playerColors.primaryText,
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
    color: playerColors.secondaryText,
    fontSize: 24,
    lineHeight: 31,
  },
  value: {
    flex: 1,
    color: playerColors.primaryText,
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
    color: playerColors.primaryText,
    fontSize: 24,
    lineHeight: 31,
  },
  muted: {
    color: playerColors.secondaryText,
    marginTop: 8,
    fontSize: 18,
    lineHeight: 24,
  },
  error: {
    color: playerColors.dangerText,
    marginTop: 14,
    fontSize: 18,
  },
});
