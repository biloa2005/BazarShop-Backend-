import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { UtilisateursModule } from './utilisateurs/utilisateurs.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AnnoncesModule } from './annonces/annonces.module.js';
import { FavorisController } from './favoris/favoris.controller.js';
import { FavorisModule } from './favoris/favoris.module.js';


@Module({
  imports: [UtilisateursModule,PrismaModule, AuthModule, AnnoncesModule, FavorisModule],
  controllers: [AppController, FavorisController],
  providers: [AppService,],
})
export class AppModule {}