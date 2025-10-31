# Рекомендации для бэкенда: устранение 413 (Payload Too Large) и загрузка в Yandex S3

Этот документ описывает, как устранить ошибку 413 при загрузке фото через админку, и предлагает оптимальную архитектуру загрузки файлов напрямую в Yandex Object Storage (совместимый с S3).

---

## 1) Проблема: base64 в JSON и фронтовый прокси

Текущая загрузка отправляет файл как base64 внутри JSON и через фронтовый прокси (`/api/proxy?path=media`). Это:
- увеличивает размер тела на ~33%;
- упирается в лимиты прокси/парсеров, что приводит к `413 Payload Too Large`;
- нагружает бэкенд памятью/CPU.

Решение: отказаться от base64 и прокси — использовать `multipart/form-data` напрямую на API-домен, либо перейти на presigned загрузку в S3.

---

## 2) Переход на multipart/form-data (через API)

Плюсы: без раздувания размера, простой серверный код. Подходит как быстрый фикс.

Изменения на бэкенде (NestJS, Express):
- Включить приём файла через `FileInterceptor` с ограничением размера;
- Загружать файл в Yandex S3 как бинарь, не хранить в памяти дольше необходимого.

Контроллер:
```ts
import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthJwtGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(AuthJwtGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — при необходимости поднять
  }))
  @Post()
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: { memberId: string; individualPrice?: number }
  ) {
    return this.mediaService.uploadMediaToS3(file, dto);
  }
}
```

Увеличить лимиты парсеров для остальных JSON-запросов (на всякий случай):
```ts
import { json, urlencoded } from 'express';

app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));
```

---

## 3) Не отправлять файлы через фронтовый прокси

Для файловых запросов не использовать `/api/proxy?path=media` — у прокси часто низкий лимит тела. Запросы должны идти напрямую на `https://api.fotomig.net/media`.

На API включить CORS для доменов фронта:
```ts
app.enableCors({
  origin: ['https://fotomig.net', 'http://localhost:5173'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  exposedHeaders: ['ETag'],
});
```

---

## 4) Поднять лимиты по пути запроса

Nginx/Ingress:
```nginx
server {
  client_max_body_size 50M; // или больше, по требованиям
}
```

Fastify (если используется):
- Указать `bodyLimit` при инициализации;
- Для `fastify-multipart` — `limits.fileSize`.

Serverless-прокси (Vercel/Cloudflare Workers):
- Не использовать для файлов — их лимиты менять нельзя; грузить напрямую на API или в S3 по presigned URL.

---

## 5) Прямая загрузка в Yandex S3 на бэкенде (AWS SDK v3)

Yandex Object Storage совместим с S3. Пример клиента:
```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: process.env.YC_ACCESS_KEY!,
    secretAccessKey: process.env.YC_SECRET_KEY!,
  },
});

async function putObject(buffer: Buffer, key: string, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.YC_BUCKET!,
    Key: key,
    Body: buffer,       // можно поток
    ContentType: contentType,
    ACL: 'public-read', // если нужны публичные ссылки
  }));
  return `https://${process.env.YC_BUCKET}.storage.yandexcloud.net/${key}`;
}
```

Сервис:
```ts
async uploadMediaToS3(file: Express.Multer.File, dto: { memberId: string; individualPrice?: number }) {
  const key = `media/${dto.memberId}/${Date.now()}-${file.originalname}`;
  const url = await putObject(file.buffer, key, file.mimetype);
  // сохранить запись Media в БД (preview/fullVersion/individualPrice/memberId)
  return { success: true, url };
}
```

---

## 6) Лучший вариант: presigned URL (прямая загрузка фронтом в Yandex S3)

Преимущества: бэкенд не принимает тяжёлое тело (нет 413), меньше нагрузка и задержки, масштабируемость.

Шаги реализации:

1) Эндпоинт для presigned URL:
```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: { accessKeyId: process.env.YC_ACCESS_KEY!, secretAccessKey: process.env.YC_SECRET_KEY! },
});

async function getUploadUrl(fileName: string, fileType: string, memberId: string) {
  const key = `media/${memberId}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.YC_BUCKET!,
    Key: key,
    ContentType: fileType,
    ACL: 'public-read',
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 минут
  const finalUrl = `https://${process.env.YC_BUCKET}.storage.yandexcloud.net/${key}`;
  return { uploadUrl, objectKey: key, finalUrl };
}
```

Контроллер:
```ts
@UseGuards(AuthJwtGuard, AdminGuard)
@Post('/media/upload-url')
async createUploadUrl(@Body() dto: { fileName: string; fileType: string; memberId: string; individualPrice?: number }) {
  const { uploadUrl, objectKey, finalUrl } = await this.mediaService.getUploadUrl(dto.fileName, dto.fileType, dto.memberId);
  return { uploadUrl, objectKey, finalUrl };
}
```

2) Фронт загружает файл напрямую:
```ts
await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
```

3) Подтверждение загрузки и запись в БД:
```ts
@UseGuards(AuthJwtGuard, AdminGuard)
@Post('/media/confirm')
async confirmUpload(@Body() dto: { memberId: string; individualPrice?: number; objectKey: string }) {
  // Создать запись Media (preview/fullVersion/price) по objectKey
  return this.mediaService.createMediaRecord(dto);
}
```

4) Включить CORS на бакете Yandex S3:
```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://fotomig.net</AllowedOrigin>
    <AllowedOrigin>http://localhost:5173</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
  </CORSRule>
  </CORSConfiguration>
```

Рекомендации по безопасности presigned URL:
- `expiresIn` 5–15 минут;
- ключи ограничивать префиксом сущности: `media/{memberId}/...`;
- валидировать `fileType` (whitelist);
- на `confirm` проверять, что `objectKey` соответствует ожидаемому префиксу.

---

## 7) Генерация превью/ресайзов (опционально)

- Выполнять асинхронно (worker/очередь) после `confirm`;
- Сохранять `previewUrl` рядом с `finalUrl` (например, префикс `preview/`);
- В пользовательских ответах отдавать `preview` и конечный URL.

---

## 8) Чеклист устранения 413

- [ ] Убрать загрузку файлов через `/api/proxy?path=media` — только прямые запросы к API или presigned URL;
- [ ] Перейти на `multipart/form-data` для загрузки через API;
- [ ] Поднять лимиты: Nginx `client_max_body_size`, Multer `fileSize`, при необходимости body parser;
- [ ] На API включить CORS для доменов фронта;
- [ ] Для presigned — включить CORS на бакете, добавить `upload-url` и `confirm`;
- [ ] В сервисе — писать в Yandex S3 и фиксировать метаданные в БД;
- [ ] Добавить логирование/метрики размеров тел запросов и частоты 413.

---

## 9) Быстрые тесты

1) Загрузка 5–10 MB через `multipart/form-data` — статус 200, запись в БД присутствует, ссылка валидна;
2) Загрузка 20–30 MB — не должно быть 413 (при соответствующих лимитах);
3) Presigned upload (PUT) — загрузка проходит, `confirm` создаёт запись в БД;
4) CORS: прямой PUT из браузера к бакету Yandex S3 — без ошибок CORS, `ETag` доступен в заголовках.


