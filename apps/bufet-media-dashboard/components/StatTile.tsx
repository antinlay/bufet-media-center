import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { brandFonts, type AppColors } from '../theme';
import { useAppTheme } from '../providers/AppThemeProvider';

export function StatTile({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  const { colors, radius } = useAppTheme();
  const styles = createStyles(colors, radius.lg);
  return (
    <View style={styles.container}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors, borderRadius: number) => StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    borderRadius,
    padding: 16,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  icon: {
    width: 28,
    height: 28,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: brandFonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  value: {
    fontFamily: brandFonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
});
