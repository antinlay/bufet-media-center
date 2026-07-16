import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

import {
  BootstrapResponse,
  CreateDevicePairingDto,
  DeviceConfigResponse,
  PairingResponse,
  PairingStatusResponse,
} from '@bufet/shared';
import { ApiBaseUrl } from '@/services/api-base-url';

export const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

export type PlayerServiceNetworkError = {
  code: 'API_NOT_CONFIGURED' | 'NETWORK_ERROR' | 'HTTP_ERROR';
  baseUrl?: string;
  method: 'GET' | 'POST';
  path: string;
  status?: number;
  responseText?: string;
  message: string;
  cause?: unknown;
};

export class PlayerService {
  private static readonly DEVICE_ID_KEY = 'bufet_device_id';
  private static memoryStore = new Map<string, string>();
  private static readonly PLAYLIST_CACHE_FILE = `${FileSystem.documentDirectory}playlist-cache.json`;
  private static readonly MEDIA_CACHE_DIR = `${FileSystem.documentDirectory}media-cache`;
  private static cachedApiBaseUrl: string | null = null;
  private static lastNetworkError: PlayerServiceNetworkError | null = null;
  private static readonly FETCH_TIMEOUT_MS = 8000;

  static getCachedApiBaseUrl(): string | null {
    return this.cachedApiBaseUrl ?? ApiBaseUrl.getCached();
  }

  static getLastNetworkError(): PlayerServiceNetworkError | null {
    return this.lastNetworkError;
  }

  private static async readItem(key: string): Promise<string | null> {
    try {
      if (await SecureStore.isAvailableAsync()) {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      console.warn('SecureStore read unavailable, falling back to memory/localStorage', e);
    }

    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage.getItem(key);
    }
    return this.memoryStore.get(key) ?? null;
  }

  private static async writeItem(key: string, value: string): Promise<void> {
    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch (e) {
      console.warn('SecureStore write unavailable, falling back to memory/localStorage', e);
    }

    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.setItem(key, value);
      return;
    }
    this.memoryStore.set(key, value);
  }

  static async ensureApiBaseUrl(deviceId: string, signal?: AbortSignal): Promise<string> {
    // If we've already resolved once in this session, don't re-probe on every call.
    if (this.cachedApiBaseUrl) return this.cachedApiBaseUrl;

    const resolved = await ApiBaseUrl.resolve(deviceId, { abortSignal: signal });
    if (!resolved) {
      const error: PlayerServiceNetworkError = {
        code: 'API_NOT_CONFIGURED',
        method: 'GET',
        path: '/api/player/bootstrap',
        message: 'API base URL is not configured or server is unreachable.',
      };
      this.lastNetworkError = error;
      throw Object.assign(new Error(error.message), { __bufetError: error });
    }
    this.cachedApiBaseUrl = resolved;
    return resolved;
  }

  private static async fetchJson<T>(
    baseUrl: string,
    method: 'GET' | 'POST',
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const controller = new AbortController();
    const callerSignal = init?.signal;
    const abortFromCaller = () => controller.abort();
    const fetchInit = { ...init };
    delete fetchInit.signal;

    if (callerSignal?.aborted) {
      controller.abort();
    } else {
      callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
    }

    const timeout = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { method, ...fetchInit, signal: controller.signal });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const error: PlayerServiceNetworkError = {
          code: 'HTTP_ERROR',
          baseUrl,
          method,
          path,
          status: response.status,
          responseText: text?.slice(0, 1000),
          message: `${method} ${path} failed: ${response.status}${text ? ` ${text}` : ''}`.trim(),
        };
        this.lastNetworkError = error;
        throw Object.assign(new Error(error.message), { __bufetError: error });
      }

      const json = await response.json();
      this.lastNetworkError = null;
      return json as T;
    } catch (cause) {
      if (cause instanceof Error && '__bufetError' in cause) throw cause;
      if (callerSignal?.aborted) throw cause;
      const error: PlayerServiceNetworkError = {
        code: 'NETWORK_ERROR',
        baseUrl,
        method,
        path,
        message: controller.signal.aborted ? 'Request timed out' : (cause instanceof Error ? cause.message : String(cause)),
        cause,
      };
      this.lastNetworkError = error;
      throw Object.assign(new Error(error.message), { __bufetError: error });
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    }
  }

  private static async ensureMediaCacheDir() {
    if (!FileSystem.documentDirectory) return;
    const info = await FileSystem.getInfoAsync(this.MEDIA_CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(this.MEDIA_CACHE_DIR, { intermediates: true });
    }
  }

  private static hashUrl(value: string): string {
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 33) ^ value.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }

  private static extensionForUrl(url: string): string {
    const clean = url.split('?')[0];
    const match = clean.match(/\.[a-z0-9]+$/i);
    return match ? match[0] : '';
  }

  private static localPathForUrl(url: string): string {
    const ext = this.extensionForUrl(url);
    return `${this.MEDIA_CACHE_DIR}/${this.hashUrl(url)}${ext}`;
  }

  static async saveCachedPlaylist(payload: { items: DeviceConfigResponse['playlist']['items']; configVersion?: string }) {
    if (!FileSystem.documentDirectory) return;
    const data = {
      fetchedAt: new Date().toISOString(),
      configVersion: payload.configVersion,
      items: payload.items,
    };
    await FileSystem.writeAsStringAsync(this.PLAYLIST_CACHE_FILE, JSON.stringify(data));
  }

  static async readCachedPlaylist(): Promise<{ items: DeviceConfigResponse['playlist']['items']; configVersion?: string } | null> {
    if (!FileSystem.documentDirectory) return null;
    const info = await FileSystem.getInfoAsync(this.PLAYLIST_CACHE_FILE);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(this.PLAYLIST_CACHE_FILE);
    const parsed = JSON.parse(raw);
    if (!parsed?.items) return null;
    return { items: parsed.items as DeviceConfigResponse['playlist']['items'], configVersion: parsed.configVersion };
  }

  static async applyMediaCache(items: DeviceConfigResponse['playlist']['items']) {
    if (!FileSystem.documentDirectory) return items;
    await this.ensureMediaCacheDir();
    const updated = await Promise.all(items.map(async (item) => {
      const next = { ...item };
      if (item.url && isAbsoluteUrl(item.url)) {
        const local = this.localPathForUrl(item.url);
        const info = await FileSystem.getInfoAsync(local);
        if (info.exists) next.url = local;
      }
      if (item.thumbnailUrl && isAbsoluteUrl(item.thumbnailUrl)) {
        const local = this.localPathForUrl(item.thumbnailUrl);
        const info = await FileSystem.getInfoAsync(local);
        if (info.exists) next.thumbnailUrl = local;
      }
      return next;
    }));
    return updated;
  }

  static async cachePlaylistMedia(items: DeviceConfigResponse['playlist']['items']) {
    if (!FileSystem.documentDirectory) return;
    await this.ensureMediaCacheDir();
    const targets = new Set<string>();
    const urls = new Set<string>();

    items.forEach((item) => {
      if (item.url && isAbsoluteUrl(item.url)) urls.add(item.url);
      if (item.thumbnailUrl && isAbsoluteUrl(item.thumbnailUrl)) urls.add(item.thumbnailUrl);
    });

    for (const url of urls) {
      const local = this.localPathForUrl(url);
      targets.add(local);
      const info = await FileSystem.getInfoAsync(local);
      if (!info.exists) {
        try {
          await FileSystem.downloadAsync(url, local);
        } catch (error) {
          console.warn('Media cache download failed', error);
        }
      }
    }

    try {
      const cachedFiles = await FileSystem.readDirectoryAsync(this.MEDIA_CACHE_DIR);
      await Promise.all(
        cachedFiles.map(async (file) => {
          const path = `${this.MEDIA_CACHE_DIR}/${file}`;
          if (!targets.has(path)) {
            await FileSystem.deleteAsync(path, { idempotent: true });
          }
        }),
      );
    } catch (error) {
      console.warn('Media cache cleanup failed', error);
    }
  }

  private static generateId(): string {
    // UUID v4 generator without external deps
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    // Set version 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant 10xxxxxx
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const segments = [
      Array.from(bytes.slice(0, 4)).map(toHex).join(''),
      Array.from(bytes.slice(4, 6)).map(toHex).join(''),
      Array.from(bytes.slice(6, 8)).map(toHex).join(''),
      Array.from(bytes.slice(8, 10)).map(toHex).join(''),
      Array.from(bytes.slice(10, 16)).map(toHex).join(''),
    ];
    return segments.join('-');
  }

  static async getOrCreateDeviceId(): Promise<string> {
    const existingId = await this.readItem(this.DEVICE_ID_KEY);
    if (existingId) return existingId;

    const newId = this.generateId();
    await this.writeItem(this.DEVICE_ID_KEY, newId);
    return newId;
  }

  static async bootstrap(deviceId: string): Promise<BootstrapResponse> {
    const baseUrl = await this.ensureApiBaseUrl(deviceId);
    return this.fetchJson<BootstrapResponse>(baseUrl, 'GET', `/api/player/bootstrap?deviceId=${encodeURIComponent(deviceId)}`);
  }

  static async createPairing(deviceId: string): Promise<PairingResponse> {
    const baseUrl = await this.ensureApiBaseUrl(deviceId);
    const data = await this.fetchJson<PairingResponse>(baseUrl, 'POST', '/api/player/pairing', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId } satisfies CreateDevicePairingDto),
    });
    return { ...data, expiresAt: new Date(data.expiresAt) } as PairingResponse;
  }

  static async getPairingStatus(deviceId: string, signal?: AbortSignal): Promise<PairingStatusResponse> {
    const baseUrl = await this.ensureApiBaseUrl(deviceId);
    return this.fetchJson<PairingStatusResponse>(
      baseUrl,
      'GET',
      `/api/player/pairing/status?deviceId=${encodeURIComponent(deviceId)}`,
      { signal },
    );
  }

  static async getDeviceConfig(deviceId: string, baseUrlOverride?: string, signal?: AbortSignal): Promise<DeviceConfigResponse> {
    const baseUrl = baseUrlOverride ?? await this.ensureApiBaseUrl(deviceId, signal);
    return this.fetchJson<DeviceConfigResponse>(
      baseUrl,
      'GET',
      `/api/player/config?deviceId=${encodeURIComponent(deviceId)}`,
      { signal },
    );
  }
}
