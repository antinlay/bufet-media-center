import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoPlayer, type VideoSource } from 'expo-video';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
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
import { PlayerService, isAbsoluteUrl } from '@/services/player-service';
import { PlaylistItem } from '@bufet/shared';

type PlayerParams = {
  deviceId?: string;
};

function toMediaUrl(source: string, baseUrl: string): string {
  return isAbsoluteUrl(source) ? source : `${baseUrl}${source.startsWith('/') ? '' : '/'}${source}`;
}

function playlistsMatch(left: PlaylistItem[], right: PlaylistItem[]): boolean {
  return left.length === right.length && left.every((item, index) => {
    const other = right[index];
    return item.id === other.id
      && item.type === other.type
      && item.url === other.url
      && item.thumbnailUrl === other.thumbnailUrl
      && item.durationSeconds === other.durationSeconds
      && item.order === other.order;
  });
}

async function warmImageCache(items: PlaylistItem[]): Promise<void> {
  const urls = items.filter((item) => item.type === 'IMAGE').map((item) => item.url);
  if (urls.length === 0) return;
  try {
    const warmed = await Image.prefetch(urls, 'memory-disk');
    if (!warmed) console.warn('One or more playlist images could not be preloaded');
  } catch (error) {
    console.warn('Playlist image preload failed', error);
  }
}

function videoSourceFor(item: PlaylistItem | null): VideoSource | null {
  if (!item || item.type !== 'VIDEO' || !item.url) return null;
  return { uri: item.url, useCaching: isAbsoluteUrl(item.url) };
}

export default function PlayerScreen() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const tag = 'player-screen';

    const requestWakeLock = async () => {
      if (process.env.EXPO_OS === 'web' && typeof document !== 'undefined') {
        if (document.visibilityState !== 'visible') return;
      }
      try {
        await activateKeepAwakeAsync(tag);
      } catch (error) {
        console.warn('Keep awake failed', error);
      }
    };

    requestWakeLock();

    if (process.env.EXPO_OS === 'web' && typeof document !== 'undefined') {
      const handleVisibility = () => {
        if (!active) return;
        if (document.visibilityState === 'visible') {
          requestWakeLock();
        } else {
          try {
            deactivateKeepAwake(tag);
          } catch (error) {
            console.warn('Keep awake release failed', error);
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        active = false;
        document.removeEventListener('visibilitychange', handleVisibility);
        try {
          deactivateKeepAwake(tag);
        } catch (error) {
          console.warn('Keep awake release failed', error);
        }
      };
    }

    return () => {
      active = false;
      try {
        deactivateKeepAwake(tag);
      } catch (error) {
        console.warn('Keep awake release failed', error);
      }
    };
  }, []);

  const { deviceId } = useLocalSearchParams<PlayerParams>();
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(PlayerService.getCachedApiBaseUrl());
  const [manifestScreenId, setManifestScreenId] = useState<string | number | null>(null);
  const playlistAbortRef = useRef<AbortController | null>(null);
  const realtimeCleanupRef = useRef<(() => Promise<void>) | null>(null);
  const playlistRef = useRef<PlaylistItem[]>([]);
  const currentIndexRef = useRef(0);
  const preparedVideoRef = useRef<{ key: string | null; promise: Promise<void> }[]>([
    { key: null, promise: Promise.resolve() },
    { key: null, promise: Promise.resolve() },
  ]);

  const applyPlaylist = useCallback((items: PlaylistItem[]) => {
    const previous = playlistRef.current;
    if (playlistsMatch(previous, items)) return;

    const currentId = previous[currentIndexRef.current]?.id;
    const preservedIndex = currentId ? items.findIndex((item) => item.id === currentId) : -1;
    const nextIndex = preservedIndex >= 0 ? preservedIndex : 0;
    playlistRef.current = items;
    currentIndexRef.current = nextIndex;
    setPlaylist(items);
    setCurrentIndex(nextIndex);
  }, []);

  const loadPlaylist = useCallback(async () => {
    if (!deviceId) return;
    playlistAbortRef.current?.abort();
    const controller = new AbortController();
    playlistAbortRef.current = controller;
    try {
      const baseUrl = await PlayerService.ensureApiBaseUrl(deviceId, controller.signal);
      if (controller.signal.aborted) return;
      setApiBaseUrl(baseUrl);
      const config = await PlayerService.getDeviceConfig(deviceId, baseUrl, controller.signal);
      if (controller.signal.aborted) return;
      const sortedItems = [...config.playlist.items]
        .filter((item) => item.url.trim().length > 0)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          ...item,
          url: toMediaUrl(item.url, baseUrl),
          thumbnailUrl: item.thumbnailUrl ? toMediaUrl(item.thumbnailUrl, baseUrl) : null,
        }));
      const configuredScreenId = config.settings?.screen_id;
      await PlayerService.saveCachedPlaylist({
        items: sortedItems,
        configVersion: typeof config.settings?.config_version === 'string' ? config.settings.config_version : undefined,
      });
      const cachedItems = await PlayerService.cachePlaylistMedia(sortedItems);
      if (controller.signal.aborted) return;
      await warmImageCache(cachedItems);
      if (controller.signal.aborted) return;
      applyPlaylist(cachedItems);
      setManifestScreenId(
        typeof configuredScreenId === 'string' || typeof configuredScreenId === 'number' ? configuredScreenId : null,
      );
      setLoading(false);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (playlistRef.current.length > 0) {
        console.warn('Playlist refresh error:', err);
        return;
      }
      try {
        const cached = await PlayerService.readCachedPlaylist();
        if (cached?.items?.length) {
          const cachedItems = await PlayerService.applyMediaCache(cached.items);
          await warmImageCache(cachedItems);
          applyPlaylist(cachedItems);
          setLoading(false);
          setError(null);
          return;
        }
      } catch (cacheError) {
        console.warn('Cached playlist load error:', cacheError);
      }
      setError('Не удалось загрузить плейлист');
      setLoading(false);
      console.error('Playlist load error:', err);
    } finally {
      if (playlistAbortRef.current === controller) {
        playlistAbortRef.current = null;
      }
    }
  }, [applyPlaylist, deviceId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await realtimeCleanupRef.current?.();
      realtimeCleanupRef.current = null;
      if (manifestScreenId === null) return;
      const cleanup = await PlayerService.subscribeToPlaylistChanges(manifestScreenId, () => {
        if (active) void loadPlaylist();
      });
      if (active) {
        realtimeCleanupRef.current = cleanup;
      } else {
        await cleanup?.();
      }
    })();

    return () => {
      active = false;
      void realtimeCleanupRef.current?.();
      realtimeCleanupRef.current = null;
    };
  }, [loadPlaylist, manifestScreenId]);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void (async () => {
        try {
          const cached = await PlayerService.readCachedPlaylist();
          if (cached?.items?.length) {
            const cachedItems = await PlayerService.applyMediaCache(cached.items);
            await warmImageCache(cachedItems);
            applyPlaylist(cachedItems);
            setLoading(false);
            setError(null);
          }
        } catch (cacheError) {
          console.warn('Cached playlist preload error:', cacheError);
        }
        await loadPlaylist();
      })();
    }, 0);
    const interval = setInterval(loadPlaylist, 60_000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
      playlistAbortRef.current?.abort();
      playlistAbortRef.current = null;
      void realtimeCleanupRef.current?.();
      realtimeCleanupRef.current = null;
    };
  }, [applyPlaylist, loadPlaylist]);

  const currentItem = playlist[currentIndex] ?? null;

  const playNext = useCallback(() => {
    const items = playlistRef.current;
    if (items.length === 0) return;
    const nextIndex = (currentIndexRef.current + 1) % items.length;
    if (items[nextIndex]?.type === 'VIDEO') {
      setActiveVideoIndex((previousPlayer) => (previousPlayer === 0 ? 1 : 0));
    }
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
  }, []);

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
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (error || !currentItem) {
    const last = PlayerService.getLastNetworkError();
    return (
      <PlayerSurface>
        <View style={playerDesignStyles.errorPage}>
          <NoContent />
          <PlayerDivider />
          <View style={playerDesignStyles.errorDetails}>
            <Text style={playerDesignStyles.errorTitle} selectable>
              {error ?? last?.message ?? 'Не удалось загрузить плейлист'}
            </Text>
            <Text style={playerDesignStyles.errorHint} selectable>API: {apiBaseUrl ?? PlayerService.getCachedApiBaseUrl() ?? '(не определено)'}</Text>
            <View style={playerDesignStyles.errorActions}>
              <PlayerButton
                label="Повторить"
                icon={<RefreshIcon />}
                variant="primary"
                onPress={() => { setLoading(true); setError(null); void loadPlaylist(); }}
                hasTVPreferredFocus
                style={playerDesignStyles.retryButton}
              />
              <PlayerButton
                label="Открыть настройки"
                icon={<SetupIcon />}
                variant="secondary"
                onPress={() => router.push('/setup')}
                style={playerDesignStyles.compactButton}
              />
              <PlayerButton
                label="Открыть диагностику"
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
