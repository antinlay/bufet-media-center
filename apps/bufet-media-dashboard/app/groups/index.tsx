import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { TextInput } from '../../components/TextInput';
import { GalleryShell } from '../../features/media-points/GalleryShell';
import { useCreateOrganization } from '../../features/media-points/hooks';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';
import { brandFonts, palette } from '../../theme';

export default function AddOrganizationScreen() {
  useProtectedRoute();
  const router = useRouter();
  const createMutation = useCreateOrganization();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => {
    createMutation.mutate(
      { name, description },
      { onSuccess: () => router.replace('/') },
    );
  };

  return (
    <GalleryShell
      showBack
      title="Добавить организацию"
      subtitle="Новая секция появится на главном экране."
    >
      <View style={styles.card}>
        <Text style={styles.title}>Новая организация</Text>
        <Text style={styles.hint}>Укажите название, по которому команда узнает эту медиа-точку.</Text>
        <TextInput
          mode="outlined"
          label="Название"
          value={name}
          onChangeText={(value) => {
            setName(value);
            createMutation.reset();
          }}
          autoFocus
          textColor={palette.cream}
          outlineColor="#3A3D45"
          activeOutlineColor={palette.gold}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Описание (необязательно)"
          value={description}
          onChangeText={setDescription}
          textColor={palette.cream}
          outlineColor="#3A3D45"
          activeOutlineColor={palette.gold}
          style={styles.input}
        />
        {createMutation.isError ? (
          <HelperText type="error" visible style={styles.error}>
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Не удалось создать организацию'}
          </HelperText>
        ) : null}
        <Button
          mode="contained"
          buttonColor={palette.gold}
          textColor={palette.ink}
          contentStyle={styles.buttonContent}
          disabled={!name.trim() || createMutation.isPending}
          loading={createMutation.isPending}
          onPress={submit}
        >
          Добавить
        </Button>
      </View>
    </GalleryShell>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: 14,
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2E3138',
    backgroundColor: palette.panel,
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)',
  },
  title: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 20,
  },
  hint: {
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  input: {
    backgroundColor: palette.panelRaised,
  },
  error: {
    paddingHorizontal: 0,
  },
  buttonContent: {
    minHeight: 48,
  },
});
