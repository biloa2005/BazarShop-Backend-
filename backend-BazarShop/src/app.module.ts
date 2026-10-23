import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { UtilisateursModule } from './utilisateurs/utilisateurs.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AnnoncesModule } from './annonces/annonces.module.js';


@Module({
  imports: [UtilisateursModule,PrismaModule, AuthModule, AnnoncesModule],
  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule {}