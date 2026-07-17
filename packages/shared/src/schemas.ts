import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string(),
  name: z.string().optional(),
  userId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PairingSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  deviceId: z.string(),
  status: z.enum(['PENDING', 'PAIRED']),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const PlaylistSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PlaylistItemSchema = z.object({
  id: z.string().uuid(),
  playlistId: z.string().uuid(),
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().positive().optional().nullable(),
  order: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DeviceConfigSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string(),
  playlistId: z.string().uuid(),
  updatedAt: z.date(),
});

// DTOs
export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export const CreateDevicePairingDtoSchema = z.object({
  deviceId: z.string(),
});

export const PairDeviceDtoSchema = z.object({
  code: z.string(),
});

export const CreatePlaylistDtoSchema = z.object({
  name: z.string().min(1),
});

export const CreatePlaylistItemDtoSchema = z.object({
  playlistId: z.string().uuid(),
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string().url(),
  durationSeconds: z.number().positive().optional(),
  order: z.number().min(0).optional(),
});

export const UpdateDeviceConfigDtoSchema = z.object({
  playlistId: z.string().uuid(),
});

export const RenameDeviceDtoSchema = z.object({
  name: z.string().min(1),
});

// API Responses
export const BootstrapResponseSchema = z.union([
  z.object({
    status: z.literal('UNPAIRED'),
  }),
  z.object({
    status: z.literal('PAIRED'),
    config: z.object({
      playlist: z.object({
        items: z.array(PlaylistItemSchema),
      }),
      settings: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
]);

export const PairingResponseSchema = z.object({
  code: z.string(),
  expiresAt: z.date(),
  pairUrl: z.string(),
});

export const PairingStatusResponseSchema = z.object({
  status: z.enum(['PENDING', 'PAIRED']),
});

export const DeviceConfigResponseSchema = z.object({
  playlist: z.object({
    items: z.array(PlaylistItemSchema),
  }),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// Concerto API (Rails)
export const ConcertoGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  parentId: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  systemGroup: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoTemplatePositionSchema = z.object({
  id: z.number(),
  fieldId: z.number(),
  top: z.number().nullable().optional(),
  left: z.number().nullable().optional(),
  bottom: z.number().nullable().optional(),
  right: z.number().nullable().optional(),
  style: z.string().nullable().optional(),
});

export const ConcertoTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  author: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  positions: z.array(ConcertoTemplatePositionSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoPlayerDeviceSchema = z.object({
  id: z.number(),
  deviceId: z.string(),
  name: z.string().nullable().optional(),
  pairedAt: z.string().nullable().optional(),
  lastSeenAt: z.string().nullable().optional(),
});

export const ConcertoScreenSchema = z.object({
  id: z.number(),
  name: z.string(),
  groupId: z.number(),
  templateId: z.number(),
  lastSeenAt: z.string().nullable().optional(),
  online: z.boolean().optional(),
  status: z.enum(['online', 'offline', 'live']).optional(),
  configVersion: z.string().optional(),
  group: ConcertoGroupSchema.optional(),
  template: ConcertoTemplateSchema.optional(),
  device: ConcertoPlayerDeviceSchema.nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoFeedSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.string(),
  groupId: z.number(),
  config: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoFieldSchema = z.object({
  id: z.number(),
  name: z.string(),
  altNames: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoContentSchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  type: z.string(),
  duration: z.number().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  userId: z.number(),
  feeds: z.array(ConcertoFeedSchema).optional(),
  imageUrl: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  renderAs: z.string().nullable().optional(),
  format: z.string().nullable().optional(),
  videoSource: z.string().nullable().optional(),
  videoId: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoSubmissionSchema = z.object({
  id: z.number(),
  contentId: z.number(),
  feedId: z.number(),
  content: ConcertoContentSchema.optional(),
  feed: ConcertoFeedSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoPlaylistItemSchema = z.object({
  submissionId: z.number(),
  contentId: z.number(),
  type: z.string(),
  name: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  position: z.number(),
  mediaUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoPlaylistResponseSchema = z.object({
  screenId: z.number(),
  feedId: z.number(),
  items: z.array(ConcertoPlaylistItemSchema),
});

export const ConcertoSubscriptionSchema = z.object({
  id: z.number(),
  screenId: z.number(),
  fieldId: z.number(),
  feedId: z.number(),
  weight: z.number(),
  field: ConcertoFieldSchema.optional(),
  feed: ConcertoFeedSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoMembershipSchema = z.object({
  id: z.number(),
  userId: z.number(),
  groupId: z.number(),
  role: z.string(),
  user: z.unknown().optional(),
  group: ConcertoGroupSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  systemAdmin: z.boolean().optional(),
  groups: z.array(z.object({
    membershipId: z.number().optional(),
    id: z.number(),
    name: z.string(),
    role: z.string(),
  })).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ConcertoAuthResponseSchema = z.object({
  access_token: z.string(),
  user: ConcertoUserSchema,
});

export const ConcertoPairingResultSchema = z.object({
  screen: ConcertoScreenSchema,
  device: ConcertoPlayerDeviceSchema,
});

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
export type ConcertoGroup = z.infer<typeof ConcertoGroupSchema>;
export type ConcertoTemplate = z.infer<typeof ConcertoTemplateSchema>;
export type ConcertoTemplatePosition = z.infer<typeof ConcertoTemplatePositionSchema>;
export type ConcertoPlayerDevice = z.infer<typeof ConcertoPlayerDeviceSchema>;
export type ConcertoScreen = z.infer<typeof ConcertoScreenSchema>;
export type ConcertoFeed = z.infer<typeof ConcertoFeedSchema>;
export type ConcertoField = z.infer<typeof ConcertoFieldSchema>;
export type ConcertoContent = z.infer<typeof ConcertoContentSchema>;
export type ConcertoSubmission = z.infer<typeof ConcertoSubmissionSchema>;
export type ConcertoPlaylistItem = z.infer<typeof ConcertoPlaylistItemSchema>;
export type ConcertoPlaylistResponse = z.infer<typeof ConcertoPlaylistResponseSchema>;
export type ConcertoSubscription = z.infer<typeof ConcertoSubscriptionSchema>;
export type ConcertoMembership = z.infer<typeof ConcertoMembershipSchema>;
export type ConcertoUser = z.infer<typeof ConcertoUserSchema>;
export type ConcertoAuthResponse = z.infer<typeof ConcertoAuthResponseSchema>;
export type ConcertoPairingResult = z.infer<typeof ConcertoPairingResultSchema>;
