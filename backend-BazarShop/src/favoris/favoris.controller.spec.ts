import { Test, TestingModule } from '@nestjs/testing';
import { FavorisController } from './favoris.controller.js';

describe('FavorisController', () => {
  let controller: FavorisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavorisController],
    }).compile();

    controller = module.get<FavorisController>(FavorisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
