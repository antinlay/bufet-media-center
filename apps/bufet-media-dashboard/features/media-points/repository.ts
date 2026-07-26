import type { ConcertoGroup, ConcertoPlaylistItem, ConcertoScreen } from '@bufet/shared';

import { apiBaseUrl, apiClient } from '../../lib/api';
import type {
  AddScreenByCodeInput,
  CreateOrganizationInput,
  MediaPoint,
  MediaPointsDashboard,
} from './model';

const SYSTEM_ADMIN_GROUP_NAME = 'System Administrators';
const LEGACY_DEMO_GROUP_NAMES = new Set(['Demo Feed Owners', 'Demo Screen Owners']);

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('file:')) return url;
  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function previewFromPlaylist(items: ConcertoPlaylistItem[]) {
  const item = items[0];
  if (!item) return null;
  return resolveMediaUrl(item.thumbnailUrl) ??
    (item.type === 'Graphic' ? resolveMediaUrl(item.mediaUrl) : null);
}

async function mapConnectedScreen(screen: ConcertoScreen, signal?: AbortSignal): Promise<MediaPoint> {
  let previewUrl = resolveMediaUrl(screen.template?.imageUrl);

  try {
    const playlist = await apiClient.getScreenPlaylist(screen.id, signal);
    previewUrl = previewFromPlaylist(playlist.items) ?? previewUrl;
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  return {
    id: screen.id,
    organizationId: screen.groupId,
    name: screen.name,
    previewUrl,
    isLive: Boolean(screen.online),
    lastSeenAt: screen.lastSeenAt ?? null,
  };
}

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, 'ru'));
}

export async function loadMediaPointsDashboard(signal?: AbortSignal): Promise<MediaPointsDashboard> {
  const [groups, screens] = await Promise.all([
    apiClient.getGroups(signal),
    apiClient.getScreens(signal),
  ]);

  const connectedScreens = screens.filter((screen) => Boolean(screen.device));
  const mediaPoints = await Promise.all(
    connectedScreens.map((screen) => mapConnectedScreen(screen, signal)),
  );
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const screensByGroup = mediaPoints.reduce((result, screen) => {
    const current = result.get(screen.organizationId) ?? [];
    current.push(screen);
    result.set(screen.organizationId, current);
    return result;
  }, new Map<number, MediaPoint[]>());

  const organizations = sortByName(groups.filter((group) => (
    !group.systemGroup && !LEGACY_DEMO_GROUP_NAMES.has(group.name)
  ))).map((group) => ({
    id: group.id,
    name: group.name,
    screens: sortByName(screensByGroup.get(group.id) ?? []),
  }));

  const unassignedScreens = sortByName(mediaPoints.filter((screen) => {
    const group = groupById.get(screen.organizationId);
    return !group || Boolean(group.systemGroup);
  }));

  return { unassignedScreens, organizations };
}

export async function createOrganization(input: CreateOrganizationInput) {
  const name = input.name.trim();
  if (!name) throw new Error('ORGANIZATION_NAME_REQUIRED');

  return apiClient.createGroup({
    name,
    description: input.description?.trim() || undefined,
  });
}

export function updateOrganization(id: number, input: { name: string; description?: string }) {
  const name = input.name.trim();
  if (!name) throw new Error('ORGANIZATION_NAME_REQUIRED');

  return apiClient.updateGroup(id, {
    name,
    description: input.description?.trim() || undefined,
  });
}

export function deleteOrganization(id: number) {
  return apiClient.deleteGroup(id);
}

function findUnassignedGroup(groups: ConcertoGroup[]) {
  return groups.find((group) => group.name === SYSTEM_ADMIN_GROUP_NAME) ??
    groups.find((group) => group.systemGroup);
}

export async function addScreenByCode(input: AddScreenByCodeInput) {
  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error('SCREEN_CODE_REQUIRED');

  let organizationId = input.organizationId ?? null;
  if (!organizationId) {
    const groups = await apiClient.getGroups();
    const unassignedGroup = findUnassignedGroup(groups);
    if (!unassignedGroup) {
      throw new Error('UNASSIGNED_SCREEN_GROUP_NOT_FOUND');
    }
    organizationId = unassignedGroup.id;
  }

  return apiClient.pairDevice({
    code,
    screen: {
      name: input.screenName?.trim() || `Screen ${code}`,
      group_id: organizationId,
    },
  });
}

export function deleteScreen(screenId: number) {
  return apiClient.deleteScreen(screenId);
}
