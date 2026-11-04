import { Module } from '@nestjs/common';

import { MessagerieController } from './messagerie.controller.js';
import { MessagerieService } from './messagerie.service.js';
import { MessagerieGateway } from './messagerie.gateway.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [MessagerieController],
  providers: [
    MessagerieService,
    MessagerieGateway,
  ],
  exports: [MessagerieService],
})
export class MessagerieModule {}