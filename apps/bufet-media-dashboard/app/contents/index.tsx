import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text } from 'react-native-paper';
import { TextInput } from '../../components/TextInput';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function ContentsScreen() {
  useProtectedRoute();
  const queryClient = useQueryClient();
  const contentsQuery = useQuery({ queryKey: ['contents'], queryFn: ({ signal }) => apiClient.getContents(signal) });

  const [type, setType] = useState('Graphic');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [renderAs, setRenderAs] = useState('plaintext');
  const [format, setFormat] = useState('h:mm a');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Parameters<typeof apiClient.createContent>[0] = {
        type,
        name: name || undefined,
        duration: duration ? Number(duration) : undefined,
      };

      if (type === 'Video') payload.url = url || undefined;
      if (type === 'RichText') {
        payload.text = text || undefined;
        payload.render_as = renderAs || undefined;
      }
      if (type === 'Clock') payload.format = format || undefined;

      const pickedFile = file
        ? { uri: file.uri, name: file.name ?? 'upload', type: file.mimeType ?? 'image/jpeg' }
        : undefined;
      return apiClient.createContent(payload, pickedFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      setName('');
      setDuration('');
      setText('');
      setUrl('');
      setFile(null);
    },
  });

  const contents = contentsQuery.data ?? [];

  return (
    <AppShell
      title="Материалы"
      subtitle="Загружайте изображения, видео и текстовые блоки для плейлистов."
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['contents'] })}>
          Обновить
        </Button>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Новый материал</Text>
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Тип</Text>
            <RadioButton.Group value={type} onValueChange={setType}>
              <RadioButton.Item label="Графика" value="Graphic" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="Видео" value="Video" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="Текст" value="RichText" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="Часы" value="Clock" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </View>
        </View>
        <TextInput label="Название" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Длительность (сек)" value={duration} onChangeText={setDuration} style={styles.input} />
        {type === 'Graphic' ? (
          <Button
            mode="outlined"
            onPress={async () => {
              const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
              if (!result.canceled) setFile(result.assets[0]);
            }}
          >
            {file ? `Файл: ${file.name}` : 'Выбрать изображение'}
          </Button>
        ) : null}
        {type === 'Video' ? (
          <TextInput label="URL видео" value={url} onChangeText={setUrl} style={styles.input} />
        ) : null}
        {type === 'RichText' ? (
          <>
            <TextInput label="Текст" value={text} onChangeText={setText} style={styles.input} multiline />
            <TextInput label="Режим (plaintext/html)" value={renderAs} onChangeText={setRenderAs} style={styles.input} />
          </>
        ) : null}
        {type === 'Clock' ? (
          <TextInput label="Формат" value={format} onChangeText={setFormat} style={styles.input} />
        ) : null}
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Создать контент
        </Button>
      </BrandCard>

      <Section title="Библиотека" subtitle="Все загруженные материалы.">
        {contents.length === 0 ? (
          <EmptyState title="Материалов нет" subtitle="Добавьте изображения, видео или текст." />
        ) : (
          contents.map((content) => (
            <BrandCard key={content.id}>
              <Text style={styles.contentName}>{content.name ?? `Материал #${content.id}`}</Text>
              <Text style={styles.contentMeta}>Тип: {content.type}</Text>
              {content.imageUrl ? <Text style={styles.contentMeta}>Изображение: {content.imageUrl}</Text> : null}
              {content.url ? <Text style={styles.contentMeta}>URL: {content.url}</Text> : null}
            </BrandCard>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: palette.charcoal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFDF9',
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  selector: {
    flex: 1,
    minWidth: 220,
  },
  selectorTitle: {
    fontFamily: brandFonts.bodyEmphasis,
    color: palette.slate,
    marginBottom: 6,
  },
  radioLabel: {
    fontFamily: brandFonts.body,
    fontSize: 14,
  },
  contentName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  contentMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
});
