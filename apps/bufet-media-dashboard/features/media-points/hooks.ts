import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AddScreenByCodeInput, CreateOrganizationInput } from './model';
import {
  addScreenByCode,
  createOrganization,
  deleteScreen,
  deleteOrganization,
  loadMediaPointsDashboard,
  updateOrganization,
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
    onSuccess: () => invalidateOrganizationQueries(queryClient),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) =>
      updateOrganization(id, { name, description }),
    onSuccess: () => invalidateOrganizationQueries(queryClient),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteOrganization(id),
    onSuccess: () => invalidateOrganizationQueries(queryClient),
  });
}

function invalidateOrganizationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['groups'] });
  queryClient.invalidateQueries({ queryKey: ['screens'] });
  queryClient.invalidateQueries({ queryKey: ['users'] });
  queryClient.invalidateQueries({ queryKey: mediaPointsQueryKey });
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
