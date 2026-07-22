import { StyleSheet, Text, View } from 'react-native';

import { MonitorAlertIcon } from '@/components/ui/player-design';
import { playerColors } from '@/components/ui/player-theme';
import { usePlayerLocalization } from '@/localization/player-localization';

export function NoContent() {
  const { t } = usePlayerLocalization();

  return (
    <View style={styles.container}>
      <MonitorAlertIcon />
      <Text style={styles.title}>{t('player.emptyTitle')}</Text>
      <Text style={styles.subtitle}>{t('player.emptySubtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    color: playerColors.primaryText,
    fontSize: 42,
    lineHeight: 52,
    fontWeight: '700',
    marginTop: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: playerColors.secondaryText,
    fontSize: 28,
    lineHeight: 36,
    marginTop: 10,
    textAlign: 'center',
  },
});
