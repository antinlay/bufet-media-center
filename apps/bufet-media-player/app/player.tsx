import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoPlayer, type VideoSource } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { NoContent } from '@/components/no-content';
import {
  HeartbeatIcon,
  PlayerButton,
  PlayerDivider,
  PlayerSurface,
  RefreshIcon,
  SetupIcon,
  playerDesignStyles,
} from '@/components/ui/player-design';
import { playerColors } from '@/components/ui/player-theme';
import { videoSourceFor } from '@/features/player/player-media';
import { useKeepScreenAwake } from '@/features/player/use-keep-screen-awake';
import { usePlayerPlaylist } from '@/features/player/use-player-playlist';
import { usePlayerLocalization } from '@/localization/player-localization';
import { PlayerService } from '@/services/player-service';

type PlayerParams = {
  deviceId?: string;
};

export default function PlayerScreen() {
  const router = useRouter();
  const { t } = usePlayerLocalization();
  useKeepScreenAwake();
  const { deviceId } = useLocalSearchParams<PlayerParams>();
  const {
    activeVideoIndex,
    apiBaseUrl,
    currentIndex,
    currentItem,
    hasError,
    loading,
    playNext,
    playlist,
    retry,
  } = usePlayerPlaylist(deviceId);
  const preparedVideoRef = useRef<{ key: string | null; promise: Promise<void> }[]>([
    { key: null, promise: Promise.resolve() },
    { key: null, promise: Promise.resolve() },
  ]);

  const handleVideoEnd = useCallback(() => {
    playNext();
  }, [playNext]);

  const currentVideoItem = useMemo(() => {
    return currentItem?.type === 'VIDEO' ? currentItem : null;
  }, [currentItem]);

  const nextItem = useMemo(() => {
    if (!playlist.length) return null;
    return playlist[(currentIndex + 1) % playlist.length] ?? null;
  }, [playlist, currentIndex]);

  const currentSource = useMemo(() => videoSourceFor(currentVideoItem), [currentVideoItem]);

  const nextSource = useMemo(() => videoSourceFor(nextItem), [nextItem]);

  const playerA = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = true;
  });
  const playerB = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = true;
  });

  const currentPlayer = activeVideoIndex === 0 ? playerA : playerB;
  const nextPlayer = activeVideoIndex === 0 ? playerB : playerA;
  const currentPlayerSlot = activeVideoIndex;
  const nextPlayerSlot = activeVideoIndex === 0 ? 1 : 0;

  const prepareVideo = useCallback((slot: number, player: VideoPlayer, source: VideoSource, key: string) => {
    const prepared = preparedVideoRef.current[slot];
    if (prepared.key === key) return prepared.promise;

    const promise = player.replaceAsync(source).catch((error) => {
      if (preparedVideoRef.current[slot]?.key === key) {
        preparedVideoRef.current[slot] = { key: null, promise: Promise.resolve() };
      }
      throw error;
    });
    preparedVideoRef.current[slot] = { key, promise };
    return promise;
  }, []);

  useEffect(() => {
    let active = true;
    if (!currentSource || !currentVideoItem) {
      currentPlayer.pause();
      return undefined;
    }

    void prepareVideo(currentPlayerSlot, currentPlayer, currentSource, currentVideoItem.url)
      .then(() => {
        if (active) {
          currentPlayer.currentTime = 0;
          currentPlayer.play();
        }
      })
      .catch((videoError) => console.warn('Current video load failed', videoError));
    return () => {
      active = false;
    };
  }, [currentPlayer, currentPlayerSlot, currentSource, currentVideoItem, prepareVideo]);

  useEffect(() => {
    return () => {
      try {
        playerA.pause();
        playerB.pause();
      } catch {
        // ignore
      }
    };
  }, [playerA, playerB]);

  useEffect(() => {
    if (!nextSource || !nextItem) return;
    let active = true;
    void prepareVideo(nextPlayerSlot, nextPlayer, nextSource, nextItem.url)
      .then(() => {
        if (active) {
          nextPlayer.pause();
          nextPlayer.currentTime = 0;
        }
      })
      .catch((videoError) => console.warn('Next video preload failed', videoError));
    return () => {
      active = false;
    };
  }, [nextItem, nextPlayer, nextPlayerSlot, nextSource, prepareVideo]);

  useEffect(() => {
    if (nextItem?.type === 'IMAGE' && nextItem.url) {
      Image.prefetch(nextItem.url, 'memory-disk').catch(() => undefined);
    }
  }, [nextItem]);

  useEffect(() => {
    const subscription = currentPlayer.addListener('playToEnd', handleVideoEnd);
    return () => {
      try {
        subscription.remove();
      } catch {
        // ignore
      }
    };
  }, [currentPlayer, handleVideoEnd]);

  useEffect(() => {
    if (currentItem?.type === 'IMAGE') {
      const duration = currentItem.durationSeconds ?? 10;
      const timeout = setTimeout(playNext, duration * 1000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [currentItem, playNext]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={playerColors.accent} />
      </View>
    );
  }

  if (hasError || !currentItem) {
    return (
      <PlayerSurface>
        <View style={playerDesignStyles.errorPage}>
          <NoContent />
          <PlayerDivider />
          <View style={playerDesignStyles.errorDetails}>
            <Text style={playerDesignStyles.errorTitle} selectable>
              {t('player.playlistLoadFailed')}
            </Text>
            <Text style={playerDesignStyles.errorHint} selectable>{t('common.api')}: {apiBaseUrl ?? PlayerService.getCachedApiBaseUrl() ?? `(${t('common.notResolved')})`}</Text>
            <View style={playerDesignStyles.errorActions}>
              <PlayerButton
                label={t('common.retry')}
                icon={<RefreshIcon />}
                variant="primary"
                onPress={retry}
                hasTVPreferredFocus
                style={playerDesignStyles.retryButton}
              />
              <PlayerButton
                label={t('common.openSetup')}
                icon={<SetupIcon />}
                variant="secondary"
                onPress={() => router.push('/setup')}
                style={playerDesignStyles.compactButton}
              />
              <PlayerButton
                label={t('common.openDiagnostics')}
                icon={<HeartbeatIcon size={36} />}
                variant="secondary"
                onPress={() => router.push('/diagnostics')}
                style={playerDesignStyles.compactButton}
              />
            </View>
          </View>
        </View>
      </PlayerSurface>
    );
  }

  if (currentItem.type === 'VIDEO') {
    return (
      <View style={styles.container}>
        {currentVideoItem?.thumbnailUrl ? (
          <Image
            source={{ uri: currentVideoItem.thumbnailUrl }}
            style={styles.videoBackdrop}
            contentFit="cover"
            blurRadius={12}
            cachePolicy="memory-disk"
            priority="high"
          />
        ) : null}
        <VideoView
          player={currentPlayer}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: currentItem.url }}
        style={styles.videoBackdrop}
        contentFit="cover"
        blurRadius={12}
        cachePolicy="memory-disk"
        priority="high"
        transition={120}
      />
      <Image
        source={{ uri: currentItem.url }}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory-disk"
        priority="high"
        transition={120}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoBackdrop: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
});
