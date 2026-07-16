import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Button, HelperText } from 'react-native-paper';
import { TextInput } from '../components/TextInput';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { BrandCard } from '../components/BrandCard';
import { brandFonts, palette } from '../theme';

const loginSchema = z.object({
  email: z.string().email({ message: 'Укажите email' }),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<LoginForm>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    setError(null);
    try {
      await login(values.email, values.password);
      router.replace('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка авторизации');
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.page}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>Буфет</Text>
        <Text style={styles.brandSub}>ЦИФРОВОЙ ШТАБ ЭКРАНОВ</Text>
      </View>
      <BrandCard style={styles.card}>
        <Text style={styles.title}>Вход в кабинет</Text>
        <Text style={styles.subtitle}>Управляйте экранами, фидами и контентом в одном месте.</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.email}
              style={styles.input}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.email}>
          {errors.email?.message}
        </HelperText>

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Пароль"
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.password}
              style={styles.input}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.password}>
          {errors.password?.message}
        </HelperText>

        {error ? (
          <HelperText type="error" visible selectable>
            {error}
          </HelperText>
        ) : null}

        <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.primary}>
          Войти
        </Button>
        <Button mode="text" onPress={() => router.push('/register')}>Создать аккаунт</Button>
      </BrandCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: palette.ink,
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  hero: {
    gap: 8,
  },
  brand: {
    fontFamily: brandFonts.heading,
    fontSize: 40,
    color: palette.cream,
  },
  brandSub: {
    color: palette.gold,
    letterSpacing: 3,
    fontSize: 12,
    fontFamily: brandFonts.bodyEmphasis,
  },
  card: {
    gap: 12,
  },
  title: {
    fontFamily: brandFonts.heading,
    fontSize: 24,
    color: palette.charcoal,
  },
  subtitle: {
    fontFamily: brandFonts.body,
    color: palette.slate,
  },
  input: {
    backgroundColor: '#FFFDF9',
  },
  primary: {
    marginTop: 8,
  },
});
