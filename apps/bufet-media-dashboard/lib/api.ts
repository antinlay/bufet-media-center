import type {
  ConcertoAuthResponse,
  ConcertoContent,
  ConcertoFeed,
  ConcertoField,
  ConcertoGroup,
  ConcertoPairingResult,
  ConcertoPlaylistItem,
  ConcertoPlaylistResponse,
  ConcertoScreen,
  ConcertoSubmission,
  ConcertoSubscription,
  ConcertoTemplate,
  ConcertoUser,
} from '@bufet/shared';
import { z } from 'zod';
import { Platform } from 'react-native';
import type { PickedFile } from './upload';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const errorSchema = z.object({ message: z.string().optional(), error: z.string().optional() });

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      const parsed = errorSchema.safeParse(data);
      if (parsed.success) {
        message = parsed.data.message ?? parsed.data.error ?? message;
      }
    } catch (e) {
      // ignore
    }
    throw new Error(message || 'Request failed');
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export class ApiClient {
  constructor(private token?: string | null) {}

  private headers(json = true) {
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    } as Record<string, string>;
  }

  setToken(token: string | null) {
    this.token = token ?? undefined;
  }

  // Auth
  async login(email: string, password: string): Promise<ConcertoAuthResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<ConcertoAuthResponse>(res);
  }

  async register(firstName: string, lastName: string, email: string, password: string): Promise<ConcertoAuthResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
    });
    return handleResponse<ConcertoAuthResponse>(res);
  }

  async me(): Promise<ConcertoUser> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoUser>(res);
  }

  // Screens
  async getScreens(): Promise<ConcertoScreen[]> {
    const res = await fetch(`${BASE_URL}/api/v1/screens`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoScreen[]>(res);
  }

  async getScreen(id: number): Promise<ConcertoScreen> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${id}`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoScreen>(res);
  }

  async getScreenSubscriptions(screenId: number): Promise<ConcertoSubscription[]> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/subscriptions`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoSubscription[]>(res);
  }

  async createScreen(payload: { name: string; group_id: number; template_id: number }): Promise<ConcertoScreen> {
    const res = await fetch(`${BASE_URL}/api/v1/screens`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ screen: payload }),
    });
    return handleResponse<ConcertoScreen>(res);
  }

  async createSubscription(screenId: number, payload: { feed_id: number; field_id: number; weight?: number }): Promise<ConcertoSubscription> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/subscriptions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ subscription: payload }),
    });
    return handleResponse<ConcertoSubscription>(res);
  }

  async deleteSubscription(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/subscriptions/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  async updateScreen(id: number, payload: Partial<{ name: string; group_id: number; template_id: number }>): Promise<ConcertoScreen> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ screen: payload }),
    });
    return handleResponse<ConcertoScreen>(res);
  }

  // Screen playlist
  async getScreenPlaylist(id: number): Promise<ConcertoPlaylistResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${id}/playlist`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoPlaylistResponse>(res);
  }

  async createScreenPlaylistItem(
    screenId: number,
    payload: { type: string; name?: string; duration?: number; url?: string; content_id?: number },
    file?: PickedFile,
  ): Promise<ConcertoPlaylistItem> {
    if ((payload.type === 'Graphic' || payload.type === 'Video') && file) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, String(value));
      });
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const field = payload.type === 'Video' ? 'video' : 'image';
        form.append(field, blob, file.name);
      } else {
        const field = payload.type === 'Video' ? 'video' : 'image';
        // @ts-ignore FormData file type compatibility for RN
        form.append(field, { uri: file.uri, name: file.name, type: file.type });
      }
      const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/playlist`, {
        method: 'POST',
        headers: this.headers(false),
        body: form,
      });
      return handleResponse<ConcertoPlaylistItem>(res);
    }

    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/playlist`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ConcertoPlaylistItem>(res);
  }

  async addContentToScreenPlaylist(
    screenId: number,
    contentId: number,
    duration?: number,
  ): Promise<ConcertoPlaylistItem> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/playlist`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ content_id: contentId, duration }),
    });
    return handleResponse<ConcertoPlaylistItem>(res);
  }

  async applyScreenPlaylist(screenId: number, sourceScreenId: number): Promise<ConcertoPlaylistResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/playlist/apply`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ source_screen_id: sourceScreenId }),
    });
    return handleResponse<ConcertoPlaylistResponse>(res);
  }

  async updateScreenPlaylistItem(
    screenId: number,
    submissionId: number,
    payload: { name?: string; duration?: number; url?: string },
  ): Promise<ConcertoPlaylistItem> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/playlist/${submissionId}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ConcertoPlaylistItem>(res);
  }

  async reorderScreenPlaylist(screenId: number, submissionIds: number[]): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/playlist/reorder`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ submission_ids: submissionIds }),
    });
    return handleResponse<void>(res);
  }

  async deleteScreenPlaylistItem(screenId: number, submissionId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${screenId}/playlist/${submissionId}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  async deleteScreen(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/screens/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  // Templates
  async getTemplates(): Promise<ConcertoTemplate[]> {
    const res = await fetch(`${BASE_URL}/api/v1/templates`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoTemplate[]>(res);
  }

  async getFields(): Promise<ConcertoField[]> {
    const res = await fetch(`${BASE_URL}/api/v1/fields`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoField[]>(res);
  }

  async createTemplate(payload: { name: string; author?: string | null }): Promise<ConcertoTemplate> {
    const res = await fetch(`${BASE_URL}/api/v1/templates`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ template: payload }),
    });
    return handleResponse<ConcertoTemplate>(res);
  }

  async updateTemplate(id: number, payload: Partial<{ name: string; author?: string | null }>): Promise<ConcertoTemplate> {
    const res = await fetch(`${BASE_URL}/api/v1/templates/${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ template: payload }),
    });
    return handleResponse<ConcertoTemplate>(res);
  }

  async deleteTemplate(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/templates/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  // Feeds
  async getFeeds(): Promise<ConcertoFeed[]> {
    const res = await fetch(`${BASE_URL}/api/v1/feeds`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoFeed[]>(res);
  }

  async createFeed(payload: {
    name: string;
    description?: string | null;
    type: string;
    group_id: number;
    url?: string;
    formatter?: string;
  }): Promise<ConcertoFeed> {
    const res = await fetch(`${BASE_URL}/api/v1/feeds`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ feed: payload }),
    });
    return handleResponse<ConcertoFeed>(res);
  }

  async updateFeed(id: number, payload: Partial<{
    name: string;
    description?: string | null;
    type: string;
    group_id: number;
    url?: string;
    formatter?: string;
  }>): Promise<ConcertoFeed> {
    const res = await fetch(`${BASE_URL}/api/v1/feeds/${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ feed: payload }),
    });
    return handleResponse<ConcertoFeed>(res);
  }

  async deleteFeed(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/feeds/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  // Content
  async getContents(): Promise<ConcertoContent[]> {
    const res = await fetch(`${BASE_URL}/api/v1/contents`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoContent[]>(res);
  }

  async createContent(payload: {
    type: string;
    name?: string;
    duration?: number;
    start_time?: string | null;
    end_time?: string | null;
    text?: string;
    render_as?: string;
    url?: string;
    format?: string;
    feed_ids?: number[];
  }, file?: PickedFile): Promise<ConcertoContent> {
    if ((payload.type === 'Graphic' || payload.type === 'Video') && file) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item) => form.append('feed_ids[]', String(item)));
        } else {
          form.append(key, String(value));
        }
      });
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const field = payload.type === 'Video' ? 'video' : 'image';
        form.append(field, blob, file.name);
      } else {
        // @ts-ignore FormData file type compatibility for RN
        const field = payload.type === 'Video' ? 'video' : 'image';
        form.append(field, { uri: file.uri, name: file.name, type: file.type });
      }
      const res = await fetch(`${BASE_URL}/api/v1/contents`, {
        method: 'POST',
        headers: this.headers(false),
        body: form,
      });
      return handleResponse<ConcertoContent>(res);
    }

    const res = await fetch(`${BASE_URL}/api/v1/contents`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ content: payload }),
    });
    return handleResponse<ConcertoContent>(res);
  }

  async updateContent(id: number, payload: Partial<{
    name?: string;
    duration?: number;
    start_time?: string | null;
    end_time?: string | null;
    text?: string;
    render_as?: string;
    url?: string;
    format?: string;
    feed_ids?: number[];
  }>, file?: PickedFile): Promise<ConcertoContent> {
    if (file) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item) => form.append('feed_ids[]', String(item)));
        } else {
          form.append(key, String(value));
        }
      });
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        form.append('image', blob, file.name);
      } else {
        // @ts-ignore FormData file type compatibility for RN
        form.append('image', { uri: file.uri, name: file.name, type: file.type });
      }
      const res = await fetch(`${BASE_URL}/api/v1/contents/${id}`, {
        method: 'PATCH',
        headers: this.headers(false),
        body: form,
      });
      return handleResponse<ConcertoContent>(res);
    }

    const res = await fetch(`${BASE_URL}/api/v1/contents/${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ content: payload }),
    });
    return handleResponse<ConcertoContent>(res);
  }

  async deleteContent(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/contents/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  // Moderation (submissions)
  async getSubmissions(): Promise<ConcertoSubmission[]> {
    const res = await fetch(`${BASE_URL}/api/v1/submissions`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoSubmission[]>(res);
  }

  async createSubmission(payload: { content_id: number; feed_id: number }): Promise<ConcertoSubmission> {
    const res = await fetch(`${BASE_URL}/api/v1/submissions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ submission: payload }),
    });
    return handleResponse<ConcertoSubmission>(res);
  }

  async deleteSubmission(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/submissions/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  // Groups & users
  async getGroups(): Promise<ConcertoGroup[]> {
    const res = await fetch(`${BASE_URL}/api/v1/groups`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoGroup[]>(res);
  }

  async createGroup(payload: { name: string; description?: string | null }): Promise<ConcertoGroup> {
    const res = await fetch(`${BASE_URL}/api/v1/groups`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ group: payload }),
    });
    return handleResponse<ConcertoGroup>(res);
  }

  async updateGroup(id: number, payload: Partial<{ name: string; description?: string | null }>): Promise<ConcertoGroup> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ group: payload }),
    });
    return handleResponse<ConcertoGroup>(res);
  }

  async deleteGroup(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  async getUsers(): Promise<ConcertoUser[]> {
    const res = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: this.headers(false),
    });
    return handleResponse<ConcertoUser[]>(res);
  }

  async createMembership(payload: { user_id: number; group_id: number; role?: string }): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/groups/${payload.group_id}/memberships`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ membership: payload }),
    });
    return handleResponse<void>(res);
  }

  async updateMembership(id: number, payload: { role: string }): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/memberships/${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ membership: payload }),
    });
    return handleResponse<void>(res);
  }

  async deleteMembership(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/v1/memberships/${id}`, {
      method: 'DELETE',
      headers: this.headers(false),
    });
    return handleResponse<void>(res);
  }

  // Pairing
  async pairDevice(payload: { code: string; screen?: { name: string; group_id: number; template_id: number }; screen_id?: number }): Promise<ConcertoPairingResult> {
    const res = await fetch(`${BASE_URL}/api/v1/pairings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ConcertoPairingResult>(res);
  }
}

export const apiClient = new ApiClient();
export const apiBaseUrl = BASE_URL;
