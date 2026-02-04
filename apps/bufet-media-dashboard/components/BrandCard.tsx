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
    shadowColor: '#1C1206',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
