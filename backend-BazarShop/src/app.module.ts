import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UtilisateursService } from './utilisateurs/utilisateurs.service.js';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module.js';

@Module({
  imports: [UtilisateursModule],
  controllers: [AppController],
  providers: [AppService, UtilisateursService],
})
export class AppModule {}