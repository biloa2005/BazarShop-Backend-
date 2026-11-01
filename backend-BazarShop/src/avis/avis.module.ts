import { Module } from '@nestjs/common';
import { AvisService } from './avis.service.js';

@Module({
  providers: [AvisService]
})
export class AvisModule {}
