import { Module } from '@nestjs/common';
import { AnnoncesController } from './annonces.controller.js';
import { AnnoncesService } from './annonces.service.js';

@Module({
  controllers: [AnnoncesController],
  providers: [AnnoncesService]
})
export class AnnoncesModule {}
