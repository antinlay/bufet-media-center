import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PickedFile } from '../../lib/upload';
import { mediaPointsQueryKey } from '../media-points/hooks';
import { broadcastPlaylistChanged } from '../../lib/supabase-realtime';
import type { LibraryItemViewModel, PlaylistItemViewModel } from './model';
import { useI18n } from '../../providers/I18nProvider';
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
  const { language, t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useQuery({
    queryKey: [...playlistEditorKey(screenId ?? 0), language],
    queryFn: ({ signal }) => loadPlaylistEditor(screenId as number, labels, signal),
    enabled: Boolean(screenId),
  });
}

export function useMediaLibrary() {
  const { language, t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useQuery({
    queryKey: [...mediaLibraryKey, language],
    queryFn: ({ signal }) => loadMediaLibrary(labels, signal),
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
  const { t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: PickedFile[]; onProgress?: (done: number, total: number) => void }) =>
      uploadPlaylistFiles(screenId, files, labels, onProgress),
    onSuccess: () => {
      void invalidate().catch((error) => {
        console.warn('Playlist refresh failed after successful upload', error);
      });
    },
  });
}

export function useAddLibraryItems(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  const { t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useMutation({
    mutationFn: (items: LibraryItemViewModel[]) => addLibraryItems(screenId, items, labels),
    onSuccess: invalidate,
  });
}

export function useAddVideoUrl(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  const { t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useMutation({
    mutationFn: ({ url, title }: { url: string; title: string }) => addVideoUrl(screenId, url, title, labels),
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
