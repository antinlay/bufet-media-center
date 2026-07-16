import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { brandFonts, palette } from '../theme';

export function Section({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heading: {
    flex: 1,
    gap: 4,
  },
  actions: {
    alignItems: 'center',
  },
  title: {
    fontFamily: brandFonts.heading,
    fontSize: 20,
    color: palette.charcoal,
  },
  subtitle: {
    fontFamily: brandFonts.body,
    color: palette.slate,
  },
  body: {
    gap: 12,
  },
});
