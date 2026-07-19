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
} from './model';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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
    const content = await apiClient.createContent(
      { type, name: fileTitle(file), duration: type === 'Graphic' ? 15 : undefined },
      file,
    );
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

export async function savePlaylist(
  screenId: number,
  items: PlaylistItemViewModel[],
  labels: PlaylistLabels,
) {
  const playlist = await apiClient.replaceScreenPlaylist(screenId, items.map((item) => ({
    submission_id: item.submissionId,
    content_id: item.contentId,
  })));
  return playlist.items.map((item) => mapPlaylistItem(item, labels));
}
