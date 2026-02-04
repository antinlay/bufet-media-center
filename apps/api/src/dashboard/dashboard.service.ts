import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Device,
  Playlist,
  PlaylistItem,
  PairDeviceDto,
  CreatePlaylistDto,
  CreatePlaylistItemDto,
  UpdateDeviceConfigDto,
  RenameDeviceDto,
} from '@bufet/shared';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDevices(userId: string): Promise<Device[]> {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pairDevice(userId: string, dto: PairDeviceDto): Promise<Device> {
    const pairing = await this.prisma.pairing.findUnique({
      where: { code: dto.code },
      include: { device: true },
    });

    if (!pairing) {
      throw new NotFoundException('Invalid pairing code');
    }

    if (pairing.expiresAt < new Date()) {
      throw new NotFoundException('Pairing code expired');
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id: pairing.deviceId },
      data: { userId },
    });

    await this.prisma.pairing.update({
      where: { id: pairing.id },
      data: { status: 'PAIRED' },
    });

    return updatedDevice;
  }

  async renameDevice(userId: string, deviceId: string, dto: RenameDeviceDto): Promise<Device> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.device.update({
      where: { id: deviceId },
      data: { name: dto.name },
    });
  }

  async getPlaylists(userId: string): Promise<Playlist[]> {
    return this.prisma.playlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlaylist(userId: string, dto: CreatePlaylistDto): Promise<Playlist> {
    return this.prisma.playlist.create({
      data: {
        userId,
        name: dto.name,
      },
    });
  }

  async addPlaylistItem(userId: string, dto: CreatePlaylistItemDto): Promise<PlaylistItem> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: dto.playlistId },
    });

    if (!playlist || playlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const maxOrder = await this.prisma.playlistItem.aggregate({
      _max: { order: true },
      where: { playlistId: dto.playlistId },
    });

    return this.prisma.playlistItem.create({
      data: {
        playlist: { connect: { id: dto.playlistId } },
        type: dto.type,
        url: dto.url,
        durationSeconds: dto.durationSeconds,
        order: dto.order ?? (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async updateDeviceConfig(userId: string, deviceId: string, dto: UpdateDeviceConfigDto): Promise<void> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.deviceConfig.upsert({
      where: { deviceId },
      update: { playlistId: dto.playlistId },
      create: {
        deviceId,
        playlistId: dto.playlistId,
      },
    });
  }

  async deletePlaylistItem(userId: string, itemId: string): Promise<void> {
    const item = await this.prisma.playlistItem.findUnique({
      where: { id: itemId },
      include: { playlist: true },
    });

    if (!item || item.playlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.playlistItem.delete({
      where: { id: itemId },
    });
  }
}
