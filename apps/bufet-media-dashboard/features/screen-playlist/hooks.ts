import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PickedFile } from '../../lib/upload';
import { mediaPointsQueryKey } from '../media-points/hooks';
import { broadcastPlaylistChanged } from '../../lib/supabase-realtime';
import {
  createDraftPlaylistItems,
  type LibraryItemViewModel,
  type PlaylistItemViewModel,
} from './model';
import { useI18n } from '../../providers/I18nProvider';
import {
  addVideoUrl,
  deleteMedia,
  loadMediaLibrary,
  loadPlaylistEditor,
  loadScreenPlaylists,
  savePlaylist,
  updatePlaylistItemDuration,
  uploadMediaFiles,
} from './repository';

export const playlistEditorKey = (screenId: number) => ['screen-playlist-editor', screenId] as const;
export const playlistDraftKey = (screenId: number) => ['screen-playlist-draft', screenId] as const;
export const mediaLibraryKey = ['media-library'] as const;
export const screenPlaylistsKey = ['screen-playlists'] as const;

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

export function useScreenPlaylists() {
  const { language, t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useQuery({
    queryKey: [...screenPlaylistsKey, language],
    queryFn: ({ signal }) => loadScreenPlaylists(labels, signal),
  });
}

export function usePlaylistDraft(screenId: number | null) {
  return useQuery({
    queryKey: playlistDraftKey(screenId ?? 0),
    queryFn: async () => [] as PlaylistItemViewModel[],
    enabled: Boolean(screenId),
    staleTime: Infinity,
  });
}

export function usePlaylistDraftActions(screenId: number) {
  const queryClient = useQueryClient();

  const stage = useCallback((items: LibraryItemViewModel[]) => {
    queryClient.setQueryData<PlaylistItemViewModel[]>(playlistDraftKey(screenId), (current = []) => [
      ...current,
      ...createDraftPlaylistItems(items),
    ]);
  }, [queryClient, screenId]);

  const remove = useCallback((key: string) => {
    queryClient.setQueryData<PlaylistItemViewModel[]>(playlistDraftKey(screenId), (current = []) => (
      current.filter((item) => item.key !== key)
    ));
  }, [queryClient, screenId]);

  const clear = useCallback(() => {
    queryClient.setQueryData<PlaylistItemViewModel[]>(playlistDraftKey(screenId), []);
  }, [queryClient, screenId]);

  return { stage, remove, clear };
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

export function useUploadPlaylistFiles() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useMutation({
    mutationFn: ({ files, onProgress }: { files: PickedFile[]; onProgress?: (done: number, total: number) => void }) =>
      uploadMediaFiles(files, labels, onProgress),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mediaLibraryKey }).catch((error) => {
        console.warn('Media library refresh failed after successful upload', error);
      });
    },
  });
}

export function useAddVideoUrl() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useMutation({
    mutationFn: ({ url, title }: { url: string; title: string }) => addVideoUrl(url, title, labels),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaLibraryKey }),
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: number) => deleteMedia(contentId),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: mediaLibraryKey }),
      queryClient.invalidateQueries({ queryKey: screenPlaylistsKey }),
      queryClient.invalidateQueries({ queryKey: ['screen-playlist-editor'] }),
    ]),
  });
}

export function useSavePlaylistOrder(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  const { t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useMutation({
    mutationFn: (items: PlaylistItemViewModel[]) => savePlaylist(screenId, items, labels),
    onSuccess: () => {
      void invalidate().catch((error) => {
        console.warn('Playlist refresh failed after successful save', error);
      });
    },
  });
}

export function useUpdatePlaylistItemDuration(screenId: number) {
  const invalidate = usePlaylistInvalidation(screenId);
  const { t } = useI18n();
  const labels = useMemo(() => ({ video: t('playlist.mediaVideo'), image: t('playlist.mediaImage'), noOrganization: t('dashboard.unnamedOrganization') }), [t]);
  return useMutation({
    mutationFn: ({ submissionId, displayDurationSeconds }: { submissionId: number; displayDurationSeconds: number }) =>
      updatePlaylistItemDuration(screenId, submissionId, displayDurationSeconds, labels),
    onSuccess: () => {
      void invalidate().catch((error) => {
        console.warn('Playlist refresh failed after duration update', error);
      });
    },
  });
}
