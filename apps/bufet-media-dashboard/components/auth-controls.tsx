import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, TextInput, type TextInputProps } from 'react-native-paper';
import { useAppTheme } from '@/providers/AppThemeProvider';
import type { AppColors } from '@/theme';

export function AuthInput(props: TextInputProps) {
  const { colors, radius } = useAppTheme();
  return (
    <TextInput
      mode="outlined"
      outlineColor={colors.inputBorder}
      activeOutlineColor={colors.inputFocusBorder}
      textColor={colors.textPrimary}
      placeholderTextColor={colors.textMuted}
      style={{ backgroundColor: colors.inputBackground, borderRadius: radius.md }}
      contentStyle={{ fontFamily: 'Manrope-Regular' }}
      {...props}
    />
  );
}

export function AuthButton({
  children,
  onPress,
  loading = false,
  disabled = false,
  secondary = false,
}: {
  children: ReactNode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={secondary ? colors.accent : colors.onAccent} size="small" /> : null}
      <Text style={[styles.buttonText, secondary ? styles.secondaryText : styles.primaryText]}>{children}</Text>
    </Pressable>
  );
}

export function AuthCheckbox({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <MaterialCommunityIcons name="check" color={colors.onAccent} size={15} /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  primary: { borderColor: colors.accent, backgroundColor: colors.accent },
  secondary: { borderColor: colors.accent, backgroundColor: 'transparent' },
  buttonText: { fontFamily: 'Manrope-SemiBold', fontSize: 15 },
  primaryText: { color: colors.onAccent },
  secondaryText: { color: colors.accent },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.72 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 36 },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
  },
  checkboxChecked: { borderColor: colors.accent, backgroundColor: colors.accent },
  checkboxLabel: { color: colors.textSecondary, fontFamily: 'Manrope-Regular', fontSize: 12 },
});

