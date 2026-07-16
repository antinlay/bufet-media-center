import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TvButton } from '@/components/ui/tv-button';
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.text}>Creating pairing code...</Text>
      </View>
    );
  }

  if (error || !pairingData) {
    const baseUrl = PlayerService.getCachedApiBaseUrl();
    return (
      <View style={styles.container}>
        <Text style={styles.errorText} selectable>{error ?? 'Unknown error occurred'}</Text>
        <Text style={styles.hintText} selectable>API: {baseUrl ?? '(not resolved)'}</Text>
        <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
        <View style={styles.actions}>
          <TvButton label="Retry" onPress={() => void loadPairing()} hasTVPreferredFocus />
          <TvButton label="Open setup" variant="secondary" onPress={() => router.push('/setup')} style={styles.actionButton} />
          <TvButton label="Open diagnostics" variant="ghost" onPress={() => router.push('/diagnostics')} style={styles.actionButton} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  codeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  urlText: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  hintText: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    marginTop: 12,
    minWidth: 220,
  },
  text: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
  },
});
