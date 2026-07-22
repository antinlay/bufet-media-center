import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { PlayerLocalizationProvider } from '@/localization/player-localization';

export default function RootLayout() {
  return (
    <PlayerLocalizationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          statusBarHidden: true,
          statusBarStyle: 'light',
          statusBarAnimation: 'fade',
        }}
      />
    </PlayerLocalizationProvider>
  );
}
