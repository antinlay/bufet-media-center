import { TextInput as PaperTextInput, type TextInputProps } from 'react-native-paper';
import { palette } from '../theme';

export function TextInput(props: TextInputProps) {
  return (
    <PaperTextInput
      textColor={palette.charcoal}
      placeholderTextColor={palette.slate}
      {...props}
    />
  );
}
