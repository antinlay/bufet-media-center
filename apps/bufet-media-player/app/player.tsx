import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { NoContent } from '@/components/no-content';
import { PlayerService, isAbsoluteUrl } from '@/services/player-service';
import { PlaylistItem } from '@bufet/shared';

type PlayerParams = {
  deviceId?: string;
};

export default function PlayerScreen() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const tag = 'player-screen';

    const requestWakeLock = async () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        if (document.visibilityState !== 'visible') return;
      }
      try {
        await activateKeepAwakeAsync(tag);
      } catch (error) {
        console.warn('Keep awake failed', error);
      }
    };

    requestWakeLock();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
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
  const [currentItem, setCurrentItem] = useState<PlaylistItem | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(PlayerService.getCachedApiBaseUrl());

  const loadPlaylist = async () => {
    if (!deviceId) return;
    try {
      const baseUrl = await PlayerService.ensureApiBaseUrl(deviceId);
      setApiBaseUrl(baseUrl);
      const config = await PlayerService.getDeviceConfig(deviceId, baseUrl);
      const sortedItems = [...config.playlist.items]
        .filter((item) => item.mediaUrl || item.url) // remove broken entries
        .sort((a, b) => {
          const aOrder = a.order ?? a.position ?? a.id;
          const bOrder = b.order ?? b.position ?? b.id;
          return aOrder - bOrder;
        })
        .map((item) => ({
          ...item,
          url: (() => {
            const src = item.mediaUrl ?? item.url;
            if (!src) return undefined;
            return isAbsoluteUrl(src)
              ? src
              : `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
          })(),
          thumbnailUrl: item.thumbnailUrl ?? (item as any).poster ?? item.mediaUrl ?? item.url,
        }));
      setPlaylist(sortedItems);
      setCurrentIndex(0);
      setLoading(false);
      setError(null);
      await PlayerService.saveCachedPlaylist({
        items: sortedItems,
        configVersion: (config.settings as any)?.config_version,
      });
      PlayerService.cachePlaylistMedia(sortedItems).catch((cacheError) => {
        console.warn('Playlist cache error:', cacheError);
      });
    } catch (err) {
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
    }
  };

  useEffect(() => {
    loadPlaylist();
    const interval = setInterval(loadPlaylist, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

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

  useEffect(() => {
    if (playlist.length > 0) {
      setCurrentItem(playlist[currentIndex]);
    }
  }, [playlist, currentIndex]);

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
    const unsub = currentPlayer.addListener('playToEnd', handleVideoEnd);
    return () => {
      try {
        unsub?.();
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
          <Text style={styles.errorText}>
            {error ?? last?.message ?? 'No content'}
          </Text>
          <Text style={styles.hintText}>API: {apiBaseUrl ?? PlayerService.getCachedApiBaseUrl() ?? '(not resolved)'}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => { setLoading(true); setError(null); loadPlaylist(); }}>
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
            resizeMode="cover"
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
        resizeMode="cover"
        blurRadius={12}
      />
      <Image
        key={currentItem.id}
        source={{ uri: currentItem.url }}
        style={styles.image}
        resizeMode="contain"
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
    ...StyleSheet.absoluteFillObject,
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
  linkLike: {
    color: '#4da3ff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
