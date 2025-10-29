# Рекомендации для бэкенда: Безопасная реализация цен в заказах

## ⚠️ Важно: Безопасность

**НЕ используйте `totalAmount` от фронтенда для расчета суммы платежа без валидации!**

Пользователь может изменить запрос и отправить меньшую сумму, что приведет к финансовым потерям.

---

## Текущая проблема

Сейчас бэкенд:
1. ❌ Игнорирует `totalAmount`, переданный фронтендом
2. ❌ Всегда считает цену как `количество_медиа * 400` (хардкод)
3. ❌ Не использует цены из базы данных (`individualPrice` для медиа, `packagePrice` для выступлений)

---

## Решение: Расчет цен на бэкенде

### Принцип: "Источник истины — база данных"

Все цены должны рассчитываться на бэкенде на основе данных из БД. Фронтенд может отправлять `totalAmount` для удобства, но это поле **не используется** для расчета суммы платежа.

---

## 1. Обновить `src/media/dto/buy-medias.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNumber, Min } from 'class-validator';

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

  @ApiPropertyOptional({
    title: 'Total amount (for frontend reference only, not used for payment)',
    example: 2000,
    description: 'This field is ignored for security reasons. Price is calculated on backend.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number; // Принимаем, но НЕ используем для расчета
}
```

---

## 2. Обновить `src/media/media.service.ts`

### 2.1. Добавить метод расчета суммы заказа

```typescript
/**
 * Рассчитывает сумму заказа на основе цен из БД
 * 
 * Логика:
 * - Если выбраны ВСЕ медиа выступления → используется packagePrice (комплект)
 * - Если выбраны НЕ ВСЕ медиа → суммируются individualPrice (поштучно)
 */
private async calculateOrderAmount(
  medias: Array<{
    id: string;
    individualPrice: number | null;
    member: {
      speech: {
        id: string;
        packagePrice: number | null;
      };
    };
  }>,
  requiresProcessing: string[],
): Promise<number> {
  // Группируем медиа по выступлениям
  const mediaBySpeech = new Map<
    string,
    Array<{
      id: string;
      individualPrice: number | null;
      requiresProcessing: boolean;
    }>
  >();

  medias.forEach(media => {
    const speechId = media.member.speech.id;
    if (!mediaBySpeech.has(speechId)) {
      mediaBySpeech.set(speechId, []);
    }
    mediaBySpeech.get(speechId)!.push({
      id: media.id,
      individualPrice: media.individualPrice,
      requiresProcessing: requiresProcessing.includes(media.id),
    });
  });

  let totalAmount = 0;

  // Рассчитываем цену для каждого выступления
  for (const [speechId, speechMedias] of mediaBySpeech) {
    const speech = medias.find(m => m.member.speech.id === speechId)!.member.speech;
    
    // Получаем общее количество медиа в выступлении
    const totalMediaInSpeech = await this.prisma.media.count({
      where: {
        member: {
          speechId: speech.id,
        },
      },
    });

    // Проверяем, выбраны ли ВСЕ медиа выступления (комплект)
    const isFullSet = speechMedias.length === totalMediaInSpeech && totalMediaInSpeech > 0;

    if (isFullSet && speech.packagePrice) {
      // Комплект: используем packagePrice
      totalAmount += Number(speech.packagePrice);
    } else {
      // Поштучно: суммируем individualPrice
      speechMedias.forEach(media => {
        const price = media.individualPrice 
          ? Number(media.individualPrice) 
          : 500; // Fallback цена (можно выбросить ошибку вместо fallback)
        
        if (!price || price <= 0) {
          throw new BadRequestException(
            `Price not set for media ${media.id}. Please set individualPrice in database.`
          );
        }
        
        totalAmount += price;
      });
    }
  }

  return totalAmount;
}
```

### 2.2. Обновить метод `buyMedia`

```typescript
import { BadRequestException } from '@nestjs/common';

async buyMedia(
  medias: string[],
  userId: number,
  requiresProcessing?: string[],
  totalAmount?: number, // Принимаем, но не используем для расчета
): Promise<SuccessPaymentLinkRdo> {
  try {
    // Получаем медиа с их ценами из базы данных
    const mediasFound = await this.prisma.media.findMany({
      where: {
        id: {
          in: medias,
        },
      },
      select: { 
        id: true,
        individualPrice: true, // ← Взять цену из БД
        memberId: true,
      },
      include: {
        member: {
          include: {
            speech: {
              select: {
                id: true,
                packagePrice: true, // ← Взять цену комплекта из БД
              },
            },
          },
        },
      },
    });

    if (mediasFound.length === 0) {
      throw new NotFoundException('Media not found');
    }

    // Проверяем, что все медиа найдены
    if (mediasFound.length !== medias.length) {
      const foundIds = mediasFound.map(m => m.id);
      const missingIds = medias.filter(id => !foundIds.includes(id));
      throw new NotFoundException(
        `Some media not found: ${missingIds.join(', ')}`
      );
    }

    // ⚠️ БЕЗОПАСНОСТЬ: Рассчитываем сумму на бэкенде
    const calculatedAmount = await this.calculateOrderAmount(
      mediasFound,
      requiresProcessing || [],
    );

    // ВСЕГДА используем рассчитанную сумму (игнорируем totalAmount от фронтенда)
    const finalAmount = calculatedAmount;

    // Опционально: Логируем несоответствие для мониторинга
    if (totalAmount !== undefined && Math.abs(totalAmount - calculatedAmount) > 0.01) {
      console.warn(
        `[SECURITY] Price mismatch detected for user ${userId}: ` +
        `frontend sent ${totalAmount}, backend calculated ${calculatedAmount}. ` +
        `Using backend calculated amount: ${calculatedAmount}`
      );
      // Можно также отправить уведомление в систему мониторинга
      // await this.notificationService.sendSecurityAlert({ userId, totalAmount, calculatedAmount });
    }

    const url = await this.paymentService.generatePaymentUrl(
      finalAmount, // ← ВСЕГДА используем рассчитанную сумму
      userId,
      mediasFound,
      `Покупка ${mediasFound.length} медиа`,
      requiresProcessing || [],
    );

    return fillDto(SuccessPaymentLinkRdo, { success: true, url });
  } catch (e) {
    console.error('Error in buyMedia:', e);
    if (e instanceof NotFoundException || e instanceof BadRequestException) {
      throw e;
    }
    throw new NotFoundException('Media not found');
  }
}
```

---

## 3. Обновить `src/media/media.controller.ts`

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
    dto.requiresProcessing,
    dto.totalAmount, // Передаем, но сервис его игнорирует
  );
}
```

---

## 4. Убедиться, что `PaymentService.generatePaymentUrl` использует правильную сумму

`PaymentService` уже получает `amount` как параметр. Убедитесь, что он сохраняет эту сумму в `Payment` без изменений:

```typescript
async generatePaymentUrl(
  amount: number, // ← Это уже правильная сумма, рассчитанная на бэкенде
  userId: number,
  medias: { id: string }[],
  description: string,
  requiresProcessing?: string[],
): Promise<string> {
  // Создаем Payment с правильной суммой
  const payment = await this.prisma.payment.create({
    data: {
      amount: amount, // ← Сохраняем как есть
      userId,
      description,
      // ... остальные поля
    },
  });

  // ... остальной код генерации URL
}
```

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

**Важно:** Поле `totalAmount` отправляется фронтендом для удобства, но **не используется** для расчета суммы платежа. Бэкенд рассчитывает сумму на основе цен из БД.

---

## Логика расчета цен на бэкенде:

### 1. Комплект фото (выбраны все фото выступления):
- Проверка: `количество_выбранных_медиа === общее_количество_медиа_в_выступлении`
- Цена: `packagePrice` из таблицы `Speech`
- Fallback: Если `packagePrice` не установлен, можно выбросить ошибку или использовать значение по умолчанию (2000 ₽)

### 2. Поштучные фото с обработкой:
- Проверка: `количество_выбранных_медиа < общее_количество_медиа_в_выступлении`
- Цена: Сумма `individualPrice` каждого выбранного медиа из таблицы `Media`
- Fallback: Если `individualPrice` не установлен, можно выбросить ошибку или использовать значение по умолчанию (500 ₽)

---

## Чеклист для бэкенда:

- [ ] Добавить `totalAmount` в `BuyMediasDto` (опциональное поле, только для удобства фронтенда)
- [ ] Добавить метод `calculateOrderAmount` в `MediaService`
- [ ] Обновить `MediaService.buyMedia` для получения `individualPrice` и `packagePrice` из БД
- [ ] Обновить `MediaService.buyMedia` для расчета суммы на бэкенде (игнорировать `totalAmount`)
- [ ] Добавить логирование несоответствий цен для мониторинга
- [ ] Обновить `MediaController` для передачи `totalAmount` (но он не будет использоваться)
- [ ] Убедиться, что `PaymentService.generatePaymentUrl` использует переданную сумму без изменений
- [ ] Протестировать создание заказа с комплектом (должна использоваться `packagePrice` из БД)
- [ ] Протестировать создание заказа с поштучными фото (должна использоваться сумма `individualPrice` из БД)
- [ ] Протестировать, что сумма сохраняется правильно в `Payment`
- [ ] Протестировать сценарий, когда пользователь пытается отправить неверную сумму (должна использоваться правильная сумма)
- [ ] (Опционально) Добавить уведомления администратору при обнаружении несоответствий

---

## Важные моменты безопасности:

1. ✅ **Всегда рассчитывать сумму на бэкенде** — цена берется из базы данных
2. ✅ **Игнорировать `totalAmount` от фронтенда** — использовать только для мониторинга
3. ✅ **Логировать несоответствия** — для выявления попыток подмены
4. ✅ **Валидация существования медиа** — проверять, что все медиа найдены
5. ✅ **Проверка наличия цен** — если цена не установлена в БД, выбросить ошибку или использовать fallback

---

## Обработка ошибок:

### Если цена не установлена в БД:

```typescript
// Вариант 1: Выбросить ошибку (рекомендуется)
if (!media.individualPrice || media.individualPrice <= 0) {
  throw new BadRequestException(
    `Price not set for media ${media.id}. Please set individualPrice in database.`
  );
}

// Вариант 2: Использовать fallback (менее безопасно)
const price = media.individualPrice || 500;
```

### Если комплект выбран, но packagePrice не установлен:

```typescript
if (isFullSet && !speech.packagePrice) {
  throw new BadRequestException(
    `Package price not set for speech ${speech.id}. Please set packagePrice in database.`
  );
}
```

---

## Мониторинг и алерты:

Рекомендуется настроить систему мониторинга для отслеживания несоответствий цен:

```typescript
// Пример интеграции с системой мониторинга
if (totalAmount !== undefined && Math.abs(totalAmount - calculatedAmount) > 0.01) {
  // Отправить алерт администратору
  await this.monitoringService.sendAlert({
    type: 'PRICE_MISMATCH',
    userId,
    frontendAmount: totalAmount,
    backendAmount: calculatedAmount,
    medias,
    timestamp: new Date(),
  });
}
```

---

## Тестирование:

### Тест 1: Комплект фото
```typescript
// Выбраны все медиа выступления (например, 5 из 5)
// Ожидаемый результат: используется packagePrice из БД
```

### Тест 2: Поштучные фото
```typescript
// Выбраны не все медиа выступления (например, 3 из 5)
// Ожидаемый результат: используется сумма individualPrice каждого медиа
```

### Тест 3: Попытка подмены цены
```typescript
// Отправить запрос с totalAmount = 100 вместо реальной суммы 2000
// Ожидаемый результат: используется правильная сумма 2000, запрос логируется
```

---

## Примечания:

1. **Определение "комплекта"**: Для определения того, выбраны ли все фото выступления, нужно сравнивать количество выбранных медиа с общим количеством медиа в выступлении. Это делается через запрос к базе данных.

2. **Производительность**: Запрос для подсчета общего количества медиа в выступлении можно оптимизировать, используя кэширование или включая эту информацию в запрос медиа.

3. **Fallback цены**: Если решено использовать fallback цены (500 ₽ для поштучных, 2000 ₽ для комплекта), убедитесь, что это задокументировано и согласовано с бизнес-логикой.

---

## Итог:

✅ **Безопасно**: Использовать только рассчитанную на бэкенде сумму  
✅ **Небезопасно**: Использовать `totalAmount` от фронтенда для расчета платежа  
✅ **Мониторинг**: Логировать несоответствия для выявления проблем  
✅ **Валидация**: Проверять наличие цен в БД перед созданием заказа

Эти изменения обеспечат безопасную работу с ценами в заказах и предотвратят финансовые потери из-за подмены сумм.

