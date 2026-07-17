import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../providers/AppThemeProvider';

export function BrandCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors, radius } = useAppTheme();
  const styles = StyleSheet.create({ card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: colors.shadowSoft,
  } });
  return <View style={[styles.card, style]}>{children}</View>;
}
