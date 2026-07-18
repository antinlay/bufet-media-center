import { useMemo, useState } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/providers/AppThemeProvider';
import { useI18n } from '@/providers/I18nProvider';
import { brandFonts, type AppColors } from '@/theme';
import type { MediaPoint, MediaPointsDashboard, OrganizationMediaSection } from './model';

interface ScreenGalleryProps extends MediaPointsDashboard {
  onAddScreen: (organization: OrganizationMediaSection) => void;
  onEditScreen: (screenId: number) => void;
  onDeleteScreen: (screenId: number) => Promise<void>;
  isDeleting?: boolean;
}

export function ScreenGallery({ unassignedScreens, organizations, onAddScreen, onEditScreen, onDeleteScreen, isDeleting = false }: ScreenGalleryProps) {
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [screenToDelete, setScreenToDelete] = useState<MediaPoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.xl);

  const confirmDelete = async () => {
    if (!screenToDelete) return;
    setDeleteError(null);
    try {
      await onDeleteScreen(screenToDelete.id);
      setSelectedScreenId(null);
      setScreenToDelete(null);
    } catch {
      setDeleteError(t('dashboard.deleteScreen.error'));
    }
  };

  return (
    <>
      {unassignedScreens.length ? <MediaSection screens={unassignedScreens} selectedScreenId={selectedScreenId} onSelect={setSelectedScreenId} onRequestDelete={setScreenToDelete} onEditScreen={onEditScreen} /> : null}
      {organizations.map((organization) => <MediaSection key={organization.id} title={organization.name} screens={organization.screens} selectedScreenId={selectedScreenId} onSelect={setSelectedScreenId} onRequestDelete={setScreenToDelete} onEditScreen={onEditScreen} onAddScreen={() => onAddScreen(organization)} />)}
      {!organizations.length && !unassignedScreens.length ? (
        <View style={styles.emptyDashboard}>
          <MaterialCommunityIcons name="monitor-off" color={colors.textMuted} size={34} />
          <Text style={styles.emptyTitle}>{t('dashboard.noScreens')}</Text>
          <Text style={styles.emptyText}>{t('dashboard.noScreensSubtitle')}</Text>
        </View>
      ) : null}
      <Modal visible={Boolean(screenToDelete)} transparent animationType="fade" onRequestClose={() => setScreenToDelete(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setScreenToDelete(null)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogIcon}><MaterialCommunityIcons name="trash-can-outline" color={colors.danger} size={25} /></View>
            <Text style={styles.dialogTitle}>{t('dashboard.deleteScreen.title')}</Text>
            <Text style={styles.dialogText}>{screenToDelete ? t('dashboard.deleteScreen.message', { name: screenToDelete.name }) : ''}</Text>
            {deleteError ? <Text accessibilityRole="alert" selectable style={styles.dialogError}>{deleteError}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" disabled={isDeleting} onPress={() => setScreenToDelete(null)} style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]}><Text style={styles.cancelText}>{t('common.cancel')}</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={isDeleting} onPress={confirmDelete} style={({ pressed }) => [styles.dialogButton, styles.deleteButton, pressed && styles.pressed]}>{isDeleting ? <ActivityIndicator color={colors.onImage} size="small" /> : <Text style={styles.deleteText}>{t('common.delete')}</Text>}</Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MediaSection({ title, screens, selectedScreenId, onSelect, onRequestDelete, onEditScreen, onAddScreen }: { title?: string; screens: MediaPoint[]; selectedScreenId: number | null; onSelect: (screenId: number | null) => void; onRequestDelete: (screen: MediaPoint) => void; onEditScreen: (screenId: number) => void; onAddScreen?: () => void }) {
  const [sectionWidth, setSectionWidth] = useState(0);
  const [addHovered, setAddHovered] = useState(false);
  const [addFocused, setAddFocused] = useState(false);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.xl);
  const columns = useMemo(() => sectionWidth >= 650 ? 3 : sectionWidth >= 430 ? 2 : 1, [sectionWidth]);
  const cardWidth = sectionWidth > 0 ? Math.max(0, (sectionWidth - (columns - 1) * 14) / columns) : 280;
  const handleLayout = (event: LayoutChangeEvent) => setSectionWidth(event.nativeEvent.layout.width);
  return (
    <View style={styles.section} onLayout={handleLayout}>
      {title ? <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{onAddScreen ? <Pressable accessibilityRole="button" accessibilityLabel={t('dashboard.addScreenTo', { name: title })} onBlur={() => setAddFocused(false)} onFocus={() => setAddFocused(true)} onHoverIn={() => setAddHovered(true)} onHoverOut={() => setAddHovered(false)} onPress={onAddScreen} style={({ pressed }) => [styles.addButton, addHovered && styles.addButtonHovered, addFocused && styles.addButtonFocused, pressed && styles.pressed]}><MaterialCommunityIcons name="plus" color={colors.textPrimary} size={17} /></Pressable> : null}</View> : null}
      {screens.length ? <View style={styles.cards}>{screens.map((screen) => <ScreenCard key={screen.id} screen={screen} width={cardWidth} selected={selectedScreenId === screen.id} onSelect={() => onSelect(selectedScreenId === screen.id ? null : screen.id)} onEdit={(event) => { event.stopPropagation(); onEditScreen(screen.id); }} onRequestDelete={(event) => { event.stopPropagation(); onRequestDelete(screen); }} />)}</View> : title ? <Text style={styles.noScreens}>{t('dashboard.noConnectedScreens')}</Text> : null}
    </View>
  );
}

function ScreenCard({ screen, width, selected, onSelect, onEdit, onRequestDelete }: { screen: MediaPoint; width: number; selected: boolean; onSelect: () => void; onEdit: (event: GestureResponderEvent) => void; onRequestDelete: (event: GestureResponderEvent) => void }) {
  const [cardHovered, setCardHovered] = useState(false);
  const [cardFocused, setCardFocused] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<'edit' | 'delete' | null>(null);
  const [focusedAction, setFocusedAction] = useState<'edit' | 'delete' | null>(null);
  const { colors, radius } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(colors, radius.lg, radius.xl);
  const displayName = getDisplayScreenName(screen.name);
  return (
    <View style={[styles.card, { width }, cardHovered && styles.cardHovered, cardFocused && styles.cardFocused, selected && styles.cardSelected]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t(screen.isLive ? 'dashboard.screenLiveA11y' : 'dashboard.screenOfflineA11y', { name: screen.name })} accessibilityState={{ selected }} focusable onBlur={() => setCardFocused(false)} onFocus={() => setCardFocused(true)} onHoverIn={() => setCardHovered(true)} onHoverOut={() => setCardHovered(false)} onPress={onSelect} style={({ pressed }) => [styles.cardSurface, pressed && styles.cardPressed]}>
        {screen.previewUrl ? <Image source={{ uri: screen.previewUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} /> : <View style={styles.previewFallback}><View style={styles.fallbackGlow} /><MaterialCommunityIcons name="monitor-dashboard" color={colors.accent} size={38} /><Text style={styles.fallbackName} numberOfLines={2}>{displayName}</Text></View>}
        {screen.previewUrl ? <View style={styles.previewShade} pointerEvents="none" /> : null}<Text style={styles.screenName} numberOfLines={1}>{displayName}</Text>
        <View style={[styles.livePill, screen.isLive ? styles.livePillActive : styles.livePillInactive]}><View style={[styles.liveDot, { backgroundColor: screen.isLive ? colors.success : colors.danger }]} /><Text style={styles.liveText}>{screen.isLive ? t('dashboard.live') : t('dashboard.offline')}</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('dashboard.editPlaylistA11y', { name: screen.name })} onBlur={() => setFocusedAction(null)} onFocus={() => setFocusedAction('edit')} onHoverIn={() => setHoveredAction('edit')} onHoverOut={() => setHoveredAction(null)} onPress={onEdit} style={({ pressed }) => [styles.editButton, hoveredAction === 'edit' && styles.editButtonHovered, focusedAction === 'edit' && styles.editButtonFocused, pressed && styles.pressed]}><MaterialCommunityIcons name="pencil-outline" color={colors.onImage} size={19} /></Pressable>
      {selected ? <Pressable accessible={false} focusable={false} onPress={onSelect} style={styles.selectedOverlay}><Pressable accessibilityRole="button" accessibilityLabel={t('dashboard.deleteScreenA11y', { name: screen.name })} onBlur={() => setFocusedAction(null)} onFocus={() => setFocusedAction('delete')} onHoverIn={() => setHoveredAction('delete')} onHoverOut={() => setHoveredAction(null)} onPress={onRequestDelete} style={({ pressed }) => [styles.trashButton, hoveredAction === 'delete' && styles.trashButtonHovered, focusedAction === 'delete' && styles.trashButtonFocused, pressed && styles.pressed]}><MaterialCommunityIcons name="trash-can-outline" color={colors.onImage} size={24} /></Pressable></Pressable> : null}
    </View>
  );
}

function getDisplayScreenName(name: string) {
  const displayName = name.replace(/^(?:экран|screen)(?:\s+|$)/i, '').trim();
  return displayName || name;
}

const createStyles = (colors: AppColors, radiusLg: number, radiusXl: number) => StyleSheet.create({
  section: { gap: 14 }, sectionHeader: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }, sectionTitle: { minWidth: 0, flex: 1, color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 20 }, addButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.accentPressed, backgroundColor: colors.surfaceElevated }, addButtonHovered: { borderColor: colors.accent, backgroundColor: colors.surfaceMuted }, addButtonFocused: { borderColor: colors.accent, boxShadow: colors.focusRing }, cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { maxWidth: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, boxShadow: colors.shadowSoft }, cardHovered: { borderColor: colors.borderStrong }, cardFocused: { borderColor: colors.accent, boxShadow: colors.focusRing }, cardSurface: { flex: 1 }, cardSelected: { borderColor: colors.accent, borderWidth: 2 }, cardPressed: { opacity: 0.88, transform: [{ scale: 0.995 }] }, previewFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: colors.surfaceElevated }, fallbackGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: colors.accentMuted }, fallbackName: { maxWidth: '78%', color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 16, textAlign: 'center' }, previewShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay },
  screenName: { position: 'absolute', left: 12, bottom: 12, maxWidth: '58%', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, overflow: 'hidden', color: colors.onImage, backgroundColor: colors.imageOverlay, fontFamily: brandFonts.bodyEmphasis, fontSize: 12 }, livePill: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 13, borderWidth: 1, backgroundColor: colors.imageOverlay }, livePillActive: { borderColor: colors.success }, livePillInactive: { borderColor: colors.danger }, liveDot: { width: 7, height: 7, borderRadius: 4 }, liveText: { color: colors.onImage, fontFamily: brandFonts.bodyEmphasis, fontSize: 11 },
  editButton: { position: 'absolute', top: 10, right: 10, zIndex: 3, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.overlayStrong, boxShadow: colors.shadowSoft }, editButtonHovered: { borderColor: colors.accent }, editButtonFocused: { borderColor: colors.accent, boxShadow: colors.focusRing }, selectedOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlay }, trashButton: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger }, trashButtonHovered: { transform: [{ scale: 1.04 }] }, trashButtonFocused: { boxShadow: colors.focusRing }, noScreens: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13, paddingVertical: 10 },
  emptyDashboard: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radiusLg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, emptyTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 18 }, emptyText: { maxWidth: 380, color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13, textAlign: 'center' }, modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.overlayStrong }, dialog: { width: '100%', maxWidth: 390, alignItems: 'center', gap: 10, padding: 24, borderRadius: radiusXl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, boxShadow: colors.shadowStrong }, dialogIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerMuted }, dialogTitle: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 19 }, dialogText: { color: colors.textMuted, fontFamily: brandFonts.body, fontSize: 13, textAlign: 'center' }, dialogError: { color: colors.danger, fontFamily: brandFonts.body, fontSize: 12, textAlign: 'center' }, dialogActions: { width: '100%', flexDirection: 'row', gap: 12, marginTop: 10 }, dialogButton: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.surfaceMuted }, deleteButton: { backgroundColor: colors.danger }, cancelText: { color: colors.textPrimary, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 }, deleteText: { color: colors.onImage, fontFamily: brandFonts.bodyEmphasis, fontSize: 13 }, pressed: { opacity: 0.72 },
});
