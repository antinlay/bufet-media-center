import { useCallback, useEffect, useRef, useState } from 'react';

import type { PlaylistItem } from '@bufet/shared';
import {
  playlistsMatch,
  toMediaUrl,
  warmImageCache,
} from '@/features/player/player-media';
import { PlayerService } from '@/services/player-service';

export function usePlayerPlaylist(deviceId?: string) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(PlayerService.getCachedApiBaseUrl());
  const [manifestScreenId, setManifestScreenId] = useState<string | number | null>(null);
  const playlistAbortRef = useRef<AbortController | null>(null);
  const realtimeCleanupRef = useRef<(() => Promise<void>) | null>(null);
  const playlistRef = useRef<PlaylistItem[]>([]);
  const currentIndexRef = useRef(0);

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
      setHasError(false);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (playlistRef.current.length > 0) {
        console.warn('Playlist refresh error:', error);
        return;
      }
      try {
        const cached = await PlayerService.readCachedPlaylist();
        if (cached?.items?.length) {
          const cachedItems = await PlayerService.applyMediaCache(cached.items);
          await warmImageCache(cachedItems);
          applyPlaylist(cachedItems);
          setLoading(false);
          setHasError(false);
          return;
        }
      } catch (cacheError) {
        console.warn('Cached playlist load error:', cacheError);
      }
      setHasError(true);
      setLoading(false);
      console.error('Playlist load error:', error);
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
            setHasError(false);
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

  const retry = useCallback(() => {
    setLoading(true);
    setHasError(false);
    void loadPlaylist();
  }, [loadPlaylist]);

  return {
    activeVideoIndex,
    apiBaseUrl,
    currentIndex,
    currentItem: playlist[currentIndex] ?? null,
    hasError,
    loading,
    playNext,
    playlist,
    retry,
  };
}
