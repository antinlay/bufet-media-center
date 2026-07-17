import { apiClient } from '../../lib/api';
import type { PickedFile } from '../../lib/upload';
import {
  fileTitle,
  mapLibraryItem,
  mapPlaylistEditor,
  mapPlaylistItem,
  mediaTypeForFile,
  type LibraryItemViewModel,
  type PlaylistItemViewModel,
} from './model';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export async function loadPlaylistEditor(screenId: number, signal?: AbortSignal) {
  const [screen, playlist] = await Promise.all([
    apiClient.getScreen(screenId, signal),
    apiClient.getScreenPlaylist(screenId, signal),
  ]);
  return mapPlaylistEditor(screen, playlist.items);
}

export async function loadMediaLibrary(signal?: AbortSignal): Promise<LibraryItemViewModel[]> {
  const contents = await apiClient.getContents(signal);
  return contents.flatMap((content) => {
    const item = mapLibraryItem(content);
    return item ? [item] : [];
  });
}

export async function uploadPlaylistFiles(
  screenId: number,
  files: PickedFile[],
  onProgress?: (completed: number, total: number) => void,
): Promise<PlaylistItemViewModel[]> {
  const uploaded: PlaylistItemViewModel[] = [];
  for (const [index, file] of files.entries()) {
    const type = mediaTypeForFile(file);
    if (!type) throw new Error(`Формат файла «${file.name}» не поддерживается`);
    if (type === 'Video' && file.size && file.size > MAX_VIDEO_BYTES) {
      throw new Error(`Видео «${file.name}» больше 100 МБ`);
    }
    const item = await apiClient.createScreenPlaylistItem(
      screenId,
      { type, name: fileTitle(file), duration: type === 'Graphic' ? 15 : undefined },
      file,
    );
    uploaded.push(mapPlaylistItem(item));
    onProgress?.(index + 1, files.length);
  }
  return uploaded;
}

export async function addLibraryItems(screenId: number, items: LibraryItemViewModel[]) {
  const added: PlaylistItemViewModel[] = [];
  for (const item of items) {
    const result = await apiClient.addContentToScreenPlaylist(
      screenId,
      item.id,
      item.type === 'Graphic' ? item.duration ?? 15 : undefined,
    );
    added.push(mapPlaylistItem(result));
  }
  return added;
}

export async function addVideoUrl(screenId: number, url: string, title: string) {
  const item = await apiClient.createScreenPlaylistItem(screenId, {
    type: 'Video',
    url: url.trim(),
    name: title.trim() || undefined,
  });
  return mapPlaylistItem(item);
}

export function savePlaylistOrder(screenId: number, items: PlaylistItemViewModel[]) {
  return apiClient.reorderScreenPlaylist(screenId, items.map((item) => item.submissionId));
}

export function deletePlaylistItem(screenId: number, submissionId: number) {
  return apiClient.deleteScreenPlaylistItem(screenId, submissionId);
}
