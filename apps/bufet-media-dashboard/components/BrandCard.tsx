import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { palette } from '../theme';

export function BrandCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.fog,
    boxShadow: '0 6px 12px rgba(28, 18, 6, 0.08)',
  },
});
