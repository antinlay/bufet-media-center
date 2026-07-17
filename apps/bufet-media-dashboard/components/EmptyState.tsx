import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { brandFonts, type AppColors } from '../theme';
import { useAppTheme } from '../providers/AppThemeProvider';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { colors, radius } = useAppTheme();
  const styles = createStyles(colors, radius.lg);
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

const createStyles = (colors: AppColors, borderRadius: number) => StyleSheet.create({
  container: {
    padding: 16,
    borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: brandFonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: brandFonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
