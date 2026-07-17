import { TextInput as PaperTextInput, type TextInputProps } from 'react-native-paper';
import { useAppTheme } from '../providers/AppThemeProvider';

export function TextInput(props: TextInputProps) {
  const { colors } = useAppTheme();
  return (
    <PaperTextInput
      mode="outlined"
      textColor={colors.textPrimary}
      placeholderTextColor={colors.textMuted}
      outlineColor={colors.inputBorder}
      activeOutlineColor={colors.inputFocusBorder}
      style={{ backgroundColor: colors.inputBackground }}
      {...props}
    />
  );
}
