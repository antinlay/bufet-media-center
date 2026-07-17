import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { z } from 'zod';
import { AuthButton, AuthInput } from '@/components/auth-controls';
import { AuthLayout } from '@/components/auth-layout';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useI18n } from '@/providers/I18nProvider';

type RegisterForm = { firstName: string; lastName: string; email: string; password: string };

export default function RegisterScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const styles = StyleSheet.create({ error: { color: colors.danger, fontFamily: 'Manrope-Regular', fontSize: 12 } });
  const schema = useMemo(() => z.object({
    firstName: z.string().trim().min(1, t('auth.register.firstNameRequired')),
    lastName: z.string().trim().min(1, t('auth.register.lastNameRequired')),
    email: z.string().trim().email({ message: t('auth.login.emailRequired') }),
    password: z.string().min(1, t('auth.login.passwordRequired')).min(6, t('auth.login.passwordMin')),
  }), [t]);
  const { handleSubmit, formState: { errors, isSubmitting, isValid }, control } = useForm<RegisterForm>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (values: RegisterForm) => {
    setError(null);
    try {
      await register(values.firstName.trim(), values.lastName.trim(), values.email.trim(), values.password);
      router.replace('/');
    } catch {
      setError(t('auth.register.error'));
    }
  };
  const submit = handleSubmit(onSubmit);

  return (
    <AuthLayout title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      {(['firstName', 'lastName', 'email'] as const).map((name, index) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <AuthInput
                accessibilityLabel={t(name === 'firstName' ? 'auth.register.firstName' : name === 'lastName' ? 'auth.register.lastName' : 'auth.login.email')}
                autoCapitalize={name === 'email' ? 'none' : 'words'}
                autoComplete={name === 'email' ? 'email' : name === 'firstName' ? 'given-name' : 'family-name'}
                keyboardType={name === 'email' ? 'email-address' : 'default'}
                label={t(name === 'firstName' ? 'auth.register.firstName' : name === 'lastName' ? 'auth.register.lastName' : 'auth.login.email')}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={Boolean(errors[name])}
                returnKeyType={index === 2 ? 'next' : 'next'}
              />
              <HelperText type="error" visible={Boolean(errors[name])}>{errors[name]?.message}</HelperText>
            </>
          )}
        />
      ))}
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
            returnKeyType="done"
            onSubmitEditing={submit}
            right={<TextInput.Icon accessibilityLabel={t(passwordVisible ? 'auth.password.hide' : 'auth.password.show')} icon={passwordVisible ? 'eye-off-outline' : 'eye-outline'} onPress={() => setPasswordVisible((visible) => !visible)} />}
          />
        )}
      />
      <HelperText type="error" visible={Boolean(errors.password)}>{errors.password?.message}</HelperText>
      {error ? <Text accessibilityRole="alert" selectable style={styles.error}>{error}</Text> : null}
      <AuthButton disabled={!isValid} loading={isSubmitting} onPress={submit}>{t(isSubmitting ? 'auth.register.submitting' : 'auth.register.submit')}</AuthButton>
      <AuthButton secondary onPress={() => router.replace('/login')}>{t('auth.register.backToLogin')}</AuthButton>
    </AuthLayout>
  );
}
