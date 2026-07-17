import type { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => {
  const allowHttp = process.env.EXPO_PUBLIC_ALLOW_HTTP === '1';
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  const isCompactApkProfile = buildProfile === 'apk' || buildProfile === 'preview';
  const isReleaseProfile = isCompactApkProfile || buildProfile === 'production';

  const androidBuildProperties = {
    usesCleartextTraffic: allowHttp,
    ...(isReleaseProfile
      ? {
          enableBundleCompression: true,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        }
      : {}),
    ...(isCompactApkProfile
      ? {
          buildArchs: ['arm64-v8a'],
          useLegacyPackaging: true,
        }
      : {}),
  };

  return {
    name: 'bufet-media-player',
    slug: 'bufet-media-player',
    version: '1.0.0',
    orientation: 'landscape',
    icon: './assets/images/icon.png',
    scheme: 'bufetmediaplayer',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      infoPlist: {
        UIViewControllerBasedStatusBarAppearance: true,
      },
      bundleIdentifier: 'com.lyabowski.bufet-media-player',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#0B0807',
        foregroundImage: './assets/images/icon.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.lyabowski.bufetmediaplayer',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-image',
      'expo-secure-store',
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
          android: androidBuildProperties,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'adbe5572-c2fe-4836-a669-3f529b24c153',
      },
    },
    owner: 'lyabowski',
  };
};
