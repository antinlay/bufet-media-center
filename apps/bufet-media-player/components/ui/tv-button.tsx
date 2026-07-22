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

import { playerColors, playerShadows } from '@/components/ui/player-theme';

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
  const focusedStyle = variant === 'primary' ? styles.primaryFocused : styles.secondaryFocused;

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
        focused ? focusedStyle : undefined,
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
    backgroundColor: playerColors.accentButton,
    borderColor: playerColors.accentBorder,
  },
  secondary: {
    backgroundColor: playerColors.panel,
    borderColor: playerColors.panelBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: playerColors.panelBorder,
  },
  primaryFocused: {
    borderColor: playerColors.primaryText,
    backgroundColor: playerColors.accent,
    transform: [{ scale: 1.02 }],
  },
  secondaryFocused: {
    borderColor: playerColors.accentBorder,
    backgroundColor: playerColors.focusedPanel,
    transform: [{ scale: 1.02 }],
  },
  focusedShadow: {
    boxShadow: playerShadows.focused,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: playerColors.primaryText,
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
    color: playerColors.primaryText,
  },
  secondaryLabel: {
    color: playerColors.primaryText,
  },
  ghostLabel: {
    color: playerColors.primaryText,
  },
  focusedLabel: {
    color: playerColors.primaryText,
  },
});
