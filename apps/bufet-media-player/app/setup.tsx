import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ApiBaseUrl, type DiscoverProgress } from '@/services/api-base-url';
import { PlayerService } from '@/services/player-service';
import { TvButton } from '@/components/ui/tv-button';

export default function SetupScreen() {
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
    <View style={styles.container}>
      <Text style={styles.title}>BUFET Player Setup</Text>

      <Text style={styles.label}>Saved API URL</Text>
      <Text style={styles.value} selectable>{savedUrl ?? '(none)'}</Text>

      <Text style={styles.label}>Configured API URL</Text>
      <Text style={styles.value} selectable>{configuredUrl ?? '(none)'}</Text>

      <View style={styles.row}>
        <TvButton
          label="Refresh"
          onPress={() => void onRefresh()}
          disabled={busy}
          hasTVPreferredFocus
          style={styles.primaryButton}
        />
      </View>

      <View style={styles.row}>
        <TvButton
          label="Clear saved"
          variant="secondary"
          onPress={() => void onClear()}
          disabled={busy}
          style={styles.rowButton}
        />
        <TvButton
          label="Open diagnostics"
          variant="ghost"
          onPress={() => router.push('/diagnostics')}
          disabled={busy}
          style={styles.rowButton}
        />
      </View>

      <View style={styles.row}>
        {busy && progress ? <TvButton label="Cancel" variant="ghost" onPress={onCancel} style={styles.inlineButton} /> : null}
      </View>

      {busy ? <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} /> : null}

      {progress ? (
        <Text style={styles.muted}>
          Scanning: {progress.done}/{progress.total}
          {progress.current ? ` (${progress.current})` : ''}
        </Text>
      ) : null}

      {message ? <Text style={styles.message} selectable>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 18,
  },
  label: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  value: {
    color: '#ffffff',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    minWidth: 200,
  },
  rowButton: {
    minWidth: 180,
    flexGrow: 1,
  },
  inlineButton: {
    minWidth: 140,
  },
  spinner: {
    marginTop: 14,
  },
  muted: {
    color: '#aaaaaa',
    marginTop: 8,
    fontSize: 12,
  },
  message: {
    color: '#4da3ff',
    marginTop: 14,
    fontSize: 14,
  },
});
