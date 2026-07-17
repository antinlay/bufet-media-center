import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PickedFile } from '../../lib/upload';
import { mediaPointsQueryKey } from '../media-points/hooks';
import { broadcastPlaylistChanged } from '../../lib/supabase-realtime';
import type { LibraryItemViewModel, PlaylistItemViewModel } from './model';
import {
  addLibraryItems,
  addVideoUrl,
  deletePlaylistItem,
  loadMediaLibrary,
  loadPlaylistEditor,
  savePlaylistOrder,
  uploadPlaylistFiles,
} from './repository';

export const playlistEditorKey = (screenId: number) => ['screen-playlist-editor', screenId] as const;
export const mediaLibraryKey = ['media-library'] as const;

export function usePlaylistEditor(screenId: number | null) {
  return useQuery({
    queryKey: playlistEditorKey(screenId ?? 0),
    queryFn: ({ signal }) => loadPlaylistEditor(screenId as number, signal),
    enabled: Boolean(screenId),
  });
}

export function useMediaLibrary() {
  return useQuery({
    queryKey: mediaLibraryKey,
    queryFn: ({ signal }) => loadMediaLibrary(signal),
    staleTime: 5 * 60 * 1000,
  });
}

function usePlaylistInvalidation(screenId: number) {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: playlistEditorKey(screenId) }),
    queryClient.invalidateQueries({ queryKey: mediaPointsQueryKey }),
  ]).then(() => {
    void broadcastPlaylistChanged(screenId).catch((error) => {
      console.warn('Playlist realtime notification failed; player polling remains active', error);
    });
  });
}

export function useUploadPlaylistFiles(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: PickedFile[]; onProgress?: (done: number, total: number) => void }) =>
      uploadPlaylistFiles(screenId, files, onProgress),
    onSuccess: invalidate,
  });
}

export function useAddLibraryItems(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  return useMutation({
    mutationFn: (items: LibraryItemViewModel[]) => addLibraryItems(screenId, items),
    onSuccess: invalidate,
  });
}

export function useAddVideoUrl(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  return useMutation({
    mutationFn: ({ url, title }: { url: string; title: string }) => addVideoUrl(screenId, url, title),
    onSuccess: invalidate,
  });
}

export function useSavePlaylistOrder(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  return useMutation({
    mutationFn: (items: PlaylistItemViewModel[]) => savePlaylistOrder(screenId, items),
    onSuccess: invalidate,
  });
}

export function useDeletePlaylistItem(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  return useMutation({
    mutationFn: (submissionId: number) => deletePlaylistItem(screenId, submissionId),
    onSuccess: invalidate,
  });
}
