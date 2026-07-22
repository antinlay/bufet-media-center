import { Image } from 'expo-image';
import type { VideoSource } from 'expo-video';

import type { PlaylistItem } from '@bufet/shared';
import { isAbsoluteUrl } from '@/services/player-service';

export function toMediaUrl(source: string, baseUrl: string): string {
  return isAbsoluteUrl(source) ? source : `${baseUrl}${source.startsWith('/') ? '' : '/'}${source}`;
}

export function playlistsMatch(left: PlaylistItem[], right: PlaylistItem[]): boolean {
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

export async function warmImageCache(items: PlaylistItem[]): Promise<void> {
  const urls = items.filter((item) => item.type === 'IMAGE').map((item) => item.url);
  if (urls.length === 0) return;

  try {
    const warmed = await Image.prefetch(urls, 'memory-disk');
    if (!warmed) console.warn('One or more playlist images could not be preloaded');
  } catch (error) {
    console.warn('Playlist image preload failed', error);
  }
}

export function videoSourceFor(item: PlaylistItem | null): VideoSource | null {
  if (!item || item.type !== 'VIDEO' || !item.url) return null;
  return { uri: item.url, useCaching: isAbsoluteUrl(item.url) };
}
