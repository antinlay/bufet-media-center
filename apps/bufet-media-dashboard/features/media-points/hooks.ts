import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AddScreenByCodeInput, CreateOrganizationInput } from './model';
import {
  addScreenByCode,
  createOrganization,
  deleteScreen,
  loadMediaPointsDashboard,
} from './repository';

export const mediaPointsQueryKey = ['media-points-dashboard'] as const;

export function useMediaPointsDashboard(enabled = true) {
  return useQuery({
    queryKey: mediaPointsQueryKey,
    queryFn: ({ signal }) => loadMediaPointsDashboard(signal),
    enabled,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaPointsQueryKey }),
  });
}

export function useAddScreenByCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddScreenByCodeInput) => addScreenByCode(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaPointsQueryKey }),
  });
}

export function useDeleteScreen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (screenId: number) => deleteScreen(screenId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mediaPointsQueryKey }),
  });
}
