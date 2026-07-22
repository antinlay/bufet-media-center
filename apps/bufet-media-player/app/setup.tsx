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
import { playerColors } from '@/components/ui/player-theme';
import {
  usePlayerLocalization,
  type TranslationOptions,
} from '@/localization/player-localization';
import type { TranslationKey } from '@/localization/translations';
import { ApiBaseUrl, type DiscoverProgress } from '@/services/api-base-url';
import { PlayerService } from '@/services/player-service';

type SetupMessage = {
  key: TranslationKey;
  options?: TranslationOptions;
};

export default function SetupScreen() {
  const { pagePadding } = usePlayerLayout();
  const { t } = usePlayerLocalization();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [configuredUrl, setConfiguredUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<SetupMessage | null>(null);
  const [progress, setProgress] = useState<DiscoverProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ensureDeviceId = async () => {
    if (deviceId) return deviceId;

    try {
      const id = await PlayerService.getOrCreateDeviceId();
      setDeviceId(id);
      return id;
    } catch (error) {
      console.error('Device initialization failed:', error);
      setMessage({ key: 'setup.deviceInitializationFailed' });
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
    setMessage({ key: 'setup.checkingApi' });
    setProgress({ total: 0, done: 0 });
    try {
      const resolved = await ApiBaseUrl.resolve(id, {
        abortSignal: controller.signal,
        onDiscoveryProgress: (p) => setProgress(p),
      });

      if (controller.signal.aborted) return;

      if (!resolved) {
        setMessage({ key: 'setup.noApiFound' });
        return;
      }

      setSavedUrl(resolved);
      setMessage({ key: 'setup.ready', options: { url: resolved } });
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
      setMessage({ key: 'setup.urlCleared' });
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setProgress(null);
    setMessage({ key: 'setup.discoveryCancelled' });
  };

  return (
    <PlayerSurface contentContainerStyle={[styles.container, { paddingHorizontal: pagePadding }]}>
      <PlayerBrandHeader />

      <Text style={styles.title}>{t('setup.title')}</Text>

      <View style={styles.form}>
        <PlayerField label={t('setup.savedApiUrl')} value={savedUrl} />
        <PlayerField label={t('setup.configuredApiUrl')} value={configuredUrl} />

        <PlayerButton
          label={t('setup.refresh')}
          icon={<RefreshIcon />}
          variant="primary"
          onPress={() => void onRefresh()}
          disabled={busy}
          hasTVPreferredFocus
          style={styles.primaryButton}
        />
      </View>

      <View style={styles.actionRow}>
        <PlayerButton
          label={t('setup.clearSaved')}
          icon={<TrashIcon color={playerColors.primaryText} />}
          variant="secondary"
          onPress={() => void onClear()}
          disabled={busy}
          style={styles.actionButton}
        />
        <PlayerButton
          label={t('common.openDiagnostics')}
          icon={<HeartbeatIcon size={36} color={playerColors.primaryText} />}
          variant="secondary"
          onPress={() => router.push('/diagnostics')}
          disabled={busy}
          style={styles.actionButton}
        />
      </View>

      {busy && progress ? (
        <View style={styles.cancelRow}>
          <PlayerButton label={t('common.cancel')} variant="secondary" onPress={onCancel} style={styles.cancelButton} />
        </View>
      ) : null}

      {busy ? <ActivityIndicator size="large" color={playerColors.accent} style={styles.spinner} /> : null}

      {progress ? (
        <Text style={styles.muted}>
          {t('setup.scanning', { done: progress.done, total: progress.total })}
          {progress.current ? ` (${progress.current})` : ''}
        </Text>
      ) : null}

      {message ? <Text style={styles.message} selectable>{t(message.key, message.options)}</Text> : null}
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
    color: playerColors.primaryText,
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
    color: playerColors.secondaryText,
    marginTop: 8,
    fontSize: 18,
    lineHeight: 24,
  },
  message: {
    color: playerColors.secondaryText,
    marginTop: 16,
    fontSize: 18,
    lineHeight: 25,
  },
});
