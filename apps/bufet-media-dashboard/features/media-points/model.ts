export interface MediaPoint {
  id: number;
  organizationId: number;
  name: string;
  previewUrl: string | null;
  isLive: boolean;
  lastSeenAt: string | null;
}

export interface OrganizationMediaSection {
  id: number;
  name: string;
  screens: MediaPoint[];
}

export interface MediaPointsDashboard {
  unassignedScreens: MediaPoint[];
  organizations: OrganizationMediaSection[];
}

export interface AddScreenByCodeInput {
  code: string;
  organizationId?: number | null;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
}
