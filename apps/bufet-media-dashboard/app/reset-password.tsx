import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { HelperText, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { AuthButton, AuthInput } from '@/components/auth-controls';
import { AuthLayout } from '@/components/auth-layout';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useI18n } from '@/providers/I18nProvider';

type ResetPasswordForm = { password: string; confirmation: string };

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const schema = useMemo(() => z.object({
    password: z.string().min(6, t('auth.login.passwordMin')),
    confirmation: z.string().min(1, t('auth.resetPassword.confirmationRequired')),
  }).refine((values) => values.password === values.confirmation, {
    path: ['confirmation'],
    message: t('auth.resetPassword.mismatch'),
  }), [t]);
  const { control, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<ResetPasswordForm>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { password: '', confirmation: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data: authState } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === 'PASSWORD_RECOVERY') setReady(Boolean(session));
    });
    return () => {
      active = false;
      authState.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async ({ password }: ResetPasswordForm) => {
    if (!supabase) return;
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(t('common.unknownError'));
      return;
    }
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <AuthLayout title={t('auth.resetPassword.title')} subtitle={t('auth.resetPassword.subtitle')}>
      {!ready ? <Text style={{ color: colors.textSecondary }}>{t('auth.resetPassword.invalidLink')}</Text> : null}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            accessibilityLabel={t('auth.login.password')}
            autoComplete="new-password"
            label={t('auth.login.password')}
            secureTextEntry={!passwordVisible}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={Boolean(errors.password)}
            right={<TextInput.Icon accessibilityLabel={t(passwordVisible ? 'auth.password.hide' : 'auth.password.show')} icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'} onPress={() => setPasswordVisible((visible) => !visible)} />}
          />
        )}
      />
      <HelperText type="error" visible={Boolean(errors.password)}>{errors.password?.message}</HelperText>
      <Controller
        control={control}
        name="confirmation"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            accessibilityLabel={t('auth.resetPassword.confirmation')}
            autoComplete="new-password"
            label={t('auth.resetPassword.confirmation')}
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={Boolean(errors.confirmation)}
          />
        )}
      />
      <HelperText type="error" visible={Boolean(errors.confirmation)}>{errors.confirmation?.message}</HelperText>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
      <AuthButton disabled={!ready || !isValid} loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {t(isSubmitting ? 'auth.resetPassword.submitting' : 'auth.resetPassword.submit')}
      </AuthButton>
      <AuthButton secondary onPress={() => router.replace('/login')}>{t('auth.forgotPassword.backToLogin')}</AuthButton>
    </AuthLayout>
  );
}
