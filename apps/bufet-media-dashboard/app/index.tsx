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
import { brandFonts, palette } from '../theme';

export default function DashboardHome() {
  useProtectedRoute();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
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
            label="Сканировать QR"
            onPress={() => router.push('/scan')}
          />
          <ToolbarButton
            icon="plus"
            label="Добавить организацию"
            prominent
            onPress={() => router.push('/groups')}
          />
        </>
      }
    >
      {authLoading || dashboardQuery.isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={palette.gold} size="large" />
          <Text style={styles.stateText}>Загружаем медиа-точки…</Text>
        </View>
      ) : dashboardQuery.isError ? (
        <View style={styles.stateCard}>
          <MaterialCommunityIcons name="wifi-alert" color={palette.danger} size={34} />
          <Text style={styles.stateTitle}>Не удалось загрузить экраны</Text>
          <Text style={styles.stateText}>
            {dashboardQuery.error instanceof Error ? dashboardQuery.error.message : 'Попробуйте ещё раз'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => dashboardQuery.refetch()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryText}>Повторить</Text>
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
      <MaterialCommunityIcons name={icon} color={prominent ? palette.ink : palette.cream} size={23} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B3E46',
    backgroundColor: palette.panel,
  },
  toolbarButtonProminent: {
    borderColor: palette.gold,
    backgroundColor: palette.gold,
  },
  toolbarButtonHovered: {
    borderColor: palette.goldDeep,
    backgroundColor: palette.panelRaised,
    transform: [{ scale: 1.04 }],
  },
  toolbarButtonProminentHovered: {
    backgroundColor: palette.goldDeep,
    transform: [{ scale: 1.04 }],
  },
  toolbarButtonFocused: {
    borderColor: palette.gold,
    boxShadow: '0 0 0 3px rgba(242, 160, 24, 0.24)',
  },
  stateCard: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2A2D34',
    backgroundColor: palette.panel,
  },
  stateTitle: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 18,
  },
  stateText: {
    maxWidth: 480,
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: palette.gold,
  },
  retryText: {
    color: palette.ink,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});
