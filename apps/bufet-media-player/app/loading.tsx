import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { PlayerBrandHeader, PlayerSurface } from '@/components/ui/player-design';
import { playerColors } from '@/components/ui/player-theme';
import { usePlayerLocalization } from '@/localization/player-localization';
import { PlayerService } from '@/services/player-service';

export default function LoadingScreen() {
  const { t } = usePlayerLocalization();
  const [hasError, setHasError] = useState(false);

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
        setHasError(true);
        setTimeout(() => router.replace('/setup'), 500);
      }
    };

    bootstrap();
  }, []);

  return (
    <PlayerSurface scroll={false}>
      <View style={styles.container}>
        <PlayerBrandHeader />
        <ActivityIndicator size="large" color={playerColors.accent} style={styles.spinner} />
        <Text style={styles.text}>{t(hasError ? 'loading.apiUnavailable' : 'loading.initializing')}</Text>
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
    color: playerColors.primaryText,
    marginTop: 24,
    fontSize: 24,
  },
});
