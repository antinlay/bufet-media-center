import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PlayerService } from '@/services/player-service';

type PairingParams = {
  deviceId?: string;
};

export default function PairingScreen() {
  const router = useRouter();
  const { deviceId } = useLocalSearchParams<PairingParams>();

  const [pairingData, setPairingData] = useState<{ code: string; pairUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | undefined;

    const initializePairing = async () => {
      if (!deviceId) {
        const generatedId = await PlayerService.getOrCreateDeviceId();
        router.replace({ pathname: '/pairing', params: { deviceId: generatedId } });
        return;
      }
      try {
        const pairing = await PlayerService.createPairing(deviceId);
        setPairingData(pairing);

        poll = setInterval(async () => {
          try {
            const status = await PlayerService.getPairingStatus(deviceId);
            if (status.status === 'PAIRED') {
              clearInterval(poll);
              router.replace({ pathname: '/player', params: { deviceId } });
            }
          } catch (statusErr) {
            console.error('Status check error:', statusErr);
          }
        }, 3000);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create pairing code';
        setError(message);
        console.error('Pairing error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializePairing();

    return () => {
      if (poll) clearInterval(poll);
    };
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
        <Text style={styles.errorText}>{error ?? 'Unknown error occurred'}</Text>
        <Text style={styles.hintText}>API: {baseUrl ?? '(not resolved)'}</Text>
        <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              setError(null);
              setLoading(true);
            }}
          >
            <Text style={styles.linkLike}>Retry</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/setup')}>
            <Text style={styles.linkLike}>Open setup</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/diagnostics')}>
            <Text style={styles.linkLike}>Open diagnostics</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Pair Your Device</Text>
        <Text style={styles.subtitle}>Scan the QR code or visit the URL below</Text>

        <View style={styles.qrContainer}>
          <QRCode value={pairingData.pairUrl} size={250} backgroundColor="#ffffff" color="#000000" />
        </View>

        <Text style={styles.codeText}>Pairing Code: {pairingData.code}</Text>
        <Text style={styles.urlText}>{pairingData.pairUrl}</Text>

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
  linkLike: {
    color: '#4da3ff',
    marginTop: 12,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  actions: {
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
  },
});
