import type { ConcertoContent, ConcertoPlaylistItem, ConcertoScreen } from '@bufet/shared';

import { apiBaseUrl } from '../../lib/api';
import type { PickedFile } from '../../lib/upload';

export type PlaylistMediaType = 'Graphic' | 'Video';

export interface PlaylistItemViewModel {
  submissionId: number;
  contentId: number;
  type: PlaylistMediaType;
  title: string;
  duration: number | null;
  position: number;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
}

export interface PlaylistEditorViewModel {
  screenId: number;
  screenName: string;
  organizationName: string;
  items: PlaylistItemViewModel[];
}

export interface LibraryItemViewModel {
  id: number;
  type: PlaylistMediaType;
  title: string;
  duration: number | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
}

export interface UrlPreview {
  title: string;
  sourceLabel: string;
  thumbnailUrl: string | null;
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^(https?:|data:|file:|blob:)/i.test(url)) return url;
  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function mapPlaylistItem(item: ConcertoPlaylistItem): PlaylistItemViewModel {
  const type: PlaylistMediaType = item.type === 'Video' ? 'Video' : 'Graphic';
  return {
    submissionId: item.submissionId,
    contentId: item.contentId,
    type,
    title: item.name?.trim() || (type === 'Video' ? 'Видео' : 'Изображение'),
    duration: item.duration ?? null,
    position: item.position,
    mediaUrl: resolveMediaUrl(item.mediaUrl),
    thumbnailUrl: resolveMediaUrl(item.thumbnailUrl ?? (type === 'Graphic' ? item.mediaUrl : null)),
  };
}

export function mapPlaylistEditor(
  screen: ConcertoScreen,
  items: ConcertoPlaylistItem[],
): PlaylistEditorViewModel {
  return {
    screenId: screen.id,
    screenName: screen.name,
    organizationName: screen.group?.name ?? 'Без организации',
    items: [...items].sort((left, right) => left.position - right.position).map(mapPlaylistItem),
  };
}

export function mapLibraryItem(content: ConcertoContent): LibraryItemViewModel | null {
  if (content.type !== 'Graphic' && content.type !== 'Video') return null;
  return {
    id: content.id,
    type: content.type,
    title: content.name?.trim() || `${content.type === 'Video' ? 'Видео' : 'Изображение'} #${content.id}`,
    duration: content.duration ?? null,
    thumbnailUrl: resolveMediaUrl(content.thumbnailUrl ?? content.imageUrl),
    mediaUrl: resolveMediaUrl(content.url ?? content.imageUrl),
  };
}

export function mediaTypeForFile(file: PickedFile): PlaylistMediaType | null {
  if (file.type.startsWith('image/')) return 'Graphic';
  if (file.type.startsWith('video/')) return 'Video';
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(extension)) return 'Graphic';
  if (extension && ['mp4', 'mov', 'm4v', 'webm'].includes(extension)) return 'Video';
  return null;
}

export function fileTitle(file: PickedFile) {
  return file.name.replace(/\.[^.]+$/, '').trim() || file.name;
}

export function formatDuration(seconds?: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return 'Авто';
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function buildUrlPreview(value: string): UrlPreview {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Введите корректную ссылку');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Поддерживаются только ссылки http и https');
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const youtubeId = host === 'youtu.be'
    ? url.pathname.split('/').filter(Boolean)[0]
    : host.endsWith('youtube.com')
      ? url.searchParams.get('v') ?? url.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1]
      : null;

  const sourceLabel = youtubeId
    ? 'YouTube'
    : host.endsWith('vimeo.com')
      ? 'Vimeo'
      : host.endsWith('tiktok.com')
        ? 'TikTok'
        : 'Видео по ссылке';
  const pathTitle = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '')
    .replace(/[-_]+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim();

  return {
    title: pathTitle || host,
    sourceLabel,
    thumbnailUrl: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null,
  };
}
