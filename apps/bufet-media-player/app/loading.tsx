import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { PlayerBrandHeader, PlayerSurface } from '@/components/ui/player-design';
import { PlayerService } from '@/services/player-service';

export default function LoadingScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const deviceId = await PlayerService.getOrCreateDeviceId();
        const result = await PlayerService.bootstrap(deviceId);

        if (result.status === 'PAIRED') {
          router.replace({ pathname: '/player', params: { deviceId } });
        } else {
          router.replace({ pathname: '/pairing', params: { deviceId } });
        }
      } catch (err) {
        console.info('Initialization fallback:', err);
        setError('API is unreachable. Opening setup.');
        setTimeout(() => router.replace('/setup'), 500);
      }
    };

    bootstrap();
  }, []);

  return (
    <PlayerSurface scroll={false}>
      <View style={styles.container}>
        <PlayerBrandHeader />
        <ActivityIndicator size="large" color="#ff9700" style={styles.spinner} />
        <Text style={styles.text}>{error ?? 'Initializing BUFET Player...'}</Text>
      </View>
    </PlayerSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginTop: 38,
  },
  text: {
    color: '#ffffff',
    marginTop: 24,
    fontSize: 24,
  },
});
