import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/api';
import { clearAuth, loadAuth, saveAuth } from '../lib/storage';
import type { ConcertoAuthResponse, ConcertoUser } from '@bufet/shared';

interface AuthContextValue {
  token: string | null;
  user: ConcertoUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistAuth(data: ConcertoAuthResponse) {
  apiClient.setToken(data.access_token);
  return saveAuth({ token: data.access_token, user: data.user });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ConcertoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadAuth();
      if (stored?.token) {
        setToken(stored.token);
        setUser(stored.user ?? null);
        apiClient.setToken(stored.token);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string, remember = true) => {
    const data = await apiClient.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    if (remember) await persistAuth(data);
    else await clearAuth();
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const data = await apiClient.register(firstName, lastName, email, password);
    setToken(data.access_token);
    setUser(data.user);
    await persistAuth(data);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
    await clearAuth();
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
