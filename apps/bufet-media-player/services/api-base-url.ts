import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';

const SECURE_STORE_KEY = 'bufet_api_base_url';
const DEFAULT_DISCOVERY_PORTS = '443,80,3000';
const PROBE_TIMEOUT_MS = 2000;
const DISCOVERY_CONCURRENCY = 20;
const DISCOVERY_MAX_MS = 20_000;

type ProbeOk = {
  ok: true;
  baseUrl: string;
  status: number;
  json: unknown;
};

type ProbeFail = {
  ok: false;
  baseUrl: string;
  reason: string;
  status?: number;
  body?: string;
};

type ProbeResult = ProbeOk | ProbeFail;

let cachedBaseUrl: string | null = null;

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function isBadDefault(url: string): boolean {
  const value = url.trim();
  if (!value) return true;
  if (value.includes('<your-domain-or-ip>')) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value)) return true;
  return false;
}

function isLocalWebUrl(url: string): boolean {
  return process.env.EXPO_OS === 'web' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url.trim());
}

function looksLikeHostOnly(value: string): boolean {
  // "192.168.1.10", "myhost.local:3000"
  return !/^https?:\/\//i.test(value) && /^[a-z0-9.-]+(?::\d+)?$/i.test(value.trim());
}

function asUrlCandidates(input: string): string[] {
  const value = input.trim();
  if (!value) return [];
  if (looksLikeHostOnly(value)) {
    return [`https://${value}`, `http://${value}`];
  }
  return [value];
}

async function readSavedBaseUrl(): Promise<string | null> {
  try {
    if (await SecureStore.isAvailableAsync()) {
      const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (stored) return normalize(stored);
    }
  } catch (e) {
    console.warn('SecureStore read failed', e);
  }
  return null;
}

async function saveBaseUrl(value: string): Promise<void> {
  const normalized = normalize(value);
  cachedBaseUrl = normalized;
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(SECURE_STORE_KEY, normalized);
    }
  } catch (e) {
    console.warn('SecureStore write failed', e);
  }
}

async function clearSavedBaseUrl(): Promise<void> {
  cachedBaseUrl = null;
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    }
  } catch (e) {
    console.warn('SecureStore delete failed', e);
  }
}

function abortableTimeout(timeoutMs: number, callerSignal?: AbortSignal): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (callerSignal?.aborted) {
    controller.abort();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(id);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    },
  };
}

async function probe(baseUrlRaw: string, deviceId: string, callerSignal?: AbortSignal): Promise<ProbeResult> {
  const baseUrl = normalize(baseUrlRaw);
  const url = `${baseUrl}/api/player/bootstrap?deviceId=${encodeURIComponent(deviceId)}`;
  const { signal, cancel } = abortableTimeout(PROBE_TIMEOUT_MS, callerSignal);
  try {
    const response = await fetch(url, { signal });
    const status = response.status;
    const text = await response.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    // "Signature": ok + has status key in JSON.
    if (response.ok && json && typeof json === 'object' && 'status' in (json as Record<string, unknown>)) {
      return { ok: true, baseUrl, status, json };
    }

    return {
      ok: false,
      baseUrl,
      reason: 'Unexpected response',
      status,
      body: text?.slice(0, 500),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const reason = signal.aborted ? 'Timeout' : message;
    return { ok: false, baseUrl, reason };
  } finally {
    cancel();
  }
}

function parsePorts(raw: string | undefined): number[] {
  const value = (raw ?? DEFAULT_DISCOVERY_PORTS).trim();
  const ports = value
    .split(',')
    .map((p) => Number(p.trim()))
    .filter((p) => Number.isFinite(p) && p > 0 && p < 65536);
  return ports.length ? ports : DEFAULT_DISCOVERY_PORTS.split(',').map((p) => Number(p));
}

function isPrivateIpv4(ip: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false;
  const [a, b] = ip.split('.').map((x) => Number(x));
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function ipPrefix(ip: string): string | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

type DiscoverProgress = {
  total: number;
  done: number;
  current?: string;
};

async function discoverOnLan(
  deviceId: string,
  opts?: { onProgress?: (p: DiscoverProgress) => void; abortSignal?: AbortSignal },
): Promise<string | null> {
  const state = await Network.getNetworkStateAsync();
  if (!state.isConnected) return null;

  const ip = await Network.getIpAddressAsync();
  if (!ip || ip === '0.0.0.0' || !isPrivateIpv4(ip)) return null;

  const prefix = ipPrefix(ip);
  if (!prefix) return null;

  const ports = parsePorts(process.env.EXPO_PUBLIC_DISCOVERY_PORTS);
  const schemes: Array<'https' | 'http'> = ['https', 'http'];

  const hosts: string[] = [];
  for (let i = 1; i <= 254; i += 1) hosts.push(`${prefix}.${i}`);

  const candidates: string[] = [];
  for (const host of hosts) {
    for (const port of ports) {
      for (const scheme of schemes) {
        const isDefaultPort = (scheme === 'https' && port === 443) || (scheme === 'http' && port === 80);
        candidates.push(isDefaultPort ? `${scheme}://${host}` : `${scheme}://${host}:${port}`);
      }
    }
  }

  let done = 0;
  const total = candidates.length;
  let found: string | null = null;

  const queue = candidates.slice();
  const deadline = Date.now() + DISCOVERY_MAX_MS;

  const worker = async () => {
    while (queue.length && !found) {
      if (opts?.abortSignal?.aborted) return;
      if (Date.now() > deadline) return;
      const candidate = queue.shift();
      if (!candidate) return;
      opts?.onProgress?.({ total, done, current: candidate });
      const result = await probe(candidate, deviceId, opts?.abortSignal);
      done += 1;
      opts?.onProgress?.({ total, done, current: candidate });
      if (result.ok) {
        found = result.baseUrl;
        return;
      }
    }
  };

  const workers = Array.from({ length: DISCOVERY_CONCURRENCY }, () => worker());
  await Promise.all(workers);

  return found;
}

function envApiUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  return typeof raw === 'string' ? raw : null;
}

function configuredApiUrl(): string | null {
  const env = envApiUrl();
  if (env && (!isBadDefault(env) || isLocalWebUrl(env))) return normalize(env);

  return null;
}

async function resolve(deviceId: string, opts?: { onDiscoveryProgress?: (p: DiscoverProgress) => void; abortSignal?: AbortSignal }) {
  if (cachedBaseUrl) {
    const ok = await probe(cachedBaseUrl, deviceId, opts?.abortSignal);
    if (ok.ok) return ok.baseUrl;
  }

  const saved = await readSavedBaseUrl();
  if (saved && !isBadDefault(saved)) {
    const ok = await probe(saved, deviceId, opts?.abortSignal);
    if (ok.ok) {
      cachedBaseUrl = ok.baseUrl;
      return ok.baseUrl;
    }
  }

  const configured = configuredApiUrl();
  if (configured) {
    for (const candidate of asUrlCandidates(configured)) {
      const ok = await probe(candidate, deviceId, opts?.abortSignal);
      if (ok.ok) {
        await saveBaseUrl(ok.baseUrl);
        return ok.baseUrl;
      }
    }
  }

  const found = await discoverOnLan(deviceId, { onProgress: opts?.onDiscoveryProgress, abortSignal: opts?.abortSignal });
  if (found) {
    await saveBaseUrl(found);
    return found;
  }

  return null;
}

export const ApiBaseUrl = {
  SECURE_STORE_KEY,
  normalize,
  isBadDefault,
  asUrlCandidates,
  probe,
  resolve,
  readSavedBaseUrl,
  saveBaseUrl,
  clearSavedBaseUrl,
  getConfiguredApiUrl: () => configuredApiUrl(),
  getCached: () => cachedBaseUrl,
  discoverOnLan,
};

export type { DiscoverProgress, ProbeResult };
