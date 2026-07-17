declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_OS?: 'android' | 'ios' | 'web';
    readonly EXPO_PUBLIC_ALLOW_HTTP?: '0' | '1';
    readonly EXPO_PUBLIC_API_URL?: string;
    readonly EXPO_PUBLIC_DISCOVERY_PORTS?: string;
  }
}

export {};
