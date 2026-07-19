import { useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../providers/AppThemeProvider';
import { useI18n } from '../providers/I18nProvider';
import type { TranslationKey } from '../locales/ru';
import { brandFonts, type AppColors } from '../theme';

type TabItem = {
  href: '/' | '/summary' | '/media' | '/playlists' | '/settings';
  label: TranslationKey;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const tabs: readonly TabItem[] = [
  { href: '/summary', label: 'tabs.summary', icon: 'chart-box-outline' },
  { href: '/', label: 'tabs.screens', icon: 'monitor' },
  { href: '/media', label: 'tabs.media', icon: 'image-multiple-outline' },
  { href: '/playlists', label: 'tabs.playlists', icon: 'playlist-play' },
  { href: '/settings', label: 'tabs.settings', icon: 'cog-outline' },
];

export function MainTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [hovered, setHovered] = useState<string | null>(null);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.xl, radius.pill, width < 430);
  const webGlass = Platform.select({
    web: { backdropFilter: 'blur(24px)' } as ViewStyle,
    default: undefined,
  });

  return (
    <View style={[styles.frame, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, webGlass]}>
        {tabs.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Pressable
              key={tab.href}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onHoverIn={() => setHovered(tab.href)}
              onHoverOut={() => setHovered(null)}
              onPress={() => router.replace(tab.href as Href)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                hovered === tab.href && !active && styles.tabHovered,
                pressed && styles.tabPressed,
              ]}
            >
              <MaterialCommunityIcons name={tab.icon} color={active ? colors.tabBarActive : colors.tabBarInactive} size={22} />
              <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>{t(tab.label)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors, radiusXl: number, radiusPill: number, compact: boolean) => StyleSheet.create({
  frame: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, alignItems: 'center', paddingHorizontal: compact ? 10 : 20, paddingTop: 10, pointerEvents: 'box-none' },
  bar: { width: '100%', maxWidth: 700, minHeight: compact ? 70 : 76, flexDirection: 'row', alignItems: 'stretch', gap: compact ? 2 : 6, padding: 7, overflow: 'hidden', borderRadius: radiusXl, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.tabBarBackground, boxShadow: colors.shadowStrong },
  tab: { minWidth: 0, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: compact ? 2 : 6, paddingVertical: 7, borderRadius: radiusPill },
  tabActive: { backgroundColor: colors.accentMuted },
  tabHovered: { backgroundColor: colors.surfaceMuted },
  tabPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  label: { maxWidth: '100%', color: colors.tabBarInactive, fontFamily: brandFonts.bodyEmphasis, fontSize: compact ? 9 : 11, textAlign: 'center' },
  labelActive: { color: colors.tabBarActive },
});
