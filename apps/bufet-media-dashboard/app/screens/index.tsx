import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, RadioButton, Text, TextInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppShell } from '../../components/AppShell';
import { BrandCard } from '../../components/BrandCard';
import { EmptyState } from '../../components/EmptyState';
import { Section } from '../../components/Section';
import { apiClient } from '../../lib/api';
import { brandFonts, palette } from '../../theme';
import { useProtectedRoute } from '../../hooks/useProtectedRoute';

export default function ScreensScreen() {
  useProtectedRoute();
  const router = useRouter();
  const queryClient = useQueryClient();
  const screensQuery = useQuery({ queryKey: ['screens'], queryFn: () => apiClient.getScreens() });
  const templatesQuery = useQuery({ queryKey: ['templates'], queryFn: () => apiClient.getTemplates() });
  const groupsQuery = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.getGroups() });
  const feedsQuery = useQuery({ queryKey: ['feeds'], queryFn: () => apiClient.getFeeds() });
  const fieldsQuery = useQuery({ queryKey: ['fields'], queryFn: () => apiClient.getFields() });

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [subscriptionFieldId, setSubscriptionFieldId] = useState<number | null>(null);
  const [subscriptionFeedId, setSubscriptionFeedId] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!templateId || !groupId || !name) {
        throw new Error('Заполните имя, организацию и макет');
      }
      return apiClient.createScreen({ name, template_id: templateId, group_id: groupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screens'] });
      setName('');
    },
  });

  const subscriptionsQuery = useQuery({
    queryKey: ['screen-subscriptions', selectedScreenId],
    queryFn: () => apiClient.getScreenSubscriptions(selectedScreenId as number),
    enabled: Boolean(selectedScreenId),
  });

  const assignSubscriptionMutation = useMutation({
    mutationFn: () => {
      if (!selectedScreenId || !subscriptionFieldId || !subscriptionFeedId) {
        throw new Error('Выберите экран, поле и фид');
      }
      return apiClient.createSubscription(selectedScreenId, {
        field_id: subscriptionFieldId,
        feed_id: subscriptionFeedId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-subscriptions', selectedScreenId] });
      setSubscriptionFieldId(null);
      setSubscriptionFeedId(null);
    },
  });

  const removeSubscriptionMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-subscriptions', selectedScreenId] });
    },
  });

  const screens = screensQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const adminGroups = (groupsQuery.data ?? []).filter((group) => !group.systemGroup);
  const feeds = (feedsQuery.data ?? []).filter((feed) => feed.config?.kind !== 'playlist');
  const fields = fieldsQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];

  return (
    <AppShell
      title="Экраны"
      subtitle="Экран = точка показа. Назначайте организации, макеты и отслеживайте онлайн‑статусы."
      actions={
        <View style={styles.headerActions}>
          <Button mode="outlined" onPress={() => router.push('/scan')}>
            Сканировать QR
          </Button>
          <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['screens'] })}>
            Обновить
          </Button>
        </View>
      }
    >
      <BrandCard>
        <Text style={styles.cardTitle}>Создать экран</Text>
        <TextInput
          label="Название"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Организация</Text>
            <RadioButton.Group
              onValueChange={(value) => setGroupId(Number(value))}
              value={groupId ? String(groupId) : ''}
            >
              {adminGroups.map((group) => (
                <RadioButton.Item
                  key={group.id}
                  label={group.name}
                  value={String(group.id)}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Макет</Text>
            <RadioButton.Group
              onValueChange={(value) => setTemplateId(Number(value))}
              value={templateId ? String(templateId) : ''}
            >
              {templates.map((template) => (
                <RadioButton.Item
                  key={template.id}
                  label={template.name}
                  value={String(template.id)}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
        </View>
        <Button mode="contained" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>
          Создать экран
        </Button>
      </BrandCard>

      <BrandCard>
        <Text style={styles.cardTitle}>Назначить ленту экрану</Text>
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Экран</Text>
            <RadioButton.Group
              onValueChange={(value) => setSelectedScreenId(Number(value))}
              value={selectedScreenId ? String(selectedScreenId) : ''}
            >
              {screens.map((screen) => (
                <RadioButton.Item
                  key={screen.id}
                  label={screen.name}
                  value={String(screen.id)}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Поле</Text>
            <RadioButton.Group
              onValueChange={(value) => setSubscriptionFieldId(Number(value))}
              value={subscriptionFieldId ? String(subscriptionFieldId) : ''}
            >
              {fields.map((field) => (
                <RadioButton.Item
                  key={field.id}
                  label={field.name}
                  value={String(field.id)}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorTitle}>Лента</Text>
            <RadioButton.Group
              onValueChange={(value) => setSubscriptionFeedId(Number(value))}
              value={subscriptionFeedId ? String(subscriptionFeedId) : ''}
            >
              {feeds.map((feed) => (
                <RadioButton.Item
                  key={feed.id}
                  label={feed.name}
                  value={String(feed.id)}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={() => assignSubscriptionMutation.mutate()}
          loading={assignSubscriptionMutation.isPending}
        >
          Подключить ленту
        </Button>
      </BrandCard>

      <Section title="Подключенные ленты" subtitle="Что именно показывается на выбранном экране.">
        {!selectedScreenId ? (
          <EmptyState title="Экран не выбран" subtitle="Выберите экран, чтобы увидеть его ленты." />
        ) : subscriptions.length === 0 ? (
          <EmptyState title="Лент нет" subtitle="Подключите ленты, чтобы экран начал показывать материалы." />
        ) : (
          subscriptions.map((subscription) => (
            <BrandCard key={subscription.id}>
              <View style={styles.screenRow}>
                <View>
                  <Text style={styles.screenName}>{subscription.feed?.name ?? `Лента #${subscription.feedId}`}</Text>
                  <Text style={styles.screenMeta}>Поле: {subscription.field?.name ?? `#${subscription.fieldId}`}</Text>
                  <Text style={styles.screenMeta}>Вес: {subscription.weight}</Text>
                </View>
                <Button
                  mode="text"
                  onPress={() => removeSubscriptionMutation.mutate(subscription.id)}
                  loading={removeSubscriptionMutation.isPending}
                >
                  Удалить
                </Button>
              </View>
            </BrandCard>
          ))
        )}
      </Section>

      <Section title="Список экранов" subtitle="Подключенные и ожидающие привязку устройства.">
        {screens.length === 0 ? (
          <EmptyState title="Экранов нет" subtitle="Создайте первый экран и привяжите устройство через QR." />
        ) : (
          screens.map((screen) => (
            <BrandCard key={screen.id}>
              <View style={styles.screenRow}>
                <View>
                  <Text style={styles.screenName}>{screen.name}</Text>
                  <Text style={styles.screenMeta}>Организация: {screen.group?.name ?? screen.groupId}</Text>
                  <Text style={styles.screenMeta}>Макет: {screen.template?.name ?? screen.templateId}</Text>
                </View>
                <View style={styles.screenActions}>
                  <View style={statusPillStyle(screen.online)}>
                    <Text style={styles.statusText}>{screen.online ? 'ONLINE' : 'OFFLINE'}</Text>
                  </View>
                  <Button mode="text" onPress={() => router.push(`/screens/${screen.id}`)}>
                    Открыть
                  </Button>
                </View>
              </View>
              <Text style={styles.screenMeta}>Последний сигнал: {screen.lastSeenAt ?? 'Нет данных'}</Text>
              <Text style={styles.screenMeta}>Device ID: {screen.device?.deviceId ?? 'Не привязан'}</Text>
            </BrandCard>
          ))
        )}
      </Section>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  screenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  screenActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  screenName: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
  },
  screenMeta: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    marginTop: 4,
  },
  statusText: {
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 12,
    color: palette.charcoal,
  },
});

const statusPillStyle = (online?: boolean) => ({
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  backgroundColor: online ? '#E8F4E8' : '#F3E3DE',
  borderWidth: 1,
  borderColor: online ? '#B9D7B9' : '#E0B4A6',
});
