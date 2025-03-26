import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = 'uploads/companies';

  constructor() {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  async uploadLogo(file: Express.Multer.File): Promise<string> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return fileName;
  }

  async deleteLogo(fileName: string): Promise<void> {
    if (!fileName) return;

    const filePath = path.join(this.uploadDir, fileName);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting logo file:', error);
    }
  }
} 