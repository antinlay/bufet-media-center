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
import { PlayerService } from '@/services/player-service';

type PairingParams = {
  deviceId?: string;
};

export default function PairingScreen() {
  const router = useRouter();
  const { deviceId } = useLocalSearchParams<PairingParams>();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [pairingData, setPairingData] = useState<{ code: string; pairUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

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
      const message = err instanceof Error ? err.message : 'Failed to create pairing code';
      setError(message);
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
          <ActivityIndicator size="large" color="#ff9700" style={styles.spinner} />
          <Text style={styles.text}>Creating pairing code...</Text>
        </View>
      </PlayerSurface>
    );
  }

  if (error || !pairingData) {
    const baseUrl = PlayerService.getCachedApiBaseUrl();
    return (
      <PlayerSurface scroll={false}>
        <View style={styles.errorContainer}>
          <PlayerBrandHeader />
          <Text style={styles.errorText} selectable>{error ?? 'Unknown error occurred'}</Text>
          <Text style={styles.hintText} selectable>API: {baseUrl ?? '(not resolved)'}</Text>
          <View style={styles.actions}>
            <PlayerButton
              label="Retry"
              icon={<RefreshIcon />}
              variant="primary"
              onPress={() => void loadPairing()}
              hasTVPreferredFocus
              style={styles.actionButton}
            />
            <PlayerButton
              label="Open setup"
              icon={<SetupIcon />}
              variant="secondary"
              onPress={() => router.push('/setup')}
              style={styles.actionButton}
            />
            <PlayerButton
              label="Open diagnostics"
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
        <Text style={styles.title}>Pair Your Device</Text>
        <Text style={styles.subtitle}>Scan the QR code or visit the URL below</Text>

        <View style={styles.qrContainer}>
          <QRCode value={pairingData.pairUrl} size={250} backgroundColor="#ffffff" color="#000000" />
        </View>

        <Text style={styles.codeText} selectable>Pairing Code: {pairingData.code}</Text>
        <Text style={styles.urlText} selectable>{pairingData.pairUrl}</Text>

        <Text style={styles.statusText}>Waiting for pairing confirmation...</Text>
        <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
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
    color: '#ffffff',
    fontSize: 52,
    lineHeight: 62,
    fontWeight: '700',
    marginTop: 74,
  },
  subtitle: {
    color: '#a9aaad',
    fontSize: 25,
    lineHeight: 32,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 22,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff9700',
    marginBottom: 28,
    boxShadow: '0 0 20px 2px rgba(247, 126, 0, 0.3)',
  },
  codeText: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  urlText: {
    color: '#a9aaad',
    fontSize: 18,
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 26,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 29,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 22,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 54,
  },
  hintText: {
    color: '#a9aaad',
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
    color: '#ffffff',
    marginTop: 24,
    fontSize: 24,
  },
});
