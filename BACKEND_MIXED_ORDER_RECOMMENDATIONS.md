# Рекомендации для бэкенда: Смешанные заказы (комплект + поштучно), цены и обработка фото

Документ объединяет и согласует требования из: `API_PRICE_FIELDS_FIX.md`, `PRICE_FIELDS_ADDED.md`, `BACKEND_RECOMMENDATIONS.md`.

Цель: один заказ может содержать позиции типа комплект и поштучно с обработкой; цены берутся из БД; админ загружает обработанные фото; роли защищают админские операции.

---

## 1) Роли и доступ
- Добавить `isAdmin: boolean` в ответы `sign-in`, `refresh`, `GET /user/me`.
- В JWT включать claim `isAdmin` либо проверять по БД на каждом запросе.
- Все эндпоинты `/admin/**` защищать проверкой роли; при отсутствии прав — `403`.

Пример ответа:
```json
{
  "user": { "id": 1, "fullname": "Admin", "login": "admin", "email": "a@a", "isAdmin": true },
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

---

## 2) Модель заказа: единый смешанный заказ
Один заказ содержит массив позиций:
- `type: "package"` — комплект фото выступления
- `type: "individual"` — поштучные фото с флагом обработки

Запрос создания заказа (новый контракт):
```json
POST /order
{
  "orderId": "client-uuid",
  "eventId": "evt1",
  "streamId": "str1",
  "performanceId": "sp1",
  "memberId": "mem1",
  "items": [
    { "type": "package", "speechId": "sp1" },
    { "type": "individual", "photos": [
      { "id": "m2", "isForProcessing": true },
      { "id": "m3", "isForProcessing": true }
    ]}
  ],
  "totalAmount": 3000
}
```

Серверная логика:
- Игнорировать клиентский `totalAmount`, считать на сервере.
- Валидировать принадлежность всех `mediaId` к `event/flow/speech/member`.
- Исключить дубли фото в заказе; зафиксировать рассчитанные цены на момент заказа.

---

## 3) Цены: фиксация и возврат в API
Из `API_PRICE_FIELDS_FIX.md` и `PRICE_FIELDS_ADDED.md`:

База данных (ориентир SQL/Prisma):
```sql
ALTER TABLE media ADD COLUMN individual_price DECIMAL(10,2) DEFAULT 400.00;
ALTER TABLE speeches ADD COLUMN package_price DECIMAL(10,2) NULL;
ALTER TABLE speech_members ADD COLUMN is_group BOOLEAN DEFAULT FALSE;
```

DTO/Swagger (NestJS):
- Медиа: `AddMediaDto` — добавить `individualPrice?: number` (принимать также `price` для совместимости; использовать `individualPrice || price || 400`).
- Медиа RDO: `MediaRdo` — добавить `individualPrice?: number`.
- Выступления: `CreateSpeechDto`/`UpdateSpeechDto` — добавить `packagePrice?: number`, `isGroup?: boolean`.
- Выступления RDO: `SpeechRdo` — добавить `packagePrice?: number`.

Возврат цен в API:
- Во всех ответах, где возвращаются медиа, включать `individualPrice`.
- Во всех ответах, где возвращаются выступления, включать `packagePrice` (и `isGroup`, если используется).

Серверный расчёт:
- `package` позиция → брать `Speech.packagePrice`.
- `individual` позиция → брать `Media.individualPrice` (или тариф по умолчанию).
- Итог `totalCalculated` хранить в заказе.

---

## 4) Обработка поштучных фото (processed)
Из `BACKEND_RECOMMENDATIONS.md`:

Схема (Prisma ориентир):
```prisma
model Order {
  id            String      @id @default(cuid())
  paymentId     String      @unique
  status        OrderStatus @default(PENDING)
  totalCalculated Decimal   @db.Decimal(10,2)
  createdAt     DateTime    @default(now())
  orderItems    OrderItem[]
}

model OrderItem {
  id              String      @id @default(cuid())
  orderId         String
  order           Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  type            OrderItemType // PACKAGE | INDIVIDUAL
  speechId        String?
  packagePriceCalculated Decimal? @db.Decimal(10,2)
  photos          OrderItemPhoto[]
}

model OrderItemPhoto {
  id                   String   @id @default(cuid())
  orderItemId          String
  orderItem            OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  mediaId              String
  isForProcessing      Boolean  @default(false)
  unitPriceCalculated  Decimal  @db.Decimal(10,2)
  processingStatus     ProcessingStatus @default(REQUIRED) // REQUIRED|IN_PROGRESS|DONE
  processedUrl         String?
  @@unique([orderItemId, mediaId])
}
```

Эндпоинты (админ):
- `GET /admin/orders?page&limit&status` — список заказов.
- `GET /admin/orders/{id}` — заказ c позициями, фото и `processingStatus`.
- `PUT /admin/orders/{id}/status` — смена статуса заказа.
- `POST /admin/orders/{orderId}/items/{itemId}/photos/{photoId}/upload-processed` — загрузка обработанного файла (multipart/base64). По загрузке: `processedUrl` и `processingStatus = DONE`.

Пользовательские ответы:
- В `GET /order/{id}` для `individual` фото, если `processedUrl` установлен — отдавать его в качестве ссылки на скачивание.

---

## 5) Контракты ответов (примеры)
```json
GET /order/{id}
{
  "id": "ord1",
  "paymentId": "pay_123",
  "status": "APPROVED",
  "items": [
    {
      "type": "package",
      "speechId": "sp1",
      "packagePriceCalculated": 2000,
      "medias": [ { "id": "m1", "preview": "...", "fullVersion": "..." } ]
    },
    {
      "type": "individual",
      "photos": [
        { "id": "m2", "preview": "...", "originalUrl": "...", "processedUrl": "https://.../m2.jpg", "processingStatus": "DONE", "unitPriceCalculated": 500 }
      ]
    }
  ],
  "totalCalculated": 2500
}
```

```json
GET /admin/orders?page=1&limit=10
{ "total": 123, "orders": [ { "id": "ord1", "paymentId": "pay_123", "status": "PENDING" } ] }
```

```json
PUT /admin/orders/{id}/status
{ "status": "APPROVED" } -> { "success": true }
```

---

## 6) Безопасность цен
- Не доверять `totalAmount` из фронта.
- Все вычисления только по данным БД: `Speech.packagePrice`, `Media.individualPrice`, тарифы.
- Фиксировать рассчитанные значения в заказе (иммутабельно).

---

## 7) Соприкосновение с текущим API
- Сейчас фронт вызывает `POST /media/buy` и не передает флаги обработки.
- Рекомендуется перейти на `POST /order` с `items[]` (как выше), что позволит оформить смешанный заказ.
- Для обратной совместимости можно временно поддержать `POST /media/buy` с полем `requiresProcessing: string[]`, но приоритет — новый контракт `/order`.

---

## 8) Чеклист внедрения
1. Добавить `isAdmin` в модель/ответы/guard'ы, защитить `/admin/**`.
2. Миграции БД: `individual_price`, `package_price`, `is_group`; модели `Order/OrderItem/OrderItemPhoto`.
3. DTO/RDO обновить: `AddMediaDto.individualPrice`, `MediaRdo.individualPrice`, `Create/UpdateSpeechDto.packagePrice/isGroup`, `SpeechRdo.packagePrice`.
4. Новый эндпоинт `POST /order` (смешанный заказ) и расчёт цены на сервере.
5. Админские эндпоинты для управления заказами и загрузки обработанных файлов.
6. В ответах заказов для пользователя — использовать `processedUrl`, когда доступно.
7. Обновить Swagger и покрыть Postman-тестами.

---

## 9) Быстрые тесты (Postman/Swagger)
- Создать медиа с `individualPrice` и получить медиа — поле возвращается.
- Создать выступление с `packagePrice` — поле возвращается.
- Создать смешанный заказ через `POST /order` — сервер верно считает `totalCalculated`.
- Загрузить обработанный файл по поштучному фото — `processedUrl` и `processingStatus = DONE`.
- Пользовательский `GET /order/{id}` — отдает ссылку на обработанное фото.

---

Связанные документы: `API_PRICE_FIELDS_FIX.md`, `PRICE_FIELDS_ADDED.md`, `BACKEND_RECOMMENDATIONS.md`.


