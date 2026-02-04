import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { brandFonts, palette } from '../theme';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.fog,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: palette.charcoal,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: brandFonts.body,
    color: palette.slate,
    textAlign: 'center',
  },
});
