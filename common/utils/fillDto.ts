import { plainToClass } from 'class-transformer';

export function fillDto<T>(dtoClass: new () => T, plainObj: object): T {
  return plainToClass(dtoClass, plainObj, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  });
}
