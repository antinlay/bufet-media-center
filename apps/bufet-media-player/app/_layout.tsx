import { Stack } from 'expo-router';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          statusBarHidden: true,
          statusBarStyle: 'light',
          statusBarAnimation: 'fade',
        }}
      />
    </>
  );
}
