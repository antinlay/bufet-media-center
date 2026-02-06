import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ApiBaseUrl, type DiscoverProgress, type ProbeResult } from '@/services/api-base-url';
import { PlayerService } from '@/services/player-service';

export default function SetupScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [progress, setProgress] = useState<DiscoverProgress | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const init = async () => {
      const id = await PlayerService.getOrCreateDeviceId();
      setDeviceId(id);
      const saved = await ApiBaseUrl.readSavedBaseUrl();
      setSavedUrl(saved);
      if (saved) setInput(saved);
    };
    init();
  }, []);

  const candidates = useMemo(() => ApiBaseUrl.asUrlCandidates(input), [input]);

  const runProbe = async (value: string) => {
    if (!deviceId) return;
    setBusy(true);
    setMessage(null);
    setProbeResult(null);
    try {
      const result = await ApiBaseUrl.probe(value, deviceId);
      setProbeResult(result);
      setMessage(result.ok ? `OK: ${result.baseUrl}` : `Fail: ${result.reason}${result.status ? ` (${result.status})` : ''}`);
    } finally {
      setBusy(false);
    }
  };

  const onTest = async () => {
    const first = candidates[0];
    if (!first) {
      setMessage('Enter API host or URL (example: 192.168.1.10:3000 or https://api.example.com).');
      return;
    }
    await runProbe(first);
  };

  const onSave = async () => {
    const first = candidates[0];
    if (!first) {
      setMessage('Enter API host or URL first.');
      return;
    }
    if (!deviceId) return;
    setBusy(true);
    setMessage(null);
    setProbeResult(null);
    try {
      // Save only after a successful probe, to avoid bricking the app.
      const result = await ApiBaseUrl.probe(first, deviceId);
      setProbeResult(result);
      if (!result.ok) {
        setMessage(`Not saved. ${result.reason}${result.status ? ` (${result.status})` : ''}`);
        return;
      }
      await ApiBaseUrl.saveBaseUrl(result.baseUrl);
      setSavedUrl(result.baseUrl);
      setMessage(`Saved: ${result.baseUrl}`);
      router.replace('/loading');
    } finally {
      setBusy(false);
    }
  };

  const onClear = async () => {
    setBusy(true);
    setMessage(null);
    setProbeResult(null);
    try {
      await ApiBaseUrl.clearSavedBaseUrl();
      setSavedUrl(null);
      setInput('');
      setMessage('Saved URL cleared.');
    } finally {
      setBusy(false);
    }
  };

  const onAutoDiscover = async () => {
    if (!deviceId) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setBusy(true);
    setMessage('Scanning local network...');
    setProbeResult(null);
    setProgress({ total: 0, done: 0 });
    try {
      const found = await ApiBaseUrl.discoverOnLan(deviceId, {
        abortSignal: abortRef.current.signal,
        onProgress: (p) => setProgress(p),
      });
      if (!found) {
        setMessage('No server found on LAN. Check Wi-Fi/Ethernet and try manual URL.');
        return;
      }
      await ApiBaseUrl.saveBaseUrl(found);
      setSavedUrl(found);
      setInput(found);
      setMessage(`Found and saved: ${found}`);
      router.replace('/loading');
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const onCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setProgress(null);
    setMessage('Discovery cancelled.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BUFET Player Setup</Text>

      <Text style={styles.label}>Saved API URL</Text>
      <Text style={styles.value}>{savedUrl ?? '(none)'}</Text>

      <Text style={styles.label}>Enter API URL or host</Text>
      <TextInput
        style={styles.input}
        value={input}
        editable={!busy}
        onChangeText={setInput}
        placeholder="192.168.1.10:3000 or https://api.example.com"
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onTest} disabled={busy}>
          <Text style={styles.buttonText}>Test</Text>
        </Pressable>
        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onSave} disabled={busy}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.buttonSecondary, busy && styles.buttonDisabled]} onPress={onAutoDiscover} disabled={busy}>
          <Text style={styles.buttonText}>Auto-discover</Text>
        </Pressable>
        <Pressable style={[styles.buttonSecondary, busy && styles.buttonDisabled]} onPress={onClear} disabled={busy}>
          <Text style={styles.buttonText}>Clear saved</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable style={styles.linkButton} onPress={() => router.push('/diagnostics')}>
          <Text style={styles.linkText}>Open diagnostics</Text>
        </Pressable>
        {busy && progress ? (
          <Pressable style={styles.linkButton} onPress={onCancel}>
            <Text style={styles.linkText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>

      {busy ? <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} /> : null}

      {progress ? (
        <Text style={styles.muted}>
          Scanning: {progress.done}/{progress.total}{progress.current ? ` (${progress.current})` : ''}
        </Text>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {probeResult && !probeResult.ok && probeResult.body ? (
        <Text style={styles.muted}>Body: {probeResult.body}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 18,
  },
  label: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  value: {
    color: '#ffffff',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#111',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#2a7bff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  linkText: {
    color: '#4da3ff',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  spinner: {
    marginTop: 18,
  },
  message: {
    color: '#ffffff',
    marginTop: 14,
    fontSize: 14,
  },
  muted: {
    color: '#aaaaaa',
    marginTop: 10,
    fontSize: 12,
  },
});

