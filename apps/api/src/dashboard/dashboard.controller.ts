import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
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

@Controller('api')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('devices')
  async getDevices(@Request() req): Promise<Device[]> {
    return this.dashboardService.getDevices(req.user.userId);
  }

  @Post('devices/pair')
  async pairDevice(@Request() req, @Body() dto: PairDeviceDto): Promise<Device> {
    return this.dashboardService.pairDevice(req.user.userId, dto);
  }

  @Patch('devices/:id')
  async renameDevice(
    @Request() req,
    @Param('id', ParseUUIDPipe) deviceId: string,
    @Body() dto: RenameDeviceDto,
  ): Promise<Device> {
    return this.dashboardService.renameDevice(req.user.userId, deviceId, dto);
  }

  @Get('playlists')
  async getPlaylists(@Request() req): Promise<Playlist[]> {
    return this.dashboardService.getPlaylists(req.user.userId);
  }

  @Post('playlists')
  async createPlaylist(
    @Request() req,
    @Body() dto: CreatePlaylistDto,
  ): Promise<Playlist> {
    return this.dashboardService.createPlaylist(req.user.userId, dto);
  }

  @Post('playlists/:id/items')
  async addPlaylistItem(
    @Request() req,
    @Param('id', ParseUUIDPipe) playlistId: string,
    @Body() dto: CreatePlaylistItemDto,
  ): Promise<PlaylistItem> {
    return this.dashboardService.addPlaylistItem(req.user.userId, {
      ...dto,
      playlistId,
    });
  }

  @Delete('playlist-items/:id')
  async deletePlaylistItem(@Request() req, @Param('id', ParseUUIDPipe) itemId: string): Promise<void> {
    return this.dashboardService.deletePlaylistItem(req.user.userId, itemId);
  }

  @Patch('device-config/:deviceId')
  async updateDeviceConfig(
    @Request() req,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() dto: UpdateDeviceConfigDto,
  ): Promise<void> {
    return this.dashboardService.updateDeviceConfig(req.user.userId, deviceId, dto);
  }
}
