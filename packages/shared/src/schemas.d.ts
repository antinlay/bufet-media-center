import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    email?: string;
    phone?: string;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    id?: string;
    email?: string;
    phone?: string;
    createdAt?: Date;
    updatedAt?: Date;
}>;
export declare const DeviceSchema: z.ZodObject<{
    id: z.ZodString;
    deviceId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    userId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deviceId?: string;
    name?: string;
    userId?: string;
}, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deviceId?: string;
    name?: string;
    userId?: string;
}>;
export declare const PairingSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    deviceId: z.ZodString;
    status: z.ZodEnum<["PENDING", "PAIRED"]>;
    expiresAt: z.ZodDate;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: Date;
    code?: string;
    status?: "PENDING" | "PAIRED";
    deviceId?: string;
    expiresAt?: Date;
}, {
    id?: string;
    createdAt?: Date;
    code?: string;
    status?: "PENDING" | "PAIRED";
    deviceId?: string;
    expiresAt?: Date;
}>;
export declare const PlaylistSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    name?: string;
    userId?: string;
}, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    name?: string;
    userId?: string;
}>;
export declare const PlaylistItemSchema: z.ZodObject<{
    id: z.ZodString;
    playlistId: z.ZodString;
    type: z.ZodEnum<["IMAGE", "VIDEO"]>;
    url: z.ZodString;
    durationSeconds: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    order: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    type?: "IMAGE" | "VIDEO";
    playlistId?: string;
    url?: string;
    durationSeconds?: number;
    order?: number;
}, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    type?: "IMAGE" | "VIDEO";
    playlistId?: string;
    url?: string;
    durationSeconds?: number;
    order?: number;
}>;
export declare const DeviceConfigSchema: z.ZodObject<{
    id: z.ZodString;
    deviceId: z.ZodString;
    playlistId: z.ZodString;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    updatedAt?: Date;
    deviceId?: string;
    playlistId?: string;
}, {
    id?: string;
    updatedAt?: Date;
    deviceId?: string;
    playlistId?: string;
}>;
export declare const LoginDtoSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export declare const RegisterDtoSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    phone?: string;
    password?: string;
}, {
    email?: string;
    phone?: string;
    password?: string;
}>;
export declare const CreateDevicePairingDtoSchema: z.ZodObject<{
    deviceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    deviceId?: string;
}, {
    deviceId?: string;
}>;
export declare const PairDeviceDtoSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code?: string;
}, {
    code?: string;
}>;
export declare const CreatePlaylistDtoSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
}, {
    name?: string;
}>;
export declare const CreatePlaylistItemDtoSchema: z.ZodObject<{
    playlistId: z.ZodString;
    type: z.ZodEnum<["IMAGE", "VIDEO"]>;
    url: z.ZodString;
    durationSeconds: z.ZodOptional<z.ZodNumber>;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type?: "IMAGE" | "VIDEO";
    playlistId?: string;
    url?: string;
    durationSeconds?: number;
    order?: number;
}, {
    type?: "IMAGE" | "VIDEO";
    playlistId?: string;
    url?: string;
    durationSeconds?: number;
    order?: number;
}>;
export declare const UpdateDeviceConfigDtoSchema: z.ZodObject<{
    playlistId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    playlistId?: string;
}, {
    playlistId?: string;
}>;
export declare const RenameDeviceDtoSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
}, {
    name?: string;
}>;
export declare const BootstrapResponseSchema: z.ZodUnion<[z.ZodObject<{
    status: z.ZodLiteral<"UNPAIRED">;
}, "strip", z.ZodTypeAny, {
    status?: "UNPAIRED";
}, {
    status?: "UNPAIRED";
}>, z.ZodObject<{
    status: z.ZodLiteral<"PAIRED">;
    config: z.ZodObject<{
        playlist: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                playlistId: z.ZodString;
                type: z.ZodEnum<["IMAGE", "VIDEO"]>;
                url: z.ZodString;
                durationSeconds: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
                order: z.ZodNumber;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }, {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            items?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }[];
        }, {
            items?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }[];
        }>;
        settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        playlist?: {
            items?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }[];
        };
        settings?: Record<string, any>;
    }, {
        playlist?: {
            items?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }[];
        };
        settings?: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    status?: "PAIRED";
    config?: {
        playlist?: {
            items?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }[];
        };
        settings?: Record<string, any>;
    };
}, {
    status?: "PAIRED";
    config?: {
        playlist?: {
            items?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                type?: "IMAGE" | "VIDEO";
                playlistId?: string;
                url?: string;
                durationSeconds?: number;
                order?: number;
            }[];
        };
        settings?: Record<string, any>;
    };
}>]>;
export declare const PairingResponseSchema: z.ZodObject<{
    code: z.ZodString;
    expiresAt: z.ZodDate;
    pairUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code?: string;
    expiresAt?: Date;
    pairUrl?: string;
}, {
    code?: string;
    expiresAt?: Date;
    pairUrl?: string;
}>;
export declare const PairingStatusResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "PAIRED"]>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "PAIRED";
}, {
    status?: "PENDING" | "PAIRED";
}>;
export declare const DeviceConfigResponseSchema: z.ZodObject<{
    playlist: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            playlistId: z.ZodString;
            type: z.ZodEnum<["IMAGE", "VIDEO"]>;
            url: z.ZodString;
            durationSeconds: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
            order: z.ZodNumber;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            type?: "IMAGE" | "VIDEO";
            playlistId?: string;
            url?: string;
            durationSeconds?: number;
            order?: number;
        }, {
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            type?: "IMAGE" | "VIDEO";
            playlistId?: string;
            url?: string;
            durationSeconds?: number;
            order?: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items?: {
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            type?: "IMAGE" | "VIDEO";
            playlistId?: string;
            url?: string;
            durationSeconds?: number;
            order?: number;
        }[];
    }, {
        items?: {
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            type?: "IMAGE" | "VIDEO";
            playlistId?: string;
            url?: string;
            durationSeconds?: number;
            order?: number;
        }[];
    }>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    playlist?: {
        items?: {
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            type?: "IMAGE" | "VIDEO";
            playlistId?: string;
            url?: string;
            durationSeconds?: number;
            order?: number;
        }[];
    };
    settings?: Record<string, any>;
}, {
    playlist?: {
        items?: {
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            type?: "IMAGE" | "VIDEO";
            playlistId?: string;
            url?: string;
            durationSeconds?: number;
            order?: number;
        }[];
    };
    settings?: Record<string, any>;
}>;
export type LoginDto = z.infer<typeof LoginDtoSchema>;
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
export type CreateDevicePairingDto = z.infer<typeof CreateDevicePairingDtoSchema>;
export type PairDeviceDto = z.infer<typeof PairDeviceDtoSchema>;
export type CreatePlaylistDto = z.infer<typeof CreatePlaylistDtoSchema>;
export type CreatePlaylistItemDto = z.infer<typeof CreatePlaylistItemDtoSchema>;
export type UpdateDeviceConfigDto = z.infer<typeof UpdateDeviceConfigDtoSchema>;
export type RenameDeviceDto = z.infer<typeof RenameDeviceDtoSchema>;
export type BootstrapResponse = z.infer<typeof BootstrapResponseSchema>;
export type PairingResponse = z.infer<typeof PairingResponseSchema>;
export type PairingStatusResponse = z.infer<typeof PairingStatusResponseSchema>;
export type DeviceConfigResponse = z.infer<typeof DeviceConfigResponseSchema>;
