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
import { useAppTheme } from '../../providers/AppThemeProvider';
import { useI18n } from '../../providers/I18nProvider';
import { brandFonts, type AppColors } from '../../theme';
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
  const { colors } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors);

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
      title={t('contents.title')}
      subtitle={t('contents.subtitle')}
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['contents'] })}>
          {t('common.refresh')}
        </Button>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>{t('contents.newTitle')}</Text>
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>{t('contents.type')}</Text>
            <RadioButton.Group value={type} onValueChange={setType}>
              <RadioButton.Item label={t('contents.typeGraphic')} value="Graphic" labelStyle={styles.radioLabel} />
              <RadioButton.Item label={t('contents.typeVideo')} value="Video" labelStyle={styles.radioLabel} />
              <RadioButton.Item label={t('contents.typeText')} value="RichText" labelStyle={styles.radioLabel} />
              <RadioButton.Item label={t('contents.typeClock')} value="Clock" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </View>
        </View>
        <TextInput label={t('contents.name')} value={name} onChangeText={setName} style={styles.input} />
        <TextInput label={t('contents.duration')} value={duration} onChangeText={setDuration} style={styles.input} />
        {type === 'Graphic' ? (
          <Button
            mode="outlined"
            onPress={async () => {
              const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
              if (!result.canceled) setFile(result.assets[0]);
            }}
          >
            {file ? t('contents.file', { name: file.name }) : t('contents.chooseImage')}
          </Button>
        ) : null}
        {type === 'Video' ? (
          <TextInput label={t('contents.videoUrl')} value={url} onChangeText={setUrl} style={styles.input} />
        ) : null}
        {type === 'RichText' ? (
          <>
            <TextInput label={t('contents.text')} value={text} onChangeText={setText} style={styles.input} multiline />
            <TextInput label={t('contents.renderMode')} value={renderAs} onChangeText={setRenderAs} style={styles.input} />
          </>
        ) : null}
        {type === 'Clock' ? (
          <TextInput label={t('contents.format')} value={format} onChangeText={setFormat} style={styles.input} />
        ) : null}
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          {t('contents.create')}
        </Button>
      </BrandCard>

      <Section title={t('contents.library')} subtitle={t('contents.librarySubtitle')}>
        {contents.length === 0 ? (
          <EmptyState title={t('contents.emptyTitle')} subtitle={t('contents.emptySubtitle')} />
        ) : (
          contents.map((content) => (
            <BrandCard key={content.id}>
              <Text style={styles.contentName}>{content.name ?? t('contents.unnamed', { id: content.id })}</Text>
              <Text style={styles.contentMeta}>{t('contents.metaType', { type: content.type })}</Text>
              {content.imageUrl ? <Text selectable style={styles.contentMeta}>{t('contents.metaImage', { url: content.imageUrl })}</Text> : null}
              {content.url ? <Text selectable style={styles.contentMeta}>{t('contents.metaUrl', { url: content.url })}</Text> : null}
            </BrandCard>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cardTitle: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBackground,
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
    color: colors.textSecondary,
    marginBottom: 6,
  },
  radioLabel: {
    fontFamily: brandFonts.body,
    fontSize: 14,
  },
  contentName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
  },
  contentMeta: {
    fontFamily: brandFonts.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
