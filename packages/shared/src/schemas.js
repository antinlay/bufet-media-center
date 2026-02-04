"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceConfigResponseSchema = exports.PairingStatusResponseSchema = exports.PairingResponseSchema = exports.BootstrapResponseSchema = exports.RenameDeviceDtoSchema = exports.UpdateDeviceConfigDtoSchema = exports.CreatePlaylistItemDtoSchema = exports.CreatePlaylistDtoSchema = exports.PairDeviceDtoSchema = exports.CreateDevicePairingDtoSchema = exports.RegisterDtoSchema = exports.LoginDtoSchema = exports.DeviceConfigSchema = exports.PlaylistItemSchema = exports.PlaylistSchema = exports.PairingSchema = exports.DeviceSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.DeviceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    deviceId: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    userId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.PairingSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    code: zod_1.z.string(),
    deviceId: zod_1.z.string(),
    status: zod_1.z.enum(['PENDING', 'PAIRED']),
    expiresAt: zod_1.z.date(),
    createdAt: zod_1.z.date(),
});
exports.PlaylistSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.PlaylistItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    playlistId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['IMAGE', 'VIDEO']),
    url: zod_1.z.string().url(),
    durationSeconds: zod_1.z.number().positive().optional().nullable(),
    order: zod_1.z.number().min(0),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.DeviceConfigSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    deviceId: zod_1.z.string(),
    playlistId: zod_1.z.string().uuid(),
    updatedAt: zod_1.z.date(),
});
exports.LoginDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.RegisterDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().optional(),
});
exports.CreateDevicePairingDtoSchema = zod_1.z.object({
    deviceId: zod_1.z.string(),
});
exports.PairDeviceDtoSchema = zod_1.z.object({
    code: zod_1.z.string(),
});
exports.CreatePlaylistDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
});
exports.CreatePlaylistItemDtoSchema = zod_1.z.object({
    playlistId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['IMAGE', 'VIDEO']),
    url: zod_1.z.string().url(),
    durationSeconds: zod_1.z.number().positive().optional(),
    order: zod_1.z.number().min(0),
});
exports.UpdateDeviceConfigDtoSchema = zod_1.z.object({
    playlistId: zod_1.z.string().uuid(),
});
exports.RenameDeviceDtoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
});
exports.BootstrapResponseSchema = zod_1.z.union([
    zod_1.z.object({
        status: zod_1.z.literal('UNPAIRED'),
    }),
    zod_1.z.object({
        status: zod_1.z.literal('PAIRED'),
        config: zod_1.z.object({
            playlist: zod_1.z.object({
                items: zod_1.z.array(exports.PlaylistItemSchema),
            }),
            settings: zod_1.z.record(zod_1.z.any()).optional(),
        }),
    }),
]);
exports.PairingResponseSchema = zod_1.z.object({
    code: zod_1.z.string(),
    expiresAt: zod_1.z.date(),
    pairUrl: zod_1.z.string(),
});
exports.PairingStatusResponseSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'PAIRED']),
});
exports.DeviceConfigResponseSchema = zod_1.z.object({
    playlist: zod_1.z.object({
        items: zod_1.z.array(exports.PlaylistItemSchema),
    }),
    settings: zod_1.z.record(zod_1.z.any()).optional(),
});
//# sourceMappingURL=schemas.js.map