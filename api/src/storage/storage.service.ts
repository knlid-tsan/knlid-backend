export abstract class StorageService {
  abstract upload(file: Express.Multer.File, folder: string): Promise<string>;
  abstract getUrl(key: string | null | undefined): Promise<string | null>;
  abstract delete(key: string): Promise<void>;
}
