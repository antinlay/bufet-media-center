import { StyleSheet, Text, View } from 'react-native';

import { MonitorAlertIcon } from '@/components/ui/player-design';

export function NoContent() {
  return (
    <View style={styles.container}>
      <MonitorAlertIcon />
      <Text style={styles.title}>Нет назначенного контента</Text>
      <Text style={styles.subtitle}>Назначьте плейлист в кабинете</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 42,
    lineHeight: 52,
    fontWeight: '700',
    marginTop: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: '#a9aaad',
    fontSize: 28,
    lineHeight: 36,
    marginTop: 10,
    textAlign: 'center',
  },
});
