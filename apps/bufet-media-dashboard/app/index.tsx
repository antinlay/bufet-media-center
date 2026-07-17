import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';

import { GalleryShell } from '../features/media-points/GalleryShell';
import { ScreenGallery } from '../features/media-points/ScreenGallery';
import { useDeleteScreen, useMediaPointsDashboard } from '../features/media-points/hooks';
import type { OrganizationMediaSection } from '../features/media-points/model';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useAuth } from '../providers/AuthProvider';
import { useAppTheme } from '../providers/AppThemeProvider';
import { useI18n } from '../providers/I18nProvider';
import { brandFonts, type AppColors } from '../theme';

export default function DashboardHome() {
  useProtectedRoute();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.pill);
  const dashboardQuery = useMediaPointsDashboard(!authLoading && Boolean(token));
  const deleteMutation = useDeleteScreen();

  const openAddScreen = (organization: OrganizationMediaSection) => {
    router.push({
      pathname: '/pair',
      params: {
        organizationId: String(organization.id),
        organizationName: organization.name,
      },
    });
  };

  return (
    <GalleryShell
      showAccount
      toolbarActions={
        <>
          <ToolbarButton
            icon="qrcode-scan"
            label={t('dashboard.scanQr')}
            onPress={() => router.push('/scan')}
          />
          <ToolbarButton
            icon="plus"
            label={t('dashboard.addOrganization')}
            prominent
            onPress={() => router.push('/groups')}
          />
        </>
      }
    >
      {authLoading || dashboardQuery.isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.stateText}>{t('dashboard.loading')}</Text>
        </View>
      ) : dashboardQuery.isError ? (
        <View style={styles.stateCard}>
          <MaterialCommunityIcons name="wifi-alert" color={colors.danger} size={34} />
          <Text style={styles.stateTitle}>{t('dashboard.loadError')}</Text>
          <Text style={styles.stateText}>{t('dashboard.fallbackError')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => dashboardQuery.refetch()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : dashboardQuery.data ? (
        <ScreenGallery
          unassignedScreens={dashboardQuery.data.unassignedScreens}
          organizations={dashboardQuery.data.organizations}
          onAddScreen={openAddScreen}
          onEditScreen={(screenId) => router.push(`/screens/${screenId}`)}
          onDeleteScreen={(screenId) => deleteMutation.mutateAsync(screenId).then(() => undefined)}
          isDeleting={deleteMutation.isPending}
        />
      ) : null}
    </GalleryShell>
  );
}

function ToolbarButton({
  icon,
  label,
  prominent = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  prominent?: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { colors, radius } = useAppTheme();
  const styles = createStyles(colors, radius.lg, radius.pill);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolbarButton,
        prominent && styles.toolbarButtonProminent,
        hovered && (prominent ? styles.toolbarButtonProminentHovered : styles.toolbarButtonHovered),
        focused && styles.toolbarButtonFocused,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} color={prominent ? colors.onAccent : colors.textPrimary} size={23} />
    </Pressable>
  );
}

const createStyles = (colors: AppColors, radiusLg: number, radiusPill: number) => StyleSheet.create({
  toolbarButton: {
    width: 42,
    height: 42,
    borderRadius: radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toolbarButtonProminent: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  toolbarButtonHovered: {
    borderColor: colors.accentPressed,
    backgroundColor: colors.surfaceElevated,
    transform: [{ scale: 1.04 }],
  },
  toolbarButtonProminentHovered: {
    backgroundColor: colors.accentPressed,
    transform: [{ scale: 1.04 }],
  },
  toolbarButtonFocused: {
    borderColor: colors.accent,
    boxShadow: colors.focusRing,
  },
  stateCard: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    borderRadius: radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 18,
  },
  stateText: {
    maxWidth: 480,
    color: colors.textMuted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radiusPill,
    backgroundColor: colors.accent,
  },
  retryText: {
    color: colors.onAccent,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});
