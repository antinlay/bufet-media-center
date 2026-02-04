import { Controller, Get, Post, Query, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { PlayerService } from './player.service';
import {
  BootstrapResponse,
  CreateDevicePairingDto,
  PairingResponse,
  PairingStatusResponse,
  DeviceConfigResponse,
} from '@bufet/shared';

@Controller('api/player')
export class PlayerController {
  constructor(private playerService: PlayerService) {}

  @Get('bootstrap')
  async bootstrap(@Query('deviceId') deviceId: string): Promise<BootstrapResponse> {
    return this.playerService.bootstrap(deviceId);
  }

  @Post('pairing')
  async createPairing(
    @Body()
    dto: CreateDevicePairingDto,
  ): Promise<PairingResponse> {
    return this.playerService.createPairing(dto);
  }

  @Get('pairing/status')
  async getPairingStatus(@Query('deviceId') deviceId: string): Promise<PairingStatusResponse> {
    return this.playerService.getPairingStatus(deviceId);
  }

  @Get('config')
  async getDeviceConfig(@Query('deviceId') deviceId: string): Promise<DeviceConfigResponse> {
    return this.playerService.getDeviceConfig(deviceId);
  }
}