export interface User {
    id: string;
    email: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Device {
    id: string;
    deviceId: string;
    name?: string;
    userId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Pairing {
    id: string;
    code: string;
    deviceId: string;
    status: 'PENDING' | 'PAIRED';
    expiresAt: Date;
    createdAt: Date;
}
export interface Playlist {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PlaylistItem {
    id: string;
    playlistId: string;
    type: 'IMAGE' | 'VIDEO';
    url: string;
    durationSeconds?: number | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface DeviceConfig {
    id: string;
    deviceId: string;
    playlistId: string;
    updatedAt: Date;
}
