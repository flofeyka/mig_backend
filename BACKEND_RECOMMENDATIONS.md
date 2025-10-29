# Рекомендации для бэкенда: Поддержка обработанных фото в заказах

## Цель
Добавить возможность для админов загружать обработанные версии фото для поштучных заказов с обработкой, чтобы пользователи получали обработанные фото вместо оригиналов.

---

## 1. Изменения в базе данных (Prisma Schema)

### 1.1. Добавить модель OrderMedia в `prisma/schema.prisma`

```prisma
model OrderMedia {
  id                String    @id @default(cuid())
  order             Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId           String
  media             Media     @relation(fields: [mediaId], references: [id])
  mediaId           String
  
  // Информация об обработке
  requiresProcessing Boolean   @default(false)
  processingPrice    Decimal?  @db.Decimal(10, 2)
  
  // Обработанные версии фото
  processedPreview   String?
  processedFullVersion String?
  processedAt        DateTime?
  processedBy        User?     @relation("ProcessedBy", fields: [processedById], references: [id])
  processedById      Int?
  
  // Порядок в заказе
  displayOrder      Int       @default(0)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([orderId, mediaId])
  @@index([orderId])
  @@index([mediaId])
  @@index([orderId, requiresProcessing])
}
```

### 1.2. Обновить модель Order

```prisma
model Order {
  id        String      @id @default(cuid())
  payment   Payment     @relation(fields: [paymentId], references: [id])
  paymentId String      @unique
  status    OrderStatus @default(PENDING)
  createdAt DateTime    @default(now())
  orderMedia OrderMedia[] // ← ДОБАВИТЬ эту строку
}
```

### 1.3. Обновить модель Media

```prisma
model Media {
  // ... существующие поля
  orderMedia OrderMedia[] // ← ДОБАВИТЬ эту строку
}
```

### 1.4. Обновить модель User

```prisma
model User {
  // ... существующие поля
  processedOrderMedia OrderMedia[] @relation("ProcessedBy") // ← ДОБАВИТЬ эту строку
}
```

### 1.5. Создать миграцию

```bash
npx prisma migrate dev --name add_order_media_processed
```

---

## 2. Изменения в DTO

### 2.1. Обновить `src/media/dto/buy-medias.dto.ts`

Добавить опциональное поле `requiresProcessing`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class BuyMediasDto {
  @ApiProperty({
    title: 'Medias id',
    example: ['gsfdgjk3h2gfs34234', 'fajsdfjaskdjfq234q2f'],
  })
  @IsString({ each: true })
  medias: string[];

  @ApiPropertyOptional({
    title: 'Media IDs that require processing',
    example: ['gsfdgjk3h2gfs34234'],
    description: 'Array of media IDs from individual_photo cart items',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiresProcessing?: string[];
}
```

---

## 3. Изменения в MediaService

### 3.1. Обновить метод `buyMedia` в `src/media/media.service.ts`

Изменить сигнатуру метода:

```typescript
async buyMedia(
  medias: string[],
  userId: number,
  requiresProcessing?: string[], // ← ДОБАВИТЬ параметр
): Promise<SuccessPaymentLinkRdo> {
  try {
    const mediasFound = await this.prisma.media.findMany({
      where: {
        id: {
          in: medias,
        },
      },
      select: { id: true },
    });

    const url = await this.paymentService.generatePaymentUrl(
      mediasFound.length * 400,
      userId,
      mediasFound,
      `Покупка ${mediasFound.length} медиа`,
      requiresProcessing || [], // ← ПЕРЕДАТЬ в paymentService
    );

    return fillDto(SuccessPaymentLinkRdo, { success: true, url });
  } catch (e) {
    console.error(e);
    throw new NotFoundException('Media not found');
  }
}
```

### 3.2. Обновить контроллер `src/media/media.controller.ts`

```typescript
@UseGuards(AuthJwtGuard)
@Post('/buy')
buyMedia(
  @Body() dto: BuyMediasDto,
  @User() user: UserRdo,
): Promise<SuccessPaymentLinkRdo> {
  return this.mediaService.buyMedia(
    dto.medias,
    user.id,
    dto.requiresProcessing, // ← ПЕРЕДАТЬ из DTO
  );
}
```

---

## 4. Изменения в PaymentService

### 4.1. Добавить поле для хранения requiresProcessing в Payment

Вариант 1: Добавить JSON поле в модель Payment:
```prisma
model Payment {
  // ... существующие поля
  requiresProcessingJson String? // JSON массив с ID медиа
}
```

Вариант 2: Передавать requiresProcessing при создании Order (рекомендуется)

### 4.2. Обновить `src/payment/payment.service.ts`

Изменить метод `generatePaymentUrl`:

```typescript
async generatePaymentUrl(
  amount: number,
  userId: number,
  medias: { id: string }[],
  description: string,
  requiresProcessing?: string[], // ← ДОБАВИТЬ параметр
): Promise<string> {
  // ... существующий код создания Payment
  
  // Сохранить requiresProcessing в payment (если используете вариант 1)
  // Или сохранить при создании Order (вариант 2, рекомендуется)
}
```

Обновить `processPayment` для передачи в OrderService:

```typescript
async processPayment(
  orderId: string,
  signature: string,
  status: PaymentStatus,
): Promise<SuccessRdo> {
  const payment = await this.fetchPaymentByOrderId(orderId);
  
  // ... существующий код валидации
  
  await this.prisma.payment.update({
    where: { id: payment.id },
    data: { status },
  });
  
  switch (status) {
    case PaymentStatus.SUCCESS: {
      const order = await this.orderService.createOrder(payment.id);
      
      // Получить requiresProcessing из payment или из другого источника
      const requiresProcessing = payment.requiresProcessingJson 
        ? JSON.parse(payment.requiresProcessingJson) 
        : [];
      
      // Создать OrderMedia записи
      await this.orderService.createOrderMediaFromPayment(
        order.id,
        payment.medias,
        requiresProcessing,
      );
      
      return fillDto(SuccessRdo, { success: true });
    }
    default:
      return fillDto(SuccessRdo, { success: false });
  }
}
```

---

## 5. Изменения в OrderService

### 5.1. Добавить метод создания OrderMedia в `src/order/order.service.ts`

```typescript
async createOrderMediaFromPayment(
  orderId: string,
  medias: Media[],
  requiresProcessing: string[],
): Promise<void> {
  await this.prisma.orderMedia.createMany({
    data: medias.map((media, index) => ({
      orderId,
      mediaId: media.id,
      requiresProcessing: requiresProcessing.includes(media.id),
      displayOrder: index,
    })),
  });
}
```

### 5.2. Обновить метод `getOrder`

```typescript
async getOrder(
  id: string,
  userId: number,
  isAdmin: boolean,
): Promise<OrderRdo> {
  const order = await this.prisma.order.findUnique({
    where: { id, ...(!isAdmin && { payment: { userId } }) },
    include: {
      orderMedia: {
        include: {
          media: {
            select: {
              id: true,
              preview: true,
              fullVersion: isAdmin,
              order: true,
            },
          },
        },
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
  });

  if (!order) throw new NotFoundException('Order not found');

  return fillDto(OrderRdo, this.flatOrder(order));
}

private flatOrder(order: Order & { orderMedia: OrderMedia[] }) {
  return {
    ...order,
    medias: order.orderMedia.map(om => {
      const media = om.media;
      // Для пользователя: если есть processedFullVersion, использовать его
      // Для админа: вернуть оба варианта
      const fullVersion = om.processedFullVersion || media.fullVersion;
      
      return {
        id: media.id,
        preview: media.preview,
        fullVersion: fullVersion,
        eventId: /* получить через member -> speech -> flow -> event */,
        order: om.displayOrder,
        requiresProcessing: om.requiresProcessing,
        processedPreview: om.processedPreview,
        processedFullVersion: om.processedFullVersion,
        processedAt: om.processedAt,
      };
    }),
  };
}
```

### 5.3. Обновить метод `getOrders`

Аналогично обновить для списка заказов (использовать `orderMedia` вместо `payment.medias`).

### 5.4. Добавить метод загрузки обработанного фото

```typescript
async uploadProcessedMedia(
  orderId: string,
  mediaId: string,
  file: Express.Multer.File,
  userId: number,
): Promise<OrderMediaRdo> {
  // 1. Проверить существование order_media
  const orderMedia = await this.prisma.orderMedia.findUnique({
    where: {
      orderId_mediaId: {
        orderId,
        mediaId,
      },
    },
  });

  if (!orderMedia) {
    throw new NotFoundException('Order media not found');
  }

  // 2. Проверить requiresProcessing
  if (!orderMedia.requiresProcessing) {
    throw new BadRequestException('This media does not require processing');
  }

  // 3. Загрузить файл в хранилище (использовать StorageService)
  const filename = `processed-${orderMedia.mediaId}-${uuid()}.png`;
  
  const [processedPreview, processedFullVersion] = await Promise.all([
    this.storageService.uploadFile(
      await this.processPreviewImage(file.buffer),
      filename,
      {
        folder: `/processed/preview/${orderMedia.orderId}`,
        storageType: StorageType.S3_PUBLIC,
      },
    ),
    this.storageService.uploadFile(
      file.buffer,
      filename,
      {
        folder: `/processed/full/${orderMedia.orderId}`,
        storageType: StorageType.S3_PUBLIC,
      },
    ),
  ]);

  // 4. Обновить order_media
  const updated = await this.prisma.orderMedia.update({
    where: {
      orderId_mediaId: {
        orderId,
        mediaId,
      },
    },
    data: {
      processedPreview,
      processedFullVersion,
      processedAt: new Date(),
      processedById: userId,
    },
    include: {
      media: true,
    },
  });

  return fillDto(OrderMediaRdo, {
    ...updated.media,
    requiresProcessing: updated.requiresProcessing,
    processedPreview: updated.processedPreview,
    processedFullVersion: updated.processedFullVersion,
    processedAt: updated.processedAt,
  });
}
```

**Важно**: Добавить импорт `processPreviewImage` из MediaService или скопировать метод, а также добавить импорты `BadRequestException`, `uuid`, `StorageType`.

---

## 6. Изменения в OrderController

### 6.1. Добавить эндпоинт для загрузки обработанного фото

В `src/order/order.controller.ts`:

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';

// Добавить метод:

@ApiOperation({ summary: 'Upload processed media for order' })
@ApiOkResponse({ type: OrderMediaRdo })
@UseGuards(AuthJwtGuard, AdminGuard)
@UseInterceptors(FileInterceptor('file'))
@Put('/:orderId/media/:mediaId/processed')
uploadProcessedMedia(
  @Param('orderId') orderId: string,
  @Param('mediaId') mediaId: string,
  @UploadedFile() file: Express.Multer.File,
  @User() user: UserRdo,
): Promise<OrderMediaRdo> {
  return this.orderService.uploadProcessedMedia(
    orderId,
    mediaId,
    file,
    user.id,
  );
}
```

---

## 7. Создать новые файлы

### 7.1. Создать `src/order/rdo/order-media.rdo.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { MediaRdo } from '../../media/rdo/media.rdo';

export class OrderMediaRdo extends MediaRdo {
  @ApiProperty({ title: 'Requires processing', example: true })
  @IsBoolean()
  @Expose()
  requiresProcessing: boolean;

  @ApiPropertyOptional({ title: 'Processed preview URL' })
  @IsOptional()
  @IsString()
  @Expose()
  processedPreview?: string;

  @ApiPropertyOptional({ title: 'Processed full version URL' })
  @IsOptional()
  @IsString()
  @Expose()
  processedFullVersion?: string;

  @ApiPropertyOptional({ title: 'Processed at' })
  @IsOptional()
  @Expose()
  processedAt?: Date;
}
```

### 7.2. Обновить `src/order/rdo/order.rdo.ts`

Использовать `OrderMediaRdo` вместо `MediaRdo`:

```typescript
import { OrderMediaRdo } from './order-media.rdo';

export class OrderRdo {
  // ... существующие поля
  
  @ApiProperty({ title: 'Media list', type: [OrderMediaRdo] })
  @IsArray()
  @Type(() => OrderMediaRdo)
  @Expose()
  medias: OrderMediaRdo[];
}
```

---

## Итоговый чеклист для бэкенда:

- [ ] Добавить модель OrderMedia в schema.prisma
- [ ] Обновить модели Order, Media, User (добавить связи)
- [ ] Создать миграцию базы данных
- [ ] Обновить BuyMediasDto (добавить requiresProcessing)
- [ ] Создать OrderMediaRdo
- [ ] Обновить MediaService.buyMedia (принимать requiresProcessing)
- [ ] Обновить MediaController (передавать requiresProcessing)
- [ ] Обновить PaymentService.generatePaymentUrl (принимать requiresProcessing)
- [ ] Обновить PaymentService.processPayment (создавать OrderMedia)
- [ ] Добавить OrderService.createOrderMediaFromPayment
- [ ] Обновить OrderService.getOrder (использовать orderMedia)
- [ ] Обновить OrderService.getOrders (использовать orderMedia)
- [ ] Добавить OrderService.uploadProcessedMedia
- [ ] Добавить эндпоинт PUT /order/:orderId/media/:mediaId/processed
- [ ] Обновить OrderRdo (использовать OrderMediaRdo)
- [ ] Протестировать создание заказа с requiresProcessing
- [ ] Протестировать загрузку обработанного фото
- [ ] Протестировать получение заказа (проверить processedFullVersion)

---

## Формат запроса от фронтенда:

```json
POST /media/buy
{
  "medias": ["media_id_1", "media_id_2", "media_id_3"],
  "requiresProcessing": ["media_id_1", "media_id_2"],
  "totalAmount": 2000
}
```

Где:
- `medias` — все ID медиа в заказе
- `requiresProcessing` — массив ID медиа из позиций `individual_photo` (требуют обработки)
- Остальные медиа — комплекты фото, не требуют обработки

---

## Важные моменты:

1. **Проверка прав доступа**: Загрузка обработанных фото — только для админов (`AdminGuard`)
2. **Валидация**: Не загружать обработанные версии для медиа, где `requiresProcessing = FALSE`
3. **Хранение**: Обработанные версии могут быть в том же хранилище, но в другой папке (`/processed/preview/` и `/processed/full/`)
4. **Для пользователя**: При наличии `processedFullVersion` → использовать его вместо `fullVersion`
5. **Для админа**: Возвращать оба варианта (оригинал и обработанный)

---

## Примечания по реализации:

- При создании OrderMedia нужно получить `eventId` для каждого медиа. Это можно сделать через связь: `Media -> Member -> Speech -> Flow -> Event`
- Метод `processPreviewImage` можно взять из MediaService или сделать отдельный сервис для обработки изображений
- Для получения `eventId` в flatOrder может потребоваться дополнительный запрос или включить в include цепочку связей

