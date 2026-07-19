import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter, useSegments } from 'expo-router';

const publicSegments = new Set(['login', 'register', 'forgot-password', 'reset-password']);

export function useProtectedRoute() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = publicSegments.has(segments[0]);
    if (!token && !inAuthGroup) {
      router.replace('/login');
    }
    if (token && inAuthGroup) {
      router.replace('/');
    }
  }, [token, loading, segments, router]);
}
