import { useMemo, useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { brandFonts, palette } from '../../theme';
import type { MediaPoint, MediaPointsDashboard, OrganizationMediaSection } from './model';

interface ScreenGalleryProps extends MediaPointsDashboard {
  onAddScreen: (organization: OrganizationMediaSection) => void;
  onEditScreen: (screenId: number) => void;
  onDeleteScreen: (screenId: number) => Promise<void>;
  isDeleting?: boolean;
}

export function ScreenGallery({
  unassignedScreens,
  organizations,
  onAddScreen,
  onEditScreen,
  onDeleteScreen,
  isDeleting = false,
}: ScreenGalleryProps) {
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [screenToDelete, setScreenToDelete] = useState<MediaPoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!screenToDelete) return;
    setDeleteError(null);
    try {
      await onDeleteScreen(screenToDelete.id);
      setSelectedScreenId(null);
      setScreenToDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Не удалось удалить экран');
    }
  };

  return (
    <>
      {unassignedScreens.length ? (
        <MediaSection
          screens={unassignedScreens}
          selectedScreenId={selectedScreenId}
          onSelect={setSelectedScreenId}
          onRequestDelete={setScreenToDelete}
          onEditScreen={onEditScreen}
        />
      ) : null}

      {organizations.map((organization) => (
        <MediaSection
          key={organization.id}
          title={organization.name}
          screens={organization.screens}
          selectedScreenId={selectedScreenId}
          onSelect={setSelectedScreenId}
          onRequestDelete={setScreenToDelete}
          onEditScreen={onEditScreen}
          onAddScreen={() => onAddScreen(organization)}
        />
      ))}

      {!organizations.length && !unassignedScreens.length ? (
        <View style={styles.emptyDashboard}>
          <MaterialCommunityIcons name="monitor-off" color={palette.muted} size={34} />
          <Text style={styles.emptyTitle}>Медиа-точек пока нет</Text>
          <Text style={styles.emptyText}>Добавьте организацию, затем привяжите к ней первый экран.</Text>
        </View>
      ) : null}

      <Modal
        visible={Boolean(screenToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setScreenToDelete(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setScreenToDelete(null)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogIcon}>
              <MaterialCommunityIcons name="trash-can-outline" color={palette.danger} size={25} />
            </View>
            <Text style={styles.dialogTitle}>Удалить экран?</Text>
            <Text style={styles.dialogText}>{screenToDelete?.name}</Text>
            {deleteError ? <Text style={styles.dialogError}>{deleteError}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={() => setScreenToDelete(null)}
                style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={isDeleting}
                onPress={confirmDelete}
                style={({ pressed }) => [styles.dialogButton, styles.deleteButton, pressed && styles.pressed]}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteText}>Удалить</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MediaSection({
  title,
  screens,
  selectedScreenId,
  onSelect,
  onRequestDelete,
  onEditScreen,
  onAddScreen,
}: {
  title?: string;
  screens: MediaPoint[];
  selectedScreenId: number | null;
  onSelect: (screenId: number | null) => void;
  onRequestDelete: (screen: MediaPoint) => void;
  onEditScreen: (screenId: number) => void;
  onAddScreen?: () => void;
}) {
  const [sectionWidth, setSectionWidth] = useState(0);
  const columns = useMemo(() => {
    if (sectionWidth >= 1080) return 3;
    if (sectionWidth >= 650) return 3;
    if (sectionWidth >= 430) return 2;
    return 1;
  }, [sectionWidth]);
  const cardWidth = sectionWidth > 0
    ? Math.max(0, (sectionWidth - (columns - 1) * 14) / columns)
    : 280;

  const handleLayout = (event: LayoutChangeEvent) => setSectionWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.section} onLayout={handleLayout}>
      {title ? (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {onAddScreen ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Добавить экран в ${title}`}
              onPress={onAddScreen}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="plus" color={palette.cream} size={17} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {screens.length ? (
        <View style={styles.cards}>
          {screens.map((screen) => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              width={cardWidth}
              selected={selectedScreenId === screen.id}
              onSelect={() => onSelect(selectedScreenId === screen.id ? null : screen.id)}
              onEdit={(event) => {
                event.stopPropagation();
                onEditScreen(screen.id);
              }}
              onRequestDelete={(event) => {
                event.stopPropagation();
                onRequestDelete(screen);
              }}
            />
          ))}
        </View>
      ) : title ? (
        <Text style={styles.noScreens}>Подключённых экранов пока нет.</Text>
      ) : null}
    </View>
  );
}

function ScreenCard({
  screen,
  width,
  selected,
  onSelect,
  onEdit,
  onRequestDelete,
}: {
  screen: MediaPoint;
  width: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: (event: GestureResponderEvent) => void;
  onRequestDelete: (event: GestureResponderEvent) => void;
}) {
  return (
    <View style={[styles.card, { width }, selected && styles.cardSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${screen.name}, ${screen.isLive ? 'трансляция активна' : 'трансляция неактивна'}`}
        accessibilityState={{ selected }}
        focusable
        onPress={onSelect}
        style={({ pressed }) => [styles.cardSurface, pressed && styles.cardPressed]}
      >
        {screen.previewUrl ? (
          <Image source={{ uri: screen.previewUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.previewFallback}>
            <View style={styles.fallbackGlow} />
            <MaterialCommunityIcons name="monitor-dashboard" color={palette.gold} size={38} />
            <Text style={styles.fallbackName} numberOfLines={2}>{screen.name}</Text>
          </View>
        )}

        <View style={styles.previewShade} pointerEvents="none" />
        <Text style={styles.screenName} numberOfLines={1}>{screen.name}</Text>
        <View style={[styles.livePill, screen.isLive ? styles.livePillActive : styles.livePillInactive]}>
          <View style={[styles.liveDot, { backgroundColor: screen.isLive ? palette.success : palette.danger }]} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Редактировать плейлист ${screen.name}`}
        onPress={onEdit}
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="pencil-outline" color={palette.cream} size={19} />
      </Pressable>

      {selected ? (
        <Pressable
          accessible={false}
          focusable={false}
          onPress={onSelect}
          style={styles.selectedOverlay}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Удалить ${screen.name}`}
            onPress={onRequestDelete}
            style={({ pressed }) => [styles.trashButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="trash-can-outline" color="#FFFFFF" size={24} />
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  sectionHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  sectionTitle: {
    minWidth: 0,
    flex: 1,
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.goldDeep,
    backgroundColor: '#17191E',
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    maxWidth: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#353840',
    backgroundColor: palette.panel,
    boxShadow: '0 10px 26px rgba(0, 0, 0, 0.26)',
  },
  cardSurface: {
    flex: 1,
  },
  cardSelected: {
    borderColor: palette.gold,
    borderWidth: 2,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  previewFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: '#17191D',
  },
  fallbackGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(242, 160, 24, 0.09)',
  },
  fallbackName: {
    maxWidth: '78%',
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 16,
    textAlign: 'center',
  },
  previewShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  screenName: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    maxWidth: '58%',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
    color: '#FFFFFF',
    backgroundColor: 'rgba(7, 8, 10, 0.72)',
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 12,
  },
  livePill: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: 'rgba(7, 8, 10, 0.82)',
  },
  livePillActive: {
    borderColor: 'rgba(105, 227, 69, 0.62)',
  },
  livePillInactive: {
    borderColor: 'rgba(255, 56, 71, 0.62)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 11,
  },
  editButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 242, 232, 0.34)',
    backgroundColor: 'rgba(11, 11, 13, 0.8)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.32)',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4, 5, 7, 0.52)',
  },
  trashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.danger,
    boxShadow: '0 8px 22px rgba(255, 56, 71, 0.34)',
  },
  noScreens: {
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    paddingVertical: 10,
  },
  emptyDashboard: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2D34',
    backgroundColor: palette.panel,
  },
  emptyTitle: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 18,
  },
  emptyText: {
    maxWidth: 380,
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  dialog: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#30333B',
    backgroundColor: palette.panelRaised,
    boxShadow: '0 24px 54px rgba(0, 0, 0, 0.5)',
  },
  dialogIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 56, 71, 0.14)',
  },
  dialogTitle: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 19,
  },
  dialogText: {
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
  },
  dialogError: {
    color: palette.danger,
    fontFamily: brandFonts.body,
    fontSize: 12,
    textAlign: 'center',
  },
  dialogActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  dialogButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#30333B',
  },
  deleteButton: {
    backgroundColor: palette.danger,
  },
  cancelText: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 13,
  },
  deleteText: {
    color: '#FFFFFF',
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});
