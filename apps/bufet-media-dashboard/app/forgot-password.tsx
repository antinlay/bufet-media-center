import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { HelperText, Text } from 'react-native-paper';
import { z } from 'zod';
import { AuthButton, AuthInput } from '@/components/auth-controls';
import { AuthLayout } from '@/components/auth-layout';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

type ForgotPasswordForm = { email: string };

export default function ForgotPasswordScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const schema = useMemo(() => z.object({
    email: z.string().trim().email({ message: t('auth.login.emailRequired') }),
  }), [t]);
  const { control, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<ForgotPasswordForm>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const onSubmit = async ({ email }: ForgotPasswordForm) => {
    setError(null);
    setSent(false);
    if (!supabase) {
      setError(t('common.unknownError'));
      return;
    }

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : Linking.createURL('reset-password');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (resetError) {
      setError(t('common.unknownError'));
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout title={t('auth.forgotPassword.title')} subtitle={t('auth.forgotPassword.subtitle')}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            accessibilityLabel={t('auth.login.email')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label={t('auth.login.email')}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={Boolean(errors.email)}
          />
        )}
      />
      <HelperText type="error" visible={Boolean(errors.email)}>{errors.email?.message}</HelperText>
      {sent ? <Text style={{ color: colors.success }}>{t('auth.forgotPassword.sent')}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
      <AuthButton disabled={!isValid} loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t(isSubmitting ? 'auth.forgotPassword.submitting' : 'auth.forgotPassword.submit')}
      </AuthButton>
      <AuthButton secondary onPress={() => router.replace('/login')}>{t('auth.forgotPassword.backToLogin')}</AuthButton>
    </AuthLayout>
  );
}
