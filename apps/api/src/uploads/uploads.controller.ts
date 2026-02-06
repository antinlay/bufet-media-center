import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import * as fs from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

@Controller('api/uploads')
@UseGuards(AuthGuard('jwt'))
export class UploadsController {
  constructor() {
    ensureUploadsDir();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadsDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const name = randomBytes(8).toString('hex');
          const ext = extname(file.originalname) || '';
          cb(null, `${name}${ext}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const baseUrl = process.env.API_BASE_URL || process.env.PUBLIC_URL || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/${file.filename}`;
    return {
      url,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
