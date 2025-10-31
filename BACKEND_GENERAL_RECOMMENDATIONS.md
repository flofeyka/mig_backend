## Общие рекомендации для бэкенда (MIG) — только то, что осталось сделать

Этот документ агрегирует требования из ранее написанных рекомендаций и оставляет только невыполненные пункты.

Источник бекенда: `mig_backend` ([репозиторий](https://github.com/flofeyka/mig_backend))

---

### 1) База данных (Prisma)
Добавить недостающие поля:

```prisma
model Media {
  id               String   @id @default(cuid())
  filename         String   @unique
  fullVersion      String   @unique
  preview          String   @unique
  order            Int
  member           Member   @relation(fields: [memberId], references: [id])
  memberId         String
  createdAt        DateTime @default(now())
  orderMedia       OrderMedia[]
  // НОВОЕ: цена поштучной покупки фото
  individualPrice  Decimal? @db.Decimal(10, 2)
}

model Speech {
  id             String   @id @default(cuid())
  name           String?
  members        Member[]
  flow           Flow     @relation(fields: [flowId], references: [id])
  flowId         String
  // НОВОЕ: тип выступления и цена комплекта
  isGroup        Boolean  @default(false)
  packagePrice   Decimal? @db.Decimal(10, 2)
}

model Event {
  id        String   @id @default(cuid())
  name      String
  date      DateTime
  // НОВОЕ: место проведения и локация
  venue     String
  location  String
  buyers    User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  flows     Flow[]
}
```

Миграция (SQL-ориентир):
```sql
ALTER TABLE "media"    ADD COLUMN IF NOT EXISTS "individual_price" DECIMAL(10,2);
ALTER TABLE "speeches" ADD COLUMN IF NOT EXISTS "package_price"    DECIMAL(10,2);
ALTER TABLE "speeches" ADD COLUMN IF NOT EXISTS "is_group"          BOOLEAN DEFAULT FALSE;
ALTER TABLE "event"    ADD COLUMN IF NOT EXISTS "venue"             TEXT NOT NULL DEFAULT '';
ALTER TABLE "event"    ADD COLUMN IF NOT EXISTS "location"          TEXT NOT NULL DEFAULT '';
```

Заметка: `Event.price` — убрать, цены живут на `Speech` (комплект) и `Media` (поштучно).

---

### 2) DTO/RDO — принять и вернуть цены и поля

Media:
```ts
// src/media/dto/add-media.dto.ts
export class AddMediaDto {
  @IsString() memberId: string;
  @IsOptional() @IsNumber() @Min(0) individualPrice?: number;
}

// src/media/rdo/media.rdo.ts
export class MediaRdo {
  @Expose() id: string;
  @Expose() preview: string;
  @Expose() fullVersion: string | null;
  @Expose() eventId: string;
  @Expose() order: number;
  @Expose() individualPrice?: number;
}
```

Speech:
```ts
// src/speech/dto/create-speech.dto.ts
export class CreateSpeechDto {
  @IsOptional() @IsString() name: string;
  @IsString() flowId: string;
  @IsOptional() @IsNumber() @Min(0) packagePrice?: number;
  @IsOptional() @IsBoolean() isGroup?: boolean;
}

// src/speech/dto/update-speech.dto.ts -> PartialType(CreateSpeechDto)

// src/speech/rdo/speech.rdo.ts
export class SpeechRdo {
  @Expose() id: string;
  @Expose() name: string | null;
  @Expose() flowId: string;
  @Expose() members: MemberRdo[];
  @Expose() packagePrice?: number;
  @Expose() isGroup: boolean;
}
```

Event:
```ts
// src/event/dto/create-event.dto.ts
export class CreateEventDto {
  @IsString() name: string;
  @IsString() date: string;
  @IsString() venue: string;
  @IsString() location: string;
}

// src/event/rdo/event.rdo.ts
export class EventRdo {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() date: Date;
  @Expose() venue: string;
  @Expose() location: string;
}
```

Совместимость: при необходимости временно принимать и `price` в `AddMediaDto`, использовать `individualPrice ?? price ?? 400`, затем удалить `price`.

---

### 3) Ценообразование (убрать хардкоды)
- В `MediaService.buyMedia` вместо `mediasFound.length * 400` — суммировать `Media.individualPrice ?? 400` для каждого ID.
- Для комплектов использовать `Speech.packagePrice`.
- Сумму считать на сервере, фиксировать рассчитанные значения в заказе.

---

### 4) Смешанные заказы (комплект + поштучно)
Ввести универсальный эндпоинт (параллельно существующему `POST /media/buy`):
```json
POST /order
{
  "orderId": "client-uuid",
  "eventId": "evt1",
  "items": [
    { "type": "package",   "speechId": "sp1" },
    { "type": "individual", "photos": [ { "id": "m2", "isForProcessing": true } ] }
  ]
}
```
Требования:
- Игнорировать клиентский total, возвращать `totalCalculated`.
- Валидировать принадлежность ID сущностям события/потока/выступления/участника.
- Исключать дубли, фиксировать цены на момент заказа.

---

### 5) Обработка и выдача
(В проекте уже есть хранение `orderMedia`, загрузка обработанных файлов админом, и выдача структуры заказа.)
Дополнить:
- Пользовательская выдача: если поштучное фото обработано — отдавать `processedFullVersion`; если выбран режим "без обработки" — отдавать оригинал.
- Для комплектов: после одобрения админом формировать ссылку на скачивание всех медиа выступления (без обработки).

---

### 6) Загрузки и 413
- CORS: разрешить `https://fotomig.net`, методы `GET,POST,PUT,DELETE,OPTIONS`, заголовки `Content-Type,Authorization`, `exposedHeaders: ['ETag']`.
- Presigned URL в S3 — опционально как улучшение (для крупных файлов/масштабирования).

---

### 7) Эндпоинты — что добавить/изменить
- `POST /media` — принимать `individualPrice?` (multipart).
- `POST /speech`, `PUT /speech/:id` — принимать `packagePrice?`, `isGroup?`.
- `GET /speech*` — возвращать `packagePrice`, `isGroup`.
- `POST /order` — создать смешанный заказ (новый контракт). `POST /media/buy` оставить на время для поштучных.

---

### 8) Безопасность и доступы
- Не доверять ценам и total из клиента — только БД и серверный расчёт.
- Админские действия — под `AdminGuard`.
- В пользовательских ответах скрывать оригиналы, если нет права/режима "без обработки".

---

### 9) Swagger и тесты
- Обновить Swagger для новых полей и контрактов.
- Проверки:
  1) Медиа с `individualPrice` создаётся, значение возвращается.
  2) Выступление с `packagePrice`/`isGroup` создаётся/обновляется, поля возвращаются.
  3) Смешанный заказ (`POST /order`) — сервер верно считает `totalCalculated`.
  4) Поштучные фото: после загрузки обработки — пользователь получает обработанные ссылки; при выборе "без обработки" — оригиналы.

---

### 10) Чеклист
- [ ] Миграции Prisma: `Media.individualPrice`, `Speech.packagePrice`, `Speech.isGroup`, `Event.venue/location`.
- [ ] DTO/RDO: добавить/возвращать новые поля (Media/Speech/Event).
- [ ] Убрать хардкод цен, считать суммы по БД.
- [ ] Добавить `POST /order` и логику смешанных заказов.
- [ ] Ограничения загрузки и CORS.
- [ ] Swagger + тесты.

---

### 11) Заявки из модального окна «Забронировать дату» (чтобы попадали в админку)

Цель: любые заявки с фронта (форма бронирования даты) сохранять в БД и отображать в админке для обратной связи/обработки.

База данных (Prisma ориентир):
```prisma
model BookingRequest {
  id          String   @id @default(cuid())
  name        String
  phone       String
  eventName   String
  date        DateTime?
  status      String   @default("NEW") // NEW | IN_PROGRESS | DONE | REJECTED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
