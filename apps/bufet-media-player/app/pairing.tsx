import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  HeartbeatIcon,
  PlayerBrandHeader,
  PlayerButton,
  PlayerSurface,
  RefreshIcon,
  SetupIcon,
} from '@/components/ui/player-design';
import { playerColors } from '@/components/ui/player-theme';
import { usePlayerLocalization } from '@/localization/player-localization';
import { PlayerService } from '@/services/player-service';

type PairingParams = {
  deviceId?: string;
};

export default function PairingScreen() {
  const router = useRouter();
  const { t } = usePlayerLocalization();
  const { deviceId } = useLocalSearchParams<PairingParams>();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [pairingData, setPairingData] = useState<{ code: string; pairUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const clearPoll = () => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  const loadPairing = async () => {
    if (!deviceId) {
      const generatedId = await PlayerService.getOrCreateDeviceId();
      router.replace({ pathname: '/pairing', params: { deviceId: generatedId } });
      return;
    }

    clearPoll();
    setLoading(true);
    setHasError(false);

    try {
      const pairing = await PlayerService.createPairing(deviceId);
      setPairingData(pairing);

      const poll = async () => {
        if (!pollRef.current) return;
        const controller = new AbortController();
        pollAbortRef.current = controller;
        try {
          const status = await PlayerService.getPairingStatus(deviceId, controller.signal);
          if (status.status === 'PAIRED') {
            clearPoll();
            router.replace({ pathname: '/player', params: { deviceId } });
            return;
          }
        } catch (statusErr) {
          if (!controller.signal.aborted) {
            console.error('Status check error:', statusErr);
          }
        } finally {
          if (pollAbortRef.current === controller) {
            pollAbortRef.current = null;
          }
          if (pollRef.current) {
            pollRef.current = setTimeout(() => void poll(), 3000);
          }
        }
      };
      pollRef.current = setTimeout(() => void poll(), 3000);
    } catch (err) {
      setHasError(true);
      console.error('Pairing error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadPairing(), 0);

    return () => {
      clearTimeout(initialLoad);
      clearPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, router]);

  if (loading) {
    return (
      <PlayerSurface scroll={false}>
        <View style={styles.loadingContainer}>
          <PlayerBrandHeader />
          <ActivityIndicator size="large" color={playerColors.accent} style={styles.spinner} />
          <Text style={styles.text}>{t('pairing.creating')}</Text>
        </View>
      </PlayerSurface>
    );
  }

  if (hasError || !pairingData) {
    const baseUrl = PlayerService.getCachedApiBaseUrl();
    return (
      <PlayerSurface scroll={false}>
        <View style={styles.errorContainer}>
          <PlayerBrandHeader />
          <Text style={styles.errorText} selectable>{t(hasError ? 'pairing.createFailed' : 'common.unknownError')}</Text>
          <Text style={styles.hintText} selectable>{t('common.api')}: {baseUrl ?? `(${t('common.notResolved')})`}</Text>
          <View style={styles.actions}>
            <PlayerButton
              label={t('common.retry')}
              icon={<RefreshIcon />}
              variant="primary"
              onPress={() => void loadPairing()}
              hasTVPreferredFocus
              style={styles.actionButton}
            />
            <PlayerButton
              label={t('common.openSetup')}
              icon={<SetupIcon />}
              variant="secondary"
              onPress={() => router.push('/setup')}
              style={styles.actionButton}
            />
            <PlayerButton
              label={t('common.openDiagnostics')}
              icon={<HeartbeatIcon size={36} />}
              variant="secondary"
              onPress={() => router.push('/diagnostics')}
              style={styles.actionButton}
            />
          </View>
        </View>
      </PlayerSurface>
    );
  }

  return (
    <PlayerSurface contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <PlayerBrandHeader />
        <Text style={styles.title}>{t('pairing.title')}</Text>
        <Text style={styles.subtitle}>{t('pairing.subtitle')}</Text>

        <View style={styles.qrContainer}>
          <QRCode value={pairingData.pairUrl} size={250} backgroundColor="#ffffff" color="#000000" />
        </View>

        <Text style={styles.codeText} selectable>{t('pairing.code', { code: pairingData.code })}</Text>
        <Text style={styles.urlText} selectable>{pairingData.pairUrl}</Text>

        <Text style={styles.statusText}>{t('pairing.waiting')}</Text>
        <ActivityIndicator size="small" color={playerColors.primaryText} style={styles.spinner} />
      </View>
    </PlayerSurface>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 46,
    paddingTop: 54,
    paddingBottom: 42,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 46,
  },
  title: {
    color: playerColors.primaryText,
    fontSize: 52,
    lineHeight: 62,
    fontWeight: '700',
    marginTop: 74,
  },
  subtitle: {
    color: playerColors.secondaryText,
    fontSize: 25,
    lineHeight: 32,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  qrContainer: {
    backgroundColor: playerColors.primaryText,
    padding: 22,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: playerColors.accent,
    marginBottom: 28,
    boxShadow: '0 0 20px 2px rgba(247, 126, 0, 0.3)',
  },
  codeText: {
    color: playerColors.primaryText,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  urlText: {
    color: playerColors.secondaryText,
    fontSize: 18,
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 26,
  },
  statusText: {
    color: playerColors.primaryText,
    fontSize: 22,
    lineHeight: 29,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 22,
  },
  errorText: {
    color: playerColors.primaryText,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 54,
  },
  hintText: {
    color: playerColors.secondaryText,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    minWidth: 340,
    minHeight: 76,
  },
  text: {
    color: playerColors.primaryText,
    marginTop: 24,
    fontSize: 24,
  },
});
