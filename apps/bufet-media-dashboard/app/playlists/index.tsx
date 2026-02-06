import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function PlaylistsRedirect() {
  useProtectedRoute();
  const router = useRouter();

  useEffect(() => {
    router.replace('/contents');
  }, [router]);

  return null;
}
