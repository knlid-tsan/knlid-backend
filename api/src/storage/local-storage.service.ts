import { Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const dir = join(process.cwd(), 'uploads', folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), file.buffer);
    return `${folder}/${filename}`;
  }

  async getUrl(key: string | null | undefined): Promise<string | null> {
    if (!key) return null;
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    // Normalize to 'uploads/folder/file' — same format as the old diskStorage file.path,
    // so the mobile can use it as-is with apiBaseUrl + '/' + key (no double-slash).
    const withoutLeadingSlash = key.replace(/^\//, '');
    const withoutUploadsPrefix = withoutLeadingSlash.replace(/^uploads\//, '');
    return `uploads/${withoutUploadsPrefix}`;
  }

  async delete(key: string): Promise<void> {
    try {
      const normalized = key.replace(/^\/?uploads\//, '');
      await unlink(join(process.cwd(), 'uploads', normalized));
    } catch {
      // ignore missing files
    }
  }
}
