import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function ModerationRedirect() {
  useProtectedRoute();
  const router = useRouter();

  useEffect(() => {
    router.replace('/screens');
  }, [router]);

  return null;
}
