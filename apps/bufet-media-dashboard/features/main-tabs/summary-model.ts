import type { MediaPointsDashboard } from '../media-points/model';

export interface SummaryEvent {
  id: string;
  kind: 'online' | 'offline';
  screenName: string;
  occurredAt: string | null;
}

export interface SummaryViewModel {
  totalScreens: number;
  onlineScreens: number;
  offlineScreens: number;
  liveBroadcasts: number;
  recentEvents: SummaryEvent[];
}

export function buildSummaryViewModel(data: MediaPointsDashboard): SummaryViewModel {
  const screens = [...data.unassignedScreens, ...data.organizations.flatMap((organization) => organization.screens)];
  const onlineScreens = screens.filter((screen) => screen.isLive).length;
  const recentEvents = [...screens]
    .sort((left, right) => (right.lastSeenAt ?? '').localeCompare(left.lastSeenAt ?? ''))
    .slice(0, 6)
    .map((screen) => ({
      id: `${screen.id}-${screen.isLive ? 'online' : 'offline'}`,
      kind: screen.isLive ? 'online' as const : 'offline' as const,
      screenName: screen.name,
      occurredAt: screen.lastSeenAt,
    }));

  return {
    totalScreens: screens.length,
    onlineScreens,
    offlineScreens: screens.length - onlineScreens,
    liveBroadcasts: onlineScreens,
    recentEvents,
  };
}
