import { Module } from '@nestjs/common';
import { UtilisateurController } from './utilisateurs.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UtilisateurService } from './utilisateurs.service.js';


@Module({
  controllers: [UtilisateurController],
  providers: [UtilisateurService, PrismaService],
  exports: [UtilisateurService],
})
export class UtilisateursModule {}
