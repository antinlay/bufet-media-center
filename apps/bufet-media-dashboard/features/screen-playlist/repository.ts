import { apiClient } from '../../lib/api';
import type { PickedFile } from '../../lib/upload';
import {
  fileTitle,
  mapLibraryItem,
  mapPlaylistEditor,
  mapPlaylistItem,
  mediaTypeForFile,
  type LibraryItemViewModel,
  type PlaylistLabels,
  type PlaylistItemViewModel,
  type ScreenPlaylistCardViewModel,
} from './model';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const VIDEO_THUMBNAIL_WAIT_MS = 12_000;
const VIDEO_THUMBNAIL_POLL_MS = 750;

async function waitForVideoThumbnail(content: Awaited<ReturnType<typeof apiClient.createContent>>) {
  if (content.type !== 'Video' || content.thumbnailUrl) return content;

  const deadline = Date.now() + VIDEO_THUMBNAIL_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, VIDEO_THUMBNAIL_POLL_MS));
    try {
      const refreshed = await apiClient.getContent(content.id);
      if (refreshed.thumbnailUrl) return refreshed;
    } catch {
      // Keep the uploaded video usable; the web thumbnail can fall back to its first frame.
    }
  }

  return content;
}

export async function loadPlaylistEditor(screenId: number, labels: PlaylistLabels, signal?: AbortSignal) {
  const [screen, playlist] = await Promise.all([
    apiClient.getScreen(screenId, signal),
    apiClient.getScreenPlaylist(screenId, signal),
  ]);
  return mapPlaylistEditor(screen, playlist.items, labels);
}

export async function loadMediaLibrary(labels: PlaylistLabels, signal?: AbortSignal): Promise<LibraryItemViewModel[]> {
  const contents = await apiClient.getContents(signal);
  return contents.flatMap((content) => {
    const item = mapLibraryItem(content, labels);
    return item ? [item] : [];
  });
}

export async function loadScreenPlaylists(labels: PlaylistLabels, signal?: AbortSignal): Promise<ScreenPlaylistCardViewModel[]> {
  const screens = (await apiClient.getScreens(signal)).filter((screen) => Boolean(screen.device));
  const cards = await Promise.all(screens.map(async (screen) => {
    const playlist = await apiClient.getScreenPlaylist(screen.id, signal);
    const items = playlist.items.map((item) => mapPlaylistItem(item, labels));
    const durations = items.map((item) => item.type === 'Graphic' ? (item.displayDurationSeconds ?? 15) : item.duration);
    return {
      screenId: screen.id,
      title: screen.name,
      organizationName: screen.group?.name ?? labels.noOrganization,
      itemCount: items.length,
      totalDurationSeconds: durations.some((duration) => duration == null)
        ? null
        : durations.reduce<number>((total, duration) => total + (duration ?? 0), 0),
      previews: items.slice(0, 6).map(({ key, thumbnailUrl, mediaUrl, type }) => ({ key, thumbnailUrl, mediaUrl, type })),
    };
  }));
  return cards.sort((left, right) => left.title.localeCompare(right.title));
}

export async function uploadMediaFiles(
  files: PickedFile[],
  labels: PlaylistLabels,
  onProgress?: (completed: number, total: number) => void,
): Promise<LibraryItemViewModel[]> {
  const uploaded: LibraryItemViewModel[] = [];
  for (const [index, file] of files.entries()) {
    const type = mediaTypeForFile(file);
    if (!type) throw new Error('UNSUPPORTED_FILE_TYPE');
    if (type === 'Video' && file.size && file.size > MAX_VIDEO_BYTES) {
      throw new Error('VIDEO_FILE_TOO_LARGE');
    }
    const createdContent = await apiClient.createContent(
      { type, name: fileTitle(file), duration: type === 'Graphic' ? 15 : undefined },
      file,
    );
    const content = await waitForVideoThumbnail(createdContent);
    const item = mapLibraryItem(content, labels);
    if (!item) throw new Error('UNSUPPORTED_CONTENT_TYPE');
    uploaded.push(item);
    onProgress?.(index + 1, files.length);
  }
  return uploaded;
}

export async function addVideoUrl(url: string, title: string, labels: PlaylistLabels) {
  const content = await apiClient.createContent({
    type: 'Video',
    url: url.trim(),
    name: title.trim() || undefined,
  });
  const item = mapLibraryItem(content, labels);
  if (!item) throw new Error('UNSUPPORTED_CONTENT_TYPE');
  return item;
}

export function deleteMedia(contentId: number) {
  return apiClient.deleteContent(contentId);
}

export async function savePlaylist(
  screenId: number,
  items: PlaylistItemViewModel[],
  labels: PlaylistLabels,
) {
  const playlist = await apiClient.replaceScreenPlaylist(screenId, items.map((item) => ({
    submission_id: item.submissionId,
    content_id: item.contentId,
    display_duration_seconds: item.type === 'Graphic' ? (item.displayDurationSeconds ?? 15) : undefined,
  })));
  return playlist.items.map((item) => mapPlaylistItem(item, labels));
}

export async function updatePlaylistItemDuration(
  screenId: number,
  submissionId: number,
  displayDurationSeconds: number,
  labels: PlaylistLabels,
) {
  const item = await apiClient.updateScreenPlaylistItemDuration(
    screenId,
    submissionId,
    displayDurationSeconds,
  );
  return mapPlaylistItem(item, labels);
}
