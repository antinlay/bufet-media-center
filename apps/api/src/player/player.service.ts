import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BootstrapResponse,
  CreateDevicePairingDto,
  PairingResponse,
  PairingStatusResponse,
  DeviceConfigResponse,
} from '@bufet/shared';
import * as crypto from 'crypto';

@Injectable()
export class PlayerService {
  constructor(private prisma: PrismaService) {}

  async bootstrap(deviceId: string): Promise<BootstrapResponse> {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      include: {
        deviceConfig: {
          include: {
            playlist: {
              include: {
                items: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!device || !device.userId) {
      return { status: 'UNPAIRED' };
    }

    if (!device.deviceConfig) {
      return { status: 'UNPAIRED' };
    }

    return {
      status: 'PAIRED',
      config: {
        playlist: {
          items: device.deviceConfig.playlist.items,
        },
        settings: {},
      },
    };
  }

  async createPairing(dto: CreateDevicePairingDto): Promise<PairingResponse> {
    const device = await this.prisma.device.upsert({
      where: { deviceId: dto.deviceId },
      update: {},
      create: { deviceId: dto.deviceId },
    });

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.pairing.deleteMany({
      where: { deviceId: device.id },
    });

    const pairing = await this.prisma.pairing.create({
      data: {
        deviceId: device.id,
        code,
        expiresAt,
      },
    });

    const baseUrl = process.env.DASHBOARD_BASE_URL || 'http://localhost:3000';
    
    return {
      code: pairing.code,
      expiresAt: pairing.expiresAt,
      pairUrl: `${baseUrl}/pair?code=${pairing.code}`,
    };
  }

  async getPairingStatus(deviceId: string): Promise<PairingStatusResponse> {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      include: {
        pairings: {
          where: {
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!device) {
      return { status: 'PENDING' };
    }

    if (device.userId) {
      return { status: 'PAIRED' };
    }

    const latestPairing = device.pairings[0];
    if (!latestPairing) {
      return { status: 'PENDING' };
    }

    return { status: latestPairing.status };
  }

  async getDeviceConfig(deviceId: string): Promise<DeviceConfigResponse> {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      include: {
        deviceConfig: {
          include: {
            playlist: {
              include: {
                items: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!device || !device.deviceConfig) {
      throw new NotFoundException('Device config not found');
    }

    return {
      playlist: {
        items: device.deviceConfig.playlist.items,
      },
      settings: {},
    };
  }
}