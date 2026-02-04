import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function FeedsScreen() {
  useProtectedRoute();
  const queryClient = useQueryClient();
  const feedsQuery = useQuery({ queryKey: ['feeds'], queryFn: () => apiClient.getFeeds() });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Feed');
  const [groupId, setGroupId] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const [formatter, setFormatter] = useState('headlines');
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name || !groupId) throw new Error('Название и организация обязательны');
      return apiClient.createFeed({
        name,
        description: description || undefined,
        type,
        group_id: groupId,
        url: url || undefined,
        formatter: formatter || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      setName('');
      setDescription('');
      setUrl('');
      setCreateError(null);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Не удалось создать фид';
      setCreateError(message);
    },
  });

  const feeds = (feedsQuery.data ?? []).filter((feed) => feed.config?.kind !== 'playlist');
  const availableGroups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);

  useEffect(() => {
    if (!groupId && availableGroups.length === 1) {
      setGroupId(availableGroups[0].id);
    }
  }, [availableGroups, groupId]);

  return (
    <AppShell
      title="Ленты"
      subtitle="Собирайте материалы в тематические ленты и подключайте к экранам."
      actions={
        <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['feeds'] })}>
          Обновить
        </Button>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Новая лента</Text>
        {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
        <TextInput label="Название" value={name} onChangeText={setName} style={styles.input} />
        <TextInput label="Описание" value={description} onChangeText={setDescription} style={styles.input} />
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Тип</Text>
            <RadioButton.Group value={type} onValueChange={setType}>
              <RadioButton.Item label="Обычная" value="Feed" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="RSS" value="RssFeed" labelStyle={styles.radioLabel} />
              <RadioButton.Item label="Удалённый" value="RemoteFeed" labelStyle={styles.radioLabel} />
            </RadioButton.Group>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Организация</Text>
            <RadioButton.Group
              value={groupId ? String(groupId) : ''}
              onValueChange={(value) => setGroupId(Number(value))}
            >
              {availableGroups.map((group) => (
                <RadioButton.Item
                  key={group.id}
                  label={group.name}
                  value={String(group.id)}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
        </View>
        {type !== 'Feed' ? (
          <View style={styles.selectorRow}>
            <TextInput label="URL" value={url} onChangeText={setUrl} style={styles.input} />
            {type === 'RssFeed' ? (
              <TextInput label="Формат (headlines/details/ticker)" value={formatter} onChangeText={setFormatter} style={styles.input} />
            ) : null}
          </View>
        ) : null}
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Создать ленту
        </Button>
      </BrandCard>

      <Section title="Активные ленты" subtitle="Ленты, доступные для подключения к экранам.">
        {feeds.length === 0 ? (
          <EmptyState title="Лент нет" subtitle="Создайте первую ленту и подключите к экрану." />
        ) : (
          feeds.map((feed) => (
            <BrandCard key={feed.id}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.feedName}>{feed.name}</Text>
                  <Text style={styles.feedMeta}>Тип: {feed.type}</Text>
                  <Text style={styles.feedMeta}>Организация: {feed.groupId}</Text>
                </View>
              </View>
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
  errorText: {
    fontFamily: brandFonts.bodyEmphasis,
    color: '#B42318',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  feedMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
});
