import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as archiver from 'archiver';
import { PassThrough } from 'stream';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Config,
  StorageConfig,
  StorageOptions,
  StorageType
} from './storage.interface';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly configs: Map<StorageType, StorageConfig>;

  constructor(private readonly configService: ConfigService) {
    this.configs = new Map();

    const privateConfig = {
      region: this.configService.get<string>('S3_REGION', 'ru-central1'),
      endpoint: this.configService.get<string>(
        'S3_ENDPOINT',
        'https://storage.yandexcloud.net',
      ),
      bucketName: this.configService.get<string>('S3_PRIVATE_BUCKET_NAME', ''),
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID', ''),
      secretAccessKey: this.configService.get<string>(
        'S3_SECRET_ACCESS_KEY',
        '',
      ),
      isPublic: false,
    };

    const publicConfig = {
      region: this.configService.get<string>('S3_REGION', 'ru-central1'),
      endpoint: this.configService.get<string>(
        'S3_ENDPOINT',
        'https://storage.yandexcloud.net',
      ),
      bucketName: this.configService.get<string>('S3_PUBLIC_BUCKET_NAME', ''),
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID', ''),
      secretAccessKey: this.configService.get<string>(
        'S3_SECRET_ACCESS_KEY',
        '',
      ),
      isPublic: true,
    };
    this.configs.set(StorageType.S3, privateConfig);
    this.configs.set(StorageType.S3_PUBLIC, publicConfig);

    this.s3Client = new S3Client({
      region: privateConfig.region,
      endpoint: privateConfig.endpoint,
      credentials: {
        accessKeyId: privateConfig.accessKeyId,
        secretAccessKey: privateConfig.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async getPresignedUrl(
    filename: string,
    options: StorageOptions = {},
    expiresIn = 3600,
  ): Promise<string> {
    const { storageType = StorageType.S3, folder } = options;
    const config = this.getConfig(storageType);

    const s3Config = config as S3Config;
    const fullPath = this.getFullPath(filename, folder);

    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: fullPath,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return url;
  }

  async getFolderAsZip(
  folder: string,
  storageType: StorageType = StorageType.S3
): Promise<NodeJS.ReadableStream> {

  const config = this.getConfig(storageType) as S3Config;

  const prefix = folder.replace(/^\/+|\/+$/g, '') + '/';

  const list = await this.s3Client.send(
    new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
    }),
  );

  if (!list.Contents || list.Contents.length === 0) {
    throw new Error('Папка пуста или не существует');
  }

  const zipStream = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(zipStream);

  for (const file of list.Contents) {
    const key = file.Key!;
    const fileStream = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );

    archive.append(fileStream.Body as NodeJS.ReadableStream, {
      name: key.replace(prefix, ''),
    });
  }

  archive.finalize();

  return zipStream;
}

  private getFullPath(filename: string, folder?: string): string {
    if (!folder) return filename;
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    return `${cleanFolder}/${filename}`;
  }

  private validateConfig(config: S3Config): void {
    if (!config.bucketName || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error('S3 configuration is incomplete');
    }
  }

  private getConfig(storageType: StorageType = StorageType.S3): StorageConfig {
    const config = this.configs.get(storageType);
    if (!config) {
      throw new Error(
        `No configuration found for storage type: ${storageType}`,
      );
    }
    return config;
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    options: StorageOptions = {},
  ): Promise<string> {
    const { storageType = StorageType.S3, folder, contentType } = options;
    const config = this.getConfig(storageType);

    const s3Config = config as S3Config;
    const fullPath = this.getFullPath(filename, folder);

    try {
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: fullPath,
        Body: file,
        ACL: s3Config.isPublic ? 'public-read' : 'private',
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      return this.getFileUrl(filename, options);
    } catch (error) {
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getFileUrl(
    filename: string,
    options: StorageOptions = {},
  ): Promise<string> {
    const { storageType = StorageType.S3, folder } = options;
    const config = this.getConfig(storageType);

    const s3Config = config as S3Config;
    const fullPath = this.getFullPath(filename, folder);
    return `https://${s3Config.bucketName}.storage.yandexcloud.net/${fullPath}`;
  }
}
