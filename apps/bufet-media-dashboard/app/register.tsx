import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { View, StyleSheet } from 'react-native';
import { Text, Button, HelperText } from 'react-native-paper';
import { TextInput } from '../components/TextInput';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { BrandCard } from '../components/BrandCard';
import { brandFonts, palette } from '../theme';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  email: z.string().email({ message: 'Укажите email' }),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  useProtectedRoute();
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const onSubmit = async (values: RegisterForm) => {
    setError(null);
    try {
      await register(values.firstName, values.lastName, values.email, values.password);
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Ошибка регистрации');
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Буфет</Text>
        <Text style={styles.brandSub}>НОВЫЙ ЛИЧНЫЙ КАБИНЕТ</Text>
      </View>
      <BrandCard style={styles.card}>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Создайте аккаунт для управления контентом и командами.</Text>

        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Имя"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.firstName}
              style={styles.input}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.firstName}>
          {errors.firstName?.message}
        </HelperText>

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Фамилия"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.lastName}
              style={styles.input}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.lastName}>
          {errors.lastName?.message}
        </HelperText>

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
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : null}

        <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.primary}>
          Создать аккаунт
        </Button>
        <Button mode="text" onPress={() => router.push('/login')}>Уже есть аккаунт</Button>
      </BrandCard>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
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
