import { Module } from '@nestjs/common';
import { FavorisService } from './favoris.service.js';

@Module({
  providers: [FavorisService]
})
export class FavorisModule {}
