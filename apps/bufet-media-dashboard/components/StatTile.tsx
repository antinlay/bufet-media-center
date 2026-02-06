import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { brandFonts, palette } from '../theme';

export function StatTile({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFF6E6',
    borderWidth: 1,
    borderColor: palette.fog,
    gap: 6,
  },
  icon: {
    width: 28,
    height: 28,
  },
  label: {
    color: palette.slate,
    fontFamily: brandFonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  value: {
    fontFamily: brandFonts.heading,
    fontSize: 24,
    color: palette.charcoal,
  },
});
