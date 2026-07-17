import { useRouter } from 'expo-router';
import { AuthButton } from '@/components/auth-controls';
import { AuthLayout } from '@/components/auth-layout';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useI18n } from '@/providers/I18nProvider';

export default function ForgotPasswordScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { t } = useI18n();
  return (
    <AuthLayout title={t('auth.forgotPassword.title')} subtitle={t('auth.forgotPassword.subtitle')}>
      <AuthButton secondary onPress={() => router.replace('/login')}>{t('auth.forgotPassword.backToLogin')}</AuthButton>
    </AuthLayout>
  );
}
