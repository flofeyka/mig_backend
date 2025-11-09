import { Test, TestingModule } from '@nestjs/testing';
import { BookingRequestController } from './booking-request.controller';

describe('BookingRequestController', () => {
  let controller: BookingRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingRequestController],
    }).compile();

    controller = module.get<BookingRequestController>(BookingRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
