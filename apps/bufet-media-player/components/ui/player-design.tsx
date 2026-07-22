import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { TvButton, type TvButtonProps } from '@/components/ui/tv-button';

export const playerColors = {
  background: '#050607',
  orange: '#ff9700',
  orangeButton: '#e87500',
  orangeBorder: '#ff9d1a',
  primaryText: '#ffffff',
  secondaryText: '#a9aaad',
  panel: 'rgba(16, 17, 19, 0.86)',
  panelBorder: '#303134',
  divider: '#1d1e20',
};

type IconProps = {
  size?: number;
  color?: string;
};

export function HeartbeatIcon({ size = 50, color = playerColors.orange }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <Circle cx="25" cy="25" r="23" stroke={color} strokeWidth="2.5" />
      <Path d="M7 25h8l3-9 5 18 5-14 3 5h12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SetupIcon({ size = 36, color = playerColors.orange }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path
        d="m14.7 4.4.8 2.5a11.8 11.8 0 0 1 5 0l.8-2.5 3.3 1.4-.8 2.5a12 12 0 0 1 3.5 3.5l2.5-.8 1.4 3.3-2.5.8a11.8 11.8 0 0 1 0 5l2.5.8-1.4 3.3-2.5-.8a12 12 0 0 1-3.5 3.5l.8 2.5-3.3 1.4-.8-2.5a11.8 11.8 0 0 1-5 0l-.8 2.5-3.3-1.4.8-2.5a12 12 0 0 1-3.5-3.5l-2.5.8-1.4-3.3 2.5-.8a11.8 11.8 0 0 1 0-5l-2.5-.8 1.4-3.3 2.5.8a12 12 0 0 1 3.5-3.5l-.8-2.5 3.3-1.4Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Circle cx="18" cy="16.8" r="4.6" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function MonitorAlertIcon({ size = 180, color = playerColors.orange }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180" fill="none">
      <Rect x="28" y="22" width="124" height="91" rx="12" stroke={color} strokeWidth="8" />
      <Path d="M90 45v27M90 89v1" stroke={color} strokeWidth="9" strokeLinecap="round" />
      <Path d="M67 139h46M90 113v26" stroke={color} strokeWidth="8" strokeLinecap="round" />
    </Svg>
  );
}

export function LinkIcon({ size = 34, color = playerColors.orange }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <Path d="m13.4 20.6-1.7 1.7a5.2 5.2 0 0 1-7.4-7.4l4.2-4.2a5.2 5.2 0 0 1 7.4 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="m20.6 13.4 1.7-1.7a5.2 5.2 0 0 1 7.4 7.4l-4.2 4.2a5.2 5.2 0 0 1-7.4 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="m11.5 17 11-1" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function RefreshIcon({ size = 36, color = playerColors.primaryText }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path d="M29 14a11 11 0 0 0-19-4l-3 3M7 8v5h5M7 22a11 11 0 0 0 19 4l3-3M29 28v-5h-5" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrashIcon({ size = 34, color = playerColors.orange }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <Path d="M8 10h18M14 6h6M11 10l1.2 18h9.6L23 10M15 15v8M19 15v8" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlayerSurface({
  children,
  scroll = true,
  contentContainerStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const content = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  ) : children;

  return (
    <View style={styles.surface}>
      <View pointerEvents="none" style={styles.glow} />
      <View pointerEvents="none" style={styles.glowCore} />
      {content}
    </View>
  );
}

export function usePlayerLayout() {
  const { width } = useWindowDimensions();
  return {
    pagePadding: Math.max(24, Math.min(72, width * 0.043)),
    compactPadding: Math.max(24, Math.min(46, width * 0.03)),
    actionInset: Math.max(24, Math.min(100, width * 0.06)),
  };
}

export function PlayerBrandHeader({ title = 'БУФЕТ Player' }: { title?: string }) {
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandMark}>
        <SetupIcon size={38} />
      </View>
      <Text style={styles.brandTitle}>{title}</Text>
    </View>
  );
}

export function PlayerButton({
  variant = 'secondary',
  style,
  textStyle,
  ...props
}: TvButtonProps) {
  return (
    <TvButton
      {...props}
      variant={variant}
      style={[styles.button, variant === 'primary' ? styles.primaryButton : styles.secondaryButton, style]}
      textStyle={[styles.buttonText, textStyle]}
    />
  );
}

export function PlayerField({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.field}>
        <LinkIcon />
        <Text style={styles.fieldValue} selectable>{value ?? '(none)'}</Text>
      </View>
    </View>
  );
}

export function PlayerDivider() {
  return <View style={styles.divider} />;
}

export const playerDesignStyles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    flexGrow: 1,
    paddingTop: 54,
    paddingBottom: 42,
  },
  errorPage: {
    flexGrow: 1,
    paddingTop: 150,
    paddingBottom: 42,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: playerColors.primaryText,
    fontSize: 42,
    lineHeight: 52,
    fontWeight: '700',
    marginTop: 34,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: playerColors.secondaryText,
    fontSize: 28,
    lineHeight: 36,
    marginTop: 10,
    textAlign: 'center',
  },
  errorDetails: {
    alignItems: 'center',
    paddingTop: 34,
  },
  errorTitle: {
    color: playerColors.primaryText,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorHint: {
    color: playerColors.secondaryText,
    fontSize: 21,
    lineHeight: 28,
    marginTop: 8,
    textAlign: 'center',
  },
  errorActions: {
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },
  compactButton: {
    minHeight: 70,
    minWidth: 355,
  },
  retryButton: {
    minHeight: 66,
    minWidth: 282,
  },
  setupActions: {
    flexDirection: 'row',
    gap: 36,
    marginTop: 46,
  },
  setupButton: {
    flex: 1,
    minHeight: 100,
  },
  setupPrimaryButton: {
    width: '50%',
    minHeight: 80,
    marginTop: 48,
  },
  message: {
    color: playerColors.secondaryText,
    fontSize: 18,
    lineHeight: 25,
    marginTop: 16,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 22,
  },
});

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    backgroundColor: playerColors.background,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
  },
  glow: {
    position: 'absolute',
    width: 470,
    height: 290,
    top: -160,
    right: -120,
    borderRadius: 240,
    backgroundColor: 'rgba(124, 55, 0, 0.35)',
    boxShadow: '0 0 130px 70px rgba(124, 55, 0, 0.28)',
  },
  glowCore: {
    position: 'absolute',
    width: 250,
    height: 160,
    top: -90,
    right: -35,
    borderRadius: 140,
    backgroundColor: 'rgba(226, 103, 0, 0.18)',
    boxShadow: '0 0 80px 45px rgba(226, 103, 0, 0.22)',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandMark: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#a85e00',
    borderRadius: 29,
    backgroundColor: 'rgba(12, 11, 9, 0.7)',
    boxShadow: '0 0 12px 1px rgba(255, 151, 0, 0.28)',
  },
  brandTitle: {
    color: playerColors.primaryText,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  button: {
    minHeight: 78,
    borderRadius: 14,
    paddingHorizontal: 30,
  },
  primaryButton: {
    backgroundColor: playerColors.orangeButton,
    borderColor: playerColors.orangeBorder,
    boxShadow: '0 0 18px 2px rgba(247, 126, 0, 0.45)',
  },
  secondaryButton: {
    backgroundColor: playerColors.panel,
    borderColor: playerColors.panelBorder,
  },
  buttonText: {
    color: playerColors.primaryText,
    fontSize: 28,
    lineHeight: 34,
  },
  fieldGroup: {
    marginBottom: 34,
  },
  fieldLabel: {
    color: playerColors.secondaryText,
    fontSize: 24,
    lineHeight: 31,
    marginBottom: 12,
  },
  field: {
    width: '100%',
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#292b2e',
    borderRadius: 16,
    backgroundColor: 'rgba(15, 16, 18, 0.72)',
  },
  fieldValue: {
    flex: 1,
    color: playerColors.primaryText,
    fontSize: 25,
    lineHeight: 32,
  },
  divider: {
    height: 1,
    backgroundColor: playerColors.divider,
    width: '100%',
  },
});
