import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '../../providers/AuthProvider';
import { brandFonts, palette } from '../../theme';

interface GalleryShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  toolbarActions?: ReactNode;
  showBack?: boolean;
  showAccount?: boolean;
  scrollable?: boolean;
  onBackPress?: () => void;
}

export function GalleryShell({
  children,
  title,
  subtitle,
  toolbarActions,
  showBack = false,
  showAccount = false,
  scrollable = true,
  onBackPress,
}: GalleryShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const goBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.page}>
        <View style={styles.toolbarFrame}>
          <View style={styles.toolbar}>
            <View style={styles.toolbarIdentity}>
              {showBack ? (
                <IconButton
                  icon="chevron-left"
                  iconColor={palette.cream}
                  size={28}
                  onPress={goBack}
                  accessibilityLabel="Назад"
                />
              ) : (
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>Б</Text>
                </View>
              )}
              <View style={styles.brandCopy}>
                <Text style={styles.brandTitle}>{title ?? 'Буфет'}</Text>
                {title ? null : <Text style={styles.brandSubtitle}>В ОБЕД</Text>}
              </View>
            </View>
            {toolbarActions ? <View style={styles.toolbarActions}>{toolbarActions}</View> : null}
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {scrollable ? (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.content}>{children}</View>

            {showAccount ? (
              <View style={styles.account}>
                <Text style={styles.accountName}>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Пользователь'}
                </Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={logout}
                  style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.logoutText}>Выйти</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        ) : (
          <View style={styles.fixedContent}>{children}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  page: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  toolbarFrame: {
    width: '100%',
    maxWidth: 1480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2D34',
  },
  toolbar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toolbarIdentity: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.panelRaised,
    borderWidth: 1,
    borderColor: '#2F323A',
  },
  brandMarkText: {
    color: palette.gold,
    fontFamily: brandFonts.heading,
    fontSize: 20,
  },
  brandCopy: {
    minWidth: 0,
    gap: 1,
  },
  brandTitle: {
    color: palette.cream,
    fontFamily: brandFonts.heading,
    fontSize: 22,
  },
  brandSubtitle: {
    color: palette.gold,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 9,
    letterSpacing: 2.2,
  },
  subtitle: {
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 13,
    marginLeft: 58,
    marginTop: -4,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 1480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  content: {
    gap: 28,
  },
  fixedContent: {
    width: '100%',
    maxWidth: 1480,
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  account: {
    marginTop: 42,
    paddingTop: 24,
    paddingBottom: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2A2D34',
    alignItems: 'flex-start',
    gap: 5,
  },
  accountName: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 14,
  },
  accountEmail: {
    color: palette.muted,
    fontFamily: brandFonts.body,
    fontSize: 12,
  },
  logoutButton: {
    minWidth: 120,
    marginTop: 9,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.gold,
    alignItems: 'center',
  },
  logoutText: {
    color: palette.gold,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
