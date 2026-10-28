import { Test, TestingModule } from '@nestjs/testing';
import { FavorisService } from './favoris.service.js';

describe('FavorisService', () => {
  let service: FavorisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavorisService],
    }).compile();

    service = module.get<FavorisService>(FavorisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
