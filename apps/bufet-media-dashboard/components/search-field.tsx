import { StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../providers/AppThemeProvider';
import { brandFonts, type AppColors } from '../theme';

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) {
  const { colors, radius } = useAppTheme();
  const styles = createStyles(colors, radius.lg);
  return (
    <View style={styles.frame}>
      <MaterialCommunityIcons name="magnify" color={colors.textMuted} size={20} />
      <TextInput
        accessibilityLabel={placeholder}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const createStyles = (colors: AppColors, radiusLg: number) => StyleSheet.create({
  frame: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
  input: { minWidth: 0, flex: 1, paddingVertical: 10, color: colors.textPrimary, fontFamily: brandFonts.body, fontSize: 14 },
});
