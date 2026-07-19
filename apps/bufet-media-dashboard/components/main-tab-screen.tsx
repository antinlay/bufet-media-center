import type { ComponentProps } from 'react';

import { GalleryShell } from '../features/media-points/GalleryShell';
import { MainTabBar } from './main-tab-bar';

type MainTabScreenProps = Omit<ComponentProps<typeof GalleryShell>, 'bottomNavigation' | 'showBack'>;

export function MainTabScreen(props: MainTabScreenProps) {
  return <GalleryShell {...props} bottomNavigation={<MainTabBar />} />;
}
