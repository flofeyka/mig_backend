import { Test, TestingModule } from '@nestjs/testing';
import { BookingRequestService } from './booking-request.service';

describe('BookingRequestService', () => {
  let service: BookingRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingRequestService],
    }).compile();

    service = module.get<BookingRequestService>(BookingRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
