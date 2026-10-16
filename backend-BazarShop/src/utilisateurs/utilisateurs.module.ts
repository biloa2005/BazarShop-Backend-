import { Module } from '@nestjs/common';
import { UtilisateursController } from './utilisateurs.controller.js';

@Module({
  controllers: [UtilisateursController]
})
export class UtilisateursModule {}
