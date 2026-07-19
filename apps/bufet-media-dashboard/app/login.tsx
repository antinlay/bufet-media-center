import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { AuthButton, AuthInput } from '@/components/auth-controls';
import { AuthLayout } from '@/components/auth-layout';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/providers/I18nProvider';

type LoginForm = { email: string; password: string };

export default function LoginScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { emailConfirmation } = useLocalSearchParams<{ emailConfirmation?: string }>();
  const { login } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const styles = createStyles(colors);
  const schema = useMemo(() => z.object({
    email: z.string().trim().email({ message: t('auth.login.emailRequired') }),
    password: z.string().min(1, t('auth.login.passwordRequired')).min(6, t('auth.login.passwordMin')),
  }), [t]);
  const { handleSubmit, formState: { errors, isSubmitting, isValid }, control } = useForm<LoginForm>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      await login(values.email.trim(), values.password);
      router.replace('/');
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : '';
      setError(/invalid credentials|unauthorized|401/i.test(message)
        ? t('auth.login.invalidCredentials')
        : t('common.unknownError'));
    }
  };
  const submit = handleSubmit(onSubmit);

  return (
    <AuthLayout title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
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
            returnKeyType="next"
          />
        )}
      />
      <HelperText type="error" visible={Boolean(errors.email)}>{errors.email?.message}</HelperText>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            accessibilityLabel={t('auth.login.password')}
            autoComplete="current-password"
            label={t('auth.login.password')}
            secureTextEntry={!passwordVisible}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={Boolean(errors.password)}
            returnKeyType="done"
            onSubmitEditing={submit}
            right={(
              <TextInput.Icon
                accessibilityLabel={t(passwordVisible ? 'auth.password.hide' : 'auth.password.show')}
                icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setPasswordVisible((visible) => !visible)}
              />
            )}
          />
        )}
      />
      <HelperText type="error" visible={Boolean(errors.password)}>{errors.password?.message}</HelperText>
      <View style={styles.options}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/forgot-password')}>
          <Text style={styles.link}>{t('auth.login.forgotPassword')}</Text>
        </Pressable>
      </View>
      {emailConfirmation === '1' ? <Text accessibilityRole="alert" style={styles.success}>{t('auth.register.confirmationSent')}</Text> : null}
      {error ? <Text accessibilityRole="alert" selectable style={styles.error}>{error}</Text> : null}
      <AuthButton disabled={!isValid} loading={isSubmitting} onPress={submit}>
        {t(isSubmitting ? 'auth.login.submitting' : 'auth.login.submit')}
      </AuthButton>
      <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>{t('auth.login.divider')}</Text><View style={styles.dividerLine} /></View>
      <AuthButton secondary onPress={() => router.push('/register')}>{t('auth.login.createAccount')}</AuthButton>
    </AuthLayout>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  options: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  link: { color: colors.accent, fontFamily: 'Manrope-SemiBold', fontSize: 12 },
  error: { color: colors.danger, fontFamily: 'Manrope-Regular', fontSize: 12, lineHeight: 18 },
  success: { color: colors.success, fontFamily: 'Manrope-Regular', fontSize: 12, lineHeight: 18 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 3 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontFamily: 'Manrope-Regular', fontSize: 11 },
});
