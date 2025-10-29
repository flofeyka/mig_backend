# Рекомендации для бэкенда: Исправление API для работы с ценами

## ⚠️ Критическая проблема

**Фронтенд отправляет цены в админке, но бэкенд их игнорирует!**

В результате:
- ❌ Цены, установленные в админке, не сохраняются в БД
- ❌ При запросах медиа и выступлений цены не возвращаются
- ❌ Невозможно рассчитать правильную сумму заказа

---

## Текущая ситуация

### 1. Медиа (`POST /media`)

**Фронтенд отправляет:**
```json
{
  "memberId": "fgskfdjgq2430gsfg34g",
  "price": 500,
  "file": "base64...",
  "fileName": "photo.jpg",
  "fileType": "image/jpeg"
}
```

**Бэкенд принимает (DTO):**
```typescript
// src/media/dto/add-media.dto.ts
export class AddMediaDto {
  memberId: string; // ❌ Только это поле!
  // price отсутствует!
}
```

**Проблема:** Поле `price` от фронтенда игнорируется, `individualPrice` не сохраняется в БД.

---

### 2. Выступления (`POST /speech`, `PUT /speech/{id}`)

**Фронтенд отправляет:**
```json
{
  "name": "Выступление",
  "flowId": "dfjaskfl3424lfa34",
  "packagePrice": 2000,
  "isGroup": false
}
```

**Бэкенд принимает (DTO):**
```typescript
// src/speech/dto/create-speech.dto.ts
export class CreateSpeechDto {
  name: string;
  flowId: string; // ❌ Только эти поля!
  // packagePrice и isGroup отсутствуют!
}
```

**Проблема:** Поля `packagePrice` и `isGroup` от фронтенда игнорируются, не сохраняются в БД.

---

### 3. Ответы API

**Медиа (`MediaRdo`):**
```typescript
// src/media/rdo/media.rdo.ts
export class MediaRdo {
  id: string;
  preview: string;
  fullVersion: string;
  eventId: string;
  order: number;
  // ❌ individualPrice отсутствует!
}
```

**Выступления (`SpeechRdo`):**
```typescript
// src/speech/rdo/speech.rdo.ts
export class SpeechRdo {
  id: string;
  name: string;
  flowId: string;
  members: MemberRdo;
  // ❌ packagePrice отсутствует!
}
```

**Проблема:** При запросах медиа и выступлений цены не возвращаются на фронтенд.

---

## Решение: Пошаговые изменения

### Шаг 1: Обновить DTO для медиа

#### 1.1. Обновить `src/media/dto/add-media.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddMediaDto {
  @ApiProperty({ title: 'Member id', example: 'fgskfdjgq2430gsfg34g' })
  @IsString()
  memberId: string;

  @ApiPropertyOptional({
    title: 'Individual price',
    example: 500,
    description: 'Price for individual photo purchase. Default: 400',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  individualPrice?: number; // ← ДОБАВИТЬ это поле
}
```

**Важно:** 
- Поле опциональное (`@IsOptional()`)
- Если не передано, использовать значение по умолчанию (400) или из БД
- Фронтенд отправляет `price`, но для ясности лучше использовать `individualPrice`

#### 1.2. Обновить контроллер (если нужно)

Проверить `src/media/media.controller.ts` - там может быть маппинг полей:
```typescript
// Если фронтенд отправляет "price", а мы хотим "individualPrice"
// Можно добавить трансформацию или изменить фронтенд
```

---

### Шаг 2: Обновить RDO для медиа

#### 2.1. Обновить `src/media/rdo/media.rdo.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MediaRdo {
  @ApiProperty({ title: 'ID', example: 'cmgas45bsfdgq33g' })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({
    title: 'Preview',
    example: 'https://cloud.yandex.ru/preview/123.png',
  })
  @IsString()
  @Expose()
  preview: string;

  @ApiProperty({
    title: 'Full Version',
    example: 'https://cloud.yandex.ru/original/123.png',
  })
  @IsOptional()
  @Expose()
  fullVersion: string;

  @ApiProperty({
    title: 'Event id',
    example: 'cmgas45bsfdgq33g',
  })
  @IsString()
  @Expose()
  eventId: string;

  @ApiProperty({ title: 'Order', example: 1 })
  @IsNumber()
  @Expose()
  order: number;

  @ApiPropertyOptional({
    title: 'Individual price',
    example: 500,
    description: 'Price for individual photo purchase',
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  individualPrice?: number; // ← ДОБАВИТЬ это поле
}
```

---

### Шаг 3: Обновить сервис для сохранения цены медиа

#### 3.1. Обновить `src/media/media.service.ts`

```typescript
async addMedia(
  memberId: string,
  file: Express.Multer.File,
  individualPrice?: number, // ← ДОБАВИТЬ параметр
): Promise<MediaRdo> {
  try {
    const lastMedia = await this.prisma.media.findFirst({
      where: { memberId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const fileData = await this.uploadFile(memberId, 1, file);
    
    // Сохраняем медиа с ценой
    const media = await this.prisma.media.create({
      data: {
        ...fileData,
        memberId,
        order: (lastMedia?.order || 0) + 1,
        individualPrice: individualPrice || 400, // ← ДОБАВИТЬ сохранение цены
      },
    });

    return fillDto(MediaRdo, media);
  } catch (e) {
    console.error(e);
    throw new NotFoundException('Member not found');
  }
}
```

**Важно:** Использовать значение по умолчанию 400, если цена не передана.

---

### Шаг 4: Обновить DTO для выступлений

#### 4.1. Обновить `src/speech/dto/create-speech.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';

export class CreateSpeechDto {
  @ApiProperty({ title: 'Name', example: 'The last speech', required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ title: 'Flow ID', example: 'dfjaskfl3424lfa34' })
  @IsString()
  flowId: string;

  @ApiPropertyOptional({
    title: 'Package price',
    example: 2000,
    description: 'Price for full photo set of this speech',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  packagePrice?: number; // ← ДОБАВИТЬ это поле

  @ApiPropertyOptional({
    title: 'Is group',
    example: false,
    description: 'Whether this is a group performance',
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean; // ← ДОБАВИТЬ это поле
}
```

#### 4.2. Обновить `src/speech/dto/update-speech.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateSpeechDto } from './create-speech.dto';

export class UpdateSpeechDto extends PartialType(CreateSpeechDto) {
  // Наследует все поля из CreateSpeechDto, включая packagePrice и isGroup
  // Все поля опциональны благодаря PartialType
}
```

---

### Шаг 5: Обновить RDO для выступлений

#### 5.1. Обновить `src/speech/rdo/speech.rdo.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { MemberRdo } from 'src/member/rdo/member.rdo';

export class SpeechRdo {
  @ApiProperty({ title: 'ID', example: 'klkjfdlskjadsf1234' })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({ title: 'Name', example: 'The last speech', required: false })
  @IsOptional()
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ title: 'Flow ID', example: 'dfjaskfl3424lfa34' })
  @IsString()
  @Expose()
  flowId: string;

  @ApiProperty({ title: 'Members', type: [MemberRdo] })
  @Expose()
  members: MemberRdo;

  @ApiPropertyOptional({
    title: 'Package price',
    example: 2000,
    description: 'Price for full photo set of this speech',
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  packagePrice?: number; // ← ДОБАВИТЬ это поле
}
```

**Важно:** Поле `isGroup` может храниться в `Member` или `SpeechMember`, в зависимости от структуры БД. Проверьте вашу схему Prisma.

---

### Шаг 6: Обновить сервис для сохранения цен выступлений

#### 6.1. Обновить `src/speech/speech.service.ts`

```typescript
async createSpeech(dto: CreateSpeechDto): Promise<SpeechRdo> {
  const speech = await this.prisma.speech.create({
    data: {
      name: dto.name,
      flowId: dto.flowId,
      packagePrice: dto.packagePrice, // ← ДОБАВИТЬ сохранение цены
      // isGroup может храниться в другом месте, в зависимости от схемы
    },
  });

  return fillDto(SpeechRdo, speech);
}

async updateSpeech(id: string, dto: UpdateSpeechDto): Promise<SpeechRdo> {
  const speech = await this.prisma.speech.update({
    where: { id },
    data: {
      ...(dto.name && { name: dto.name }),
      ...(dto.flowId && { flowId: dto.flowId }),
      ...(dto.packagePrice !== undefined && { packagePrice: dto.packagePrice }), // ← ДОБАВИТЬ
      // ... другие поля
    },
  });

  return fillDto(SpeechRdo, speech);
}
```

---

### Шаг 7: Проверить схему базы данных

#### 7.1. Проверить `prisma/schema.prisma`

Убедитесь, что поля существуют в БД:

```prisma
model Media {
  id              String   @id @default(cuid())
  // ... другие поля
  individualPrice Decimal? @db.Decimal(10, 2) // ← Должно быть
  
  @@map("media")
}

model Speech {
  id           String   @id @default(cuid())
  // ... другие поля
  packagePrice Decimal? @db.Decimal(10, 2) // ← Должно быть
  
  @@map("speeches")
}

// Если isGroup хранится в SpeechMember:
model SpeechMember {
  id      String  @id @default(cuid())
  // ... другие поля
  isGroup Boolean @default(false) // ← Должно быть
  
  @@map("speech_members")
}
```

#### 7.2. Создать миграцию (если поля отсутствуют)

```bash
# Если поля отсутствуют в БД, создать миграцию:
npx prisma migrate dev --name add_price_fields
```

---

### Шаг 8: Обновить сериализацию

#### 8.1. Убедиться, что `individualPrice` возвращается в запросах медиа

Проверить все места, где возвращаются медиа:
- `GET /member/{id}/media` - должен возвращать `individualPrice`
- `GET /speech/{id}` - медиа в members должны иметь `individualPrice`
- `GET /event/{id}` - медиа должны иметь `individualPrice`

#### 8.2. Убедиться, что `packagePrice` возвращается в запросах выступлений

Проверить все места, где возвращаются выступления:
- `GET /speech/{id}` - должен возвращать `packagePrice`
- `GET /speech` - список выступлений должен включать `packagePrice`

---

## Важные моменты

### 1. Совместимость с фронтендом

**Проблема:** Фронтенд отправляет `price` для медиа, но мы добавляем `individualPrice`.

**Решение варианта А (рекомендуется):** Обновить фронтенд, чтобы отправлял `individualPrice`:
```typescript
// src/services/apiClient.ts
const requestData = {
  memberId: String(memberId),
  individualPrice: price, // ← Изменить с "price" на "individualPrice"
  file: fileBase64,
  // ...
};
```

**Решение варианта Б:** Принимать оба поля на бэкенде:
```typescript
export class AddMediaDto {
  memberId: string;
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number; // Для совместимости со старым фронтендом
  
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  individualPrice?: number; // Новое поле
  
  // В сервисе использовать: individualPrice || price || 400
}
```

### 2. Значения по умолчанию

- **Для медиа:** Если `individualPrice` не указан → использовать 400
- **Для выступлений:** Если `packagePrice` не указан → может быть `null` (нет комплекта)

### 3. Валидация

- Цены должны быть >= 0
- Использовать `@Min(0)` декоратор
- Проверять типы данных на входе

---

## Чеклист для бэкенда:

### Медиа:
- [ ] Добавить `individualPrice?: number` в `AddMediaDto`
- [ ] Обновить `MediaService.addMedia` для приема и сохранения `individualPrice`
- [ ] Добавить `individualPrice?: number` в `MediaRdo`
- [ ] Обновить контроллер (если нужно) для передачи `individualPrice` в сервис
- [ ] Убедиться, что `individualPrice` возвращается во всех запросах медиа
- [ ] Проверить схему БД - поле `individualPrice` в таблице `media`
- [ ] Протестировать создание медиа с ценой
- [ ] Протестировать создание медиа без цены (должна использоваться 400)

### Выступления:
- [ ] Добавить `packagePrice?: number` и `isGroup?: boolean` в `CreateSpeechDto`
- [ ] `UpdateSpeechDto` автоматически наследует эти поля (благодаря `PartialType`)
- [ ] Обновить `SpeechService.createSpeech` для сохранения `packagePrice` и `isGroup`
- [ ] Обновить `SpeechService.updateSpeech` для сохранения `packagePrice` и `isGroup`
- [ ] Добавить `packagePrice?: number` в `SpeechRdo`
- [ ] Убедиться, что `packagePrice` возвращается во всех запросах выступлений
- [ ] Проверить схему БД - поле `packagePrice` в таблице `speeches`
- [ ] Проверить схему БД - поле `isGroup` (где оно хранится?)
- [ ] Протестировать создание выступления с ценой
- [ ] Протестировать обновление выступления с ценой

### Общее:
- [ ] Создать миграцию БД (если поля отсутствуют)
- [ ] Обновить Swagger документацию
- [ ] Протестировать API через Postman/Swagger
- [ ] Проверить, что фронтенд получает цены в ответах

---

## Тестирование

### Тест 1: Создание медиа с ценой
```bash
POST /media
{
  "memberId": "test_member_id",
  "individualPrice": 500,
  "file": "base64...",
  "fileName": "photo.jpg",
  "fileType": "image/jpeg"
}

# Ожидаемый результат:
# - Медиа создано
# - individualPrice = 500 сохранен в БД
# - В ответе возвращается individualPrice: 500
```

### Тест 2: Создание медиа без цены
```bash
POST /media
{
  "memberId": "test_member_id",
  "file": "base64...",
  "fileName": "photo.jpg",
  "fileType": "image/jpeg"
}

# Ожидаемый результат:
# - Медиа создано
# - individualPrice = 400 (значение по умолчанию)
# - В ответе возвращается individualPrice: 400
```

### Тест 3: Создание выступления с ценой
```bash
POST /speech
{
  "name": "Test Speech",
  "flowId": "test_flow_id",
  "packagePrice": 2000,
  "isGroup": false
}

# Ожидаемый результат:
# - Выступление создано
# - packagePrice = 2000 сохранен в БД
# - В ответе возвращается packagePrice: 2000
```

### Тест 4: Получение медиа
```bash
GET /member/{id}/media

# Ожидаемый результат:
# - В массиве медиа у каждого элемента есть individualPrice
```

### Тест 5: Получение выступления
```bash
GET /speech/{id}

# Ожидаемый результат:
# - В ответе есть packagePrice
```

---

## После исправления

После того, как бэкенд будет исправлен:

1. ✅ Цены будут сохраняться в БД при создании/обновлении в админке
2. ✅ Цены будут возвращаться в ответах API
3. ✅ Фронтенд сможет использовать цены для расчета суммы заказа
4. ✅ Бэкенд сможет рассчитывать сумму заказа на основе цен из БД (см. `PRICE_SECURITY_RECOMMENDATIONS.md`)

---

## Связанные документы

- `PRICE_SECURITY_RECOMMENDATIONS.md` - Безопасная реализация расчета цен в заказах
- `BACKEND_RECOMMENDATIONS.md` - Поддержка обработанных фото в заказах
- `PRICE_FIELDS_ADDED.md` - Что было добавлено на фронтенде

---

## Примечания

1. **Обратная совместимость:** Если есть старые данные без цен, нужно решить, использовать ли значения по умолчанию или выбросить ошибку.

2. **Миграция данных:** Если в БД уже есть медиа/выступления без цен, можно:
   - Установить значения по умолчанию (400 для медиа, NULL для выступлений)
   - Или оставить как есть и обрабатывать на уровне приложения

3. **Типы данных:** Использовать `Decimal` для цен в БД для точности финансовых расчетов.

4. **Валидация на фронтенде:** Фронтенд уже отправляет правильные данные, проблема только в том, что бэкенд их не принимает/не возвращает.
