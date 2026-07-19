import type { ConcertoContent, ConcertoPlaylistItem, ConcertoScreen } from '@bufet/shared';

import { apiBaseUrl } from '../../lib/api';
import type { PickedFile } from '../../lib/upload';

export type PlaylistMediaType = 'Graphic' | 'Video';

export interface PlaylistItemViewModel {
  key: string;
  submissionId: number | null;
  contentId: number;
  type: PlaylistMediaType;
  title: string;
  duration: number | null;
  displayDurationSeconds: number | null;
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

export interface ScreenPlaylistCardViewModel {
  screenId: number;
  title: string;
  organizationName: string;
  itemCount: number;
  totalDurationSeconds: number | null;
  previews: Pick<PlaylistItemViewModel, 'key' | 'thumbnailUrl' | 'mediaUrl' | 'type'>[];
}

export interface UrlPreview {
  title: string;
  sourceLabel: string;
  thumbnailUrl: string | null;
}

export type PlaylistLabels = {
  video: string;
  image: string;
  noOrganization: string;
};

export function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^(https?:|data:|file:|blob:)/i.test(url)) return url;
  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function mapPlaylistItem(item: ConcertoPlaylistItem, labels: PlaylistLabels): PlaylistItemViewModel {
  const type: PlaylistMediaType = item.type === 'Video' ? 'Video' : 'Graphic';
  return {
    key: `submission-${item.submissionId}`,
    submissionId: item.submissionId,
    contentId: item.contentId,
    type,
    title: item.name?.trim() || (type === 'Video' ? labels.video : labels.image),
    duration: item.duration ?? null,
    displayDurationSeconds: type === 'Graphic' ? (item.displayDurationSeconds ?? 15) : null,
    position: item.position,
    mediaUrl: resolveMediaUrl(item.mediaUrl),
    thumbnailUrl: resolveMediaUrl(item.thumbnailUrl ?? (type === 'Graphic' ? item.mediaUrl : null)),
  };
}

let draftSequence = 0;

export function createDraftPlaylistItems(items: LibraryItemViewModel[]): PlaylistItemViewModel[] {
  return items.map((item) => ({
    key: `draft-${Date.now()}-${draftSequence++}`,
    submissionId: null,
    contentId: item.id,
    type: item.type,
    title: item.title,
    duration: item.duration,
    displayDurationSeconds: item.type === 'Graphic' ? 15 : null,
    position: 0,
    mediaUrl: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl,
  }));
}

export function mapPlaylistEditor(
  screen: ConcertoScreen,
  items: ConcertoPlaylistItem[],
  labels: PlaylistLabels,
): PlaylistEditorViewModel {
  return {
    screenId: screen.id,
    screenName: screen.name,
    organizationName: screen.group?.name ?? labels.noOrganization,
    items: [...items].sort((left, right) => left.position - right.position).map((item) => mapPlaylistItem(item, labels)),
  };
}

export function mapLibraryItem(content: ConcertoContent, labels: PlaylistLabels): LibraryItemViewModel | null {
  if (content.type !== 'Graphic' && content.type !== 'Video') return null;
  return {
    id: content.id,
    type: content.type,
    title: content.name?.trim() || `${content.type === 'Video' ? labels.video : labels.image} #${content.id}`,
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
  if (!seconds || !Number.isFinite(seconds)) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function buildUrlPreview(value: string, linkedVideoLabel: string): UrlPreview {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('INVALID_URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('UNSUPPORTED_URL_PROTOCOL');
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
        : linkedVideoLabel;
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
