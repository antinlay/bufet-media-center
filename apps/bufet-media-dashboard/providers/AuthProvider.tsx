import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { apiClient } from '../lib/api';
import { consumeAuthUrl, supabase } from '../lib/supabase';
import type { ConcertoUser } from '@bufet/shared';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  token: string | null;
  user: ConcertoUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authRedirectUrl = (path: string) => (
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/${path}`
    : Linking.createURL(path)
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ConcertoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const syncRequest = useRef(0);
  const sessionUserId = useRef<string | null>(null);

  const syncSession = useCallback(async (session: Session | null, throwOnError = false) => {
    const requestId = ++syncRequest.current;
    const nextToken = session?.access_token ?? null;
    const nextUserId = session?.user.id ?? null;

    if (sessionUserId.current !== nextUserId) {
      sessionUserId.current = nextUserId;
      queryClient.clear();
      setUser(null);
    }

    if (!session) {
      apiClient.setToken(null);
      setToken(null);
      setUser(null);
      return;
    }

    apiClient.setToken(nextToken);
    try {
      const nextUser = await apiClient.me();
      if (requestId === syncRequest.current) {
        setToken(nextToken);
        setUser(nextUser);
      }
    } catch (error) {
      if (requestId === syncRequest.current) {
        apiClient.setToken(null);
        setToken(null);
        setUser(null);
      }
      if (throwOnError) throw error;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;
    let active = true;
    const initialize = async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      await syncSession(data.session);
      if (active) setLoading(false);
    };
    if (Platform.OS === 'web') {
      void initialize();
    } else {
      void Linking.getInitialURL().then((url) => consumeAuthUrl(url)).then(() => initialize());
    }

    const { data: authState } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setTimeout(() => {
        if (active) void syncSession(session);
      }, 0);
    });
    const urlSubscription = Platform.OS === 'web'
      ? null
      : Linking.addEventListener('url', ({ url }) => {
          void consumeAuthUrl(url);
        });

    return () => {
      active = false;
      authState.subscription.unsubscribe();
      urlSubscription?.remove();
    };
  }, [syncSession]);

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('SUPABASE_SESSION_MISSING');
    await syncSession(data.session, true);
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: authRedirectUrl('login'),
      },
    });
    if (error) throw error;
    if (!data.session) return { requiresEmailConfirmation: true };
    await syncSession(data.session, true);
    return { requiresEmailConfirmation: false };
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    await syncSession(null);
  };

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
