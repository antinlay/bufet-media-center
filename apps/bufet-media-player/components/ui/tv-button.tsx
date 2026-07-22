import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type TvButtonVariant = 'primary' | 'secondary' | 'ghost';

export type TvButtonProps = Pick<PressableProps, 'disabled' | 'hasTVPreferredFocus' | 'onPress' | 'testID'> & {
  label: string;
  variant?: TvButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: ReactNode;
};

export function TvButton({
  label,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  hasTVPreferredFocus,
  onPress,
  testID,
  icon,
}: TvButtonProps) {
  const [focused, setFocused] = useState(false);
  const variantStyle = variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost;
  const labelStyle = variant === 'primary' ? styles.primaryLabel : variant === 'secondary' ? styles.secondaryLabel : styles.ghostLabel;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      focusable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        focused ? styles.focused : undefined,
        focused ? styles.focusedShadow : undefined,
        pressed ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text
          style={[
            styles.label,
            labelStyle,
            focused ? styles.focusedLabel : undefined,
            textStyle,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    borderWidth: 2,
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#2a7bff',
    borderColor: '#2a7bff',
  },
  secondary: {
    backgroundColor: '#1a1a1a',
    borderColor: '#3a3a3a',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: '#3a3a3a',
  },
  focused: {
    borderColor: '#a6d1ff',
    backgroundColor: '#0f243d',
    transform: [{ scale: 1.02 }],
  },
  focusedShadow: {
    boxShadow: '0 0 10px rgba(166, 209, 255, 0.45)',
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: '#ffffff',
  },
  secondaryLabel: {
    color: '#ffffff',
  },
  ghostLabel: {
    color: '#dbe9ff',
  },
  focusedLabel: {
    color: '#ffffff',
  },
});
