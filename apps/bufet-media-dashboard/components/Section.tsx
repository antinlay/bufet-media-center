import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { brandFonts, type AppColors } from '../theme';
import { useAppTheme } from '../providers/AppThemeProvider';

export function Section({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
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

const createStyles = (colors: AppColors) => StyleSheet.create({
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
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: brandFonts.body,
    color: colors.textSecondary,
  },
  body: {
    gap: 12,
  },
});
