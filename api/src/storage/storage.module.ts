import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useClass:
        process.env.STORAGE_DRIVER === 's3'
          ? S3StorageService
          : LocalStorageService,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
