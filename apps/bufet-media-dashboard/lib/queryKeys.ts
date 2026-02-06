export const queryKeys = {
  devices: ['devices'] as const,
  playlists: ['playlists'] as const,
  playlistItems: (playlistId: string) => ['playlist', playlistId, 'items'] as const,
  deviceConfig: (deviceId: string) => ['device-config', deviceId] as const,
};
