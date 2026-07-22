import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  HeartbeatIcon,
  PlayerBrandHeader,
  PlayerButton,
  PlayerField,
  PlayerSurface,
  RefreshIcon,
  TrashIcon,
  usePlayerLayout,
} from '@/components/ui/player-design';
import { ApiBaseUrl, type DiscoverProgress } from '@/services/api-base-url';
import { PlayerService } from '@/services/player-service';

export default function SetupScreen() {
  const { pagePadding } = usePlayerLayout();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [configuredUrl, setConfiguredUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<DiscoverProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ensureDeviceId = async () => {
    if (deviceId) return deviceId;

    try {
      const id = await PlayerService.getOrCreateDeviceId();
      setDeviceId(id);
      return id;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessage(`Device initialization failed: ${detail}`);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      const configured = ApiBaseUrl.getConfiguredApiUrl();
      setConfiguredUrl(configured);

      const saved = await ApiBaseUrl.readSavedBaseUrl();
      if (saved) {
        setSavedUrl(saved);
      } else if (configured) {
        await ApiBaseUrl.saveBaseUrl(configured);
        setSavedUrl(configured);
      }

      await ensureDeviceId();
    };
    void init();
    // Run once on screen mount. ensureDeviceId reads the initial null state here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    const id = await ensureDeviceId();
    if (!id) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setMessage('Checking API...');
    setProgress({ total: 0, done: 0 });
    try {
      const resolved = await ApiBaseUrl.resolve(id, {
        abortSignal: controller.signal,
        onDiscoveryProgress: (p) => setProgress(p),
      });

      if (controller.signal.aborted) return;

      if (!resolved) {
        setMessage('No API found yet. Check the network and press Refresh again.');
        return;
      }

      setSavedUrl(resolved);
      setMessage(`Ready: ${resolved}`);
      router.replace('/loading');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
        setProgress(null);
      }
    }
  };

  const onClear = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await ApiBaseUrl.clearSavedBaseUrl();
      setSavedUrl(null);
      setMessage('Saved URL cleared.');
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setProgress(null);
    setMessage('Discovery cancelled.');
  };

  return (
    <PlayerSurface contentContainerStyle={[styles.container, { paddingHorizontal: pagePadding }]}>
      <PlayerBrandHeader />

      <Text style={styles.title}>BUFET Player Setup</Text>

      <View style={styles.form}>
        <PlayerField label="Saved API URL" value={savedUrl} />
        <PlayerField label="Configured API URL" value={configuredUrl} />

        <PlayerButton
          label="Refresh"
          icon={<RefreshIcon />}
          onPress={() => void onRefresh()}
          disabled={busy}
          hasTVPreferredFocus
          style={styles.primaryButton}
        />
      </View>

      <View style={styles.actionRow}>
        <PlayerButton
          label="Clear saved"
          icon={<TrashIcon color="#ffffff" />}
          variant="secondary"
          onPress={() => void onClear()}
          disabled={busy}
          style={styles.actionButton}
        />
        <PlayerButton
          label="Open diagnostics"
          icon={<HeartbeatIcon size={36} color="#ffffff" />}
          variant="secondary"
          onPress={() => router.push('/diagnostics')}
          disabled={busy}
          style={styles.actionButton}
        />
      </View>

      {busy && progress ? (
        <View style={styles.cancelRow}>
          <PlayerButton label="Cancel" variant="secondary" onPress={onCancel} style={styles.cancelButton} />
        </View>
      ) : null}

      {busy ? <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} /> : null}

      {progress ? (
        <Text style={styles.muted}>
          Scanning: {progress.done}/{progress.total}
          {progress.current ? ` (${progress.current})` : ''}
        </Text>
      ) : null}

      {message ? <Text style={styles.message} selectable>{message}</Text> : null}
    </PlayerSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 56,
    paddingBottom: 50,
  },
  title: {
    color: '#ffffff',
    fontSize: 60,
    lineHeight: 72,
    fontWeight: '700',
    marginTop: 70,
  },
  form: {
    width: '100%',
    maxWidth: 768,
    marginTop: 48,
  },
  primaryButton: {
    width: '50%',
    minHeight: 80,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 36,
    marginTop: 46,
  },
  actionButton: {
    flex: 1,
    minHeight: 100,
  },
  cancelRow: {
    alignItems: 'flex-start',
    marginTop: 18,
  },
  cancelButton: {
    minWidth: 180,
  },
  spinner: {
    marginTop: 22,
  },
  muted: {
    color: '#a9aaad',
    marginTop: 8,
    fontSize: 18,
    lineHeight: 24,
  },
  message: {
    color: '#a9aaad',
    marginTop: 16,
    fontSize: 18,
    lineHeight: 25,
  },
});
