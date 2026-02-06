import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => {
  const allowHttp = process.env.EXPO_PUBLIC_ALLOW_HTTP === '1';

  return {
    name: 'bufet-media-player',
    slug: 'bufet-media-player',
    version: '1.0.0',
    orientation: 'landscape',
    icon: './assets/images/icon.png',
    scheme: 'bufetmediaplayer',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: true,
      },
      bundleIdentifier: 'com.lyabowski.bufet-media-player',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.lyabowski.bufetmediaplayer',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-video',
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: allowHttp,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      // Used only as a fallback; the app ignores localhost defaults and can auto-discover.
      apiUrl: 'http://localhost:3000',
      eas: {
        projectId: 'adbe5572-c2fe-4836-a669-3f529b24c153',
      },
    },
    owner: 'lyabowski',
  };
};
