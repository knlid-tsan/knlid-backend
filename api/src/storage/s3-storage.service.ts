import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { StorageService } from './storage.service';

// Папки с чувствительными документами — доступ только по presigned URL
const PRIVATE_FOLDERS = new Set(['identity', 'company', 'proofs']);
const SIGNED_URL_TTL = 3600; // 1 час

@Injectable()
export class S3StorageService extends StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    super();
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true, // обязательно для non-AWS S3 (Minio, Yandex, Selectel)
    });
    this.bucket = process.env.S3_BUCKET!;
    this.publicBaseUrl = (process.env.S3_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${randomUUID()}${extname(file.originalname)}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return key;
  }

  async getUrl(key: string | null | undefined): Promise<string | null> {
    if (!key) return null;
    if (key.startsWith('http://') || key.startsWith('https://')) return key;

    const folder = key.split('/')[0];
    if (PRIVATE_FOLDERS.has(folder)) {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return getSignedUrl(this.s3, cmd, { expiresIn: SIGNED_URL_TTL });
    }

    return `${this.publicBaseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
