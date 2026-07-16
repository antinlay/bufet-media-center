import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { NoContent } from '@/components/no-content';
import { TvButton } from '@/components/ui/tv-button';
import { PlayerService, isAbsoluteUrl } from '@/services/player-service';
import { PlaylistItem } from '@bufet/shared';

type PlayerParams = {
  deviceId?: string;
};

function toMediaUrl(source: string, baseUrl: string): string {
  return isAbsoluteUrl(source) ? source : `${baseUrl}${source.startsWith('/') ? '' : '/'}${source}`;
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
  const playlistAbortRef = useRef<AbortController | null>(null);

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
      setPlaylist(sortedItems);
      setCurrentIndex(0);
      setLoading(false);
      setError(null);
      await PlayerService.saveCachedPlaylist({
        items: sortedItems,
        configVersion: typeof config.settings?.config_version === 'string' ? config.settings.config_version : undefined,
      });
      PlayerService.cachePlaylistMedia(sortedItems).catch((cacheError) => {
        console.warn('Playlist cache error:', cacheError);
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      try {
        const cached = await PlayerService.readCachedPlaylist();
        if (cached?.items?.length) {
          const cachedItems = await PlayerService.applyMediaCache(cached.items);
          setPlaylist(cachedItems);
          setCurrentIndex(0);
          setLoading(false);
          setError(null);
          return;
        }
      } catch (cacheError) {
        console.warn('Cached playlist load error:', cacheError);
      }
      setError('Failed to load playlist');
      setLoading(false);
      console.error('Playlist load error:', err);
    } finally {
      if (playlistAbortRef.current === controller) {
        playlistAbortRef.current = null;
      }
    }
  }, [deviceId]);

  useEffect(() => {
    const initialLoad = setTimeout(() => void loadPlaylist(), 0);
    const interval = setInterval(loadPlaylist, 60_000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
      playlistAbortRef.current?.abort();
      playlistAbortRef.current = null;
    };
  }, [loadPlaylist]);

  const currentItem = playlist[currentIndex] ?? null;

  const playNext = useCallback(() => {
    if (playlist.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  }, [playlist.length]);

  const handleVideoEnd = useCallback(() => {
    if (currentItem?.type === 'VIDEO') {
      setActiveVideoIndex((prev) => (prev === 0 ? 1 : 0));
    }
    playNext();
  }, [currentItem?.type, playNext]);

  const currentVideoItem = useMemo(() => {
    return currentItem?.type === 'VIDEO' ? currentItem : null;
  }, [currentItem]);

  const nextItem = useMemo(() => {
    if (!playlist.length) return null;
    return playlist[(currentIndex + 1) % playlist.length] ?? null;
  }, [playlist, currentIndex]);

  const currentSource = useMemo<VideoSource | null>(() => {
    if (!currentVideoItem?.url) return null;
    return currentVideoItem.url;
  }, [currentVideoItem]);

  const nextSource = useMemo<VideoSource | null>(() => {
    if (!nextItem || nextItem.type !== 'VIDEO' || !nextItem.url) return null;
    return nextItem.url;
  }, [nextItem]);

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

  useEffect(() => {
    if (!currentSource) return;
    currentPlayer.replace(currentSource);
    currentPlayer.play();
  }, [currentSource, currentPlayer]);

  useEffect(() => {
    return () => {
      try {
        currentPlayer.pause();
        nextPlayer.pause();
      } catch {
        // ignore
      }
    };
  }, [currentPlayer, nextPlayer]);

  useEffect(() => {
    if (!nextSource) return;
    nextPlayer.replace(nextSource);
  }, [nextSource, nextPlayer]);

  useEffect(() => {
    if (nextItem?.type === 'IMAGE' && nextItem.url) {
      Image.prefetch(nextItem.url).catch(() => undefined);
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
      <View style={styles.container}>
        <View style={styles.noContent}>
          <NoContent />
          <Text style={styles.errorText} selectable>
            {error ?? last?.message ?? 'No content'}
          </Text>
          <Text style={styles.hintText} selectable>API: {apiBaseUrl ?? PlayerService.getCachedApiBaseUrl() ?? '(not resolved)'}</Text>
          <View style={styles.actions}>
            <TvButton label="Retry" onPress={() => { setLoading(true); setError(null); void loadPlaylist(); }} hasTVPreferredFocus />
            <TvButton label="Open setup" variant="secondary" onPress={() => router.push('/setup')} style={styles.actionButton} />
            <TvButton label="Open diagnostics" variant="ghost" onPress={() => router.push('/diagnostics')} style={styles.actionButton} />
          </View>
        </View>
      </View>
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
        key={`${currentItem.id}-backdrop`}
        source={{ uri: currentItem.url }}
        style={styles.videoBackdrop}
        contentFit="cover"
        blurRadius={12}
      />
      <Image
        key={currentItem.id}
        source={{ uri: currentItem.url }}
        style={styles.image}
        contentFit="contain"
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
  noContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  hintText: {
    color: '#cccccc',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  actions: {
    marginTop: 10,
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    marginTop: 12,
    minWidth: 220,
  },
});
