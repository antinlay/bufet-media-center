import { ReactNode, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, TouchableRipple, IconButton } from 'react-native-paper';
import { usePathname, useRouter } from 'expo-router';
import { palette, brandFonts } from '../theme';
import { useAuth } from '../providers/AuthProvider';

function useIsMobile() {
  const { width } = useWindowDimensions();
  const [isMobile, setIsMobile] = useState(width < 600);

  useEffect(() => {
    setIsMobile(width < 600);
  }, [width]);

  return isMobile;
}

const navItems = [
  { label: 'Обзор', href: '/' },
  { label: 'Экраны', href: '/screens' },
  { label: 'Материалы', href: '/contents' },
  { label: 'Организации', href: '/groups' },
  { label: 'Пользователи', href: '/users' },
  { label: 'Привязка', href: '/pair' },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const headerStyle = isMobile
    ? styles.headerMobile
    : styles.headerDesktop;

  const headerActionsStyle = isMobile
    ? styles.headerActionsMobile
    : styles.headerActionsDesktop;

  return (
    <View style={styles.container}>
      {isWide ? (
        <View style={styles.sidebar}>
          <View style={styles.brand}>
            <Text style={styles.brandTitle}>Буфет</Text>
            <Text style={styles.brandSubtitle}>В ОБЕД</Text>
          </View>
          <View style={styles.navList}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <TouchableRipple
                  key={item.href}
                  onPress={() => router.push(item.href)}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                </TouchableRipple>
              );
            })}
          </View>
          <View style={styles.userCard}>
            <Text style={styles.userName}>{user?.firstName ?? 'Пользователь'} {user?.lastName ?? ''}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <TouchableRipple onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Выйти</Text>
            </TouchableRipple>
          </View>
        </View>
      ) : null}

      <View style={styles.main}>
        {!isWide ? (
          <View style={styles.topNav}>
            <View style={styles.topNavHeader}>
              <Text style={styles.brandTitle}>Буфет</Text>
              <IconButton icon="logout" onPress={logout} iconColor={palette.cream} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topNavList}>
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <TouchableRipple
                    key={item.href}
                    onPress={() => router.push(item.href)}
                    style={[styles.topNavItem, active && styles.topNavItemActive]}
                  >
                    <Text style={[styles.topNavText, active && styles.topNavTextActive]}>{item.label}</Text>
                  </TouchableRipple>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={headerStyle}>
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {actions ? <View style={headerActionsStyle}>{actions}</View> : null}
        </View>

        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: palette.cream,
  },
  sidebar: {
    width: 240,
    backgroundColor: palette.ink,
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brand: {
    gap: 6,
  },
  brandTitle: {
    color: palette.cream,
    fontSize: 28,
    fontFamily: brandFonts.heading,
    letterSpacing: 0.6,
  },
  brandSubtitle: {
    color: palette.gold,
    fontSize: 12,
    letterSpacing: 3,
    fontFamily: brandFonts.bodyEmphasis,
  },
  navList: {
    gap: 6,
  },
  navItem: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navItemActive: {
    backgroundColor: '#2A221E',
  },
  navText: {
    color: palette.fog,
    fontFamily: brandFonts.bodyEmphasis,
    fontSize: 14,
  },
  navTextActive: {
    color: palette.gold,
  },
  userCard: {
    borderTopWidth: 1,
    borderTopColor: '#2B231E',
    paddingTop: 16,
    gap: 6,
  },
  userName: {
    color: palette.cream,
    fontFamily: brandFonts.bodyEmphasis,
  },
  userEmail: {
    color: palette.fog,
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.gold,
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: palette.gold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: brandFonts.bodyEmphasis,
  },
  main: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topNav: {
    marginBottom: 12,
    backgroundColor: palette.ink,
    borderRadius: 18,
    padding: 12,
  },
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topNavList: {
    gap: 8,
  },
  topNavItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#1B1714',
  },
  topNavItemActive: {
    backgroundColor: palette.gold,
  },
  topNavText: {
    color: palette.fog,
    fontSize: 12,
    fontFamily: brandFonts.bodyEmphasis,
  },
  topNavTextActive: {
    color: palette.ink,
  },
  headerDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  headerActionsDesktop: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerActionsMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontFamily: brandFonts.heading,
    fontSize: 32,
    color: palette.charcoal,
  },
  subtitle: {
    color: palette.slate,
    marginTop: 4,
    fontFamily: brandFonts.body,
  },
  content: {
    paddingBottom: 80,
    gap: 16,
  },
});
