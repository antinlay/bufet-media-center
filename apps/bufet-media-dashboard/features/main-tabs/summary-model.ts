import type { MediaPointsDashboard } from '../media-points/model';

export type SummaryPeriod = 'today' | 'week' | 'month' | 'year';

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
  activity: number[];
  recentEvents: SummaryEvent[];
}

export function buildSummaryViewModel(data: MediaPointsDashboard, period: SummaryPeriod): SummaryViewModel {
  const screens = [...data.unassignedScreens, ...data.organizations.flatMap((organization) => organization.screens)];
  const onlineScreens = screens.filter((screen) => screen.isLive).length;
  const base = screens.length ? Math.round((onlineScreens / screens.length) * 100) : 0;
  const periodAmplitude: Record<SummaryPeriod, number> = { today: 18, week: 14, month: 10, year: 7 };
  const activity = Array.from({ length: 12 }, (_, index) => {
    const wave = Math.sin((index / 11) * Math.PI * 2 - Math.PI / 2);
    return Math.max(0, Math.min(100, Math.round(base + wave * periodAmplitude[period])));
  });
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
    activity,
    recentEvents,
  };
}
