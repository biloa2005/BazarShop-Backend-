import { Module } from '@nestjs/common';

import { MessagerieController } from './messagerie.controller.js';
import { MessagerieService } from './messagerie.service.js';
import { MessagerieGateway } from './messagerie.gateway.js';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [AuthModule, PrismaModule,  JwtModule,],
  controllers: [MessagerieController],
  providers: [
    MessagerieService,
    MessagerieGateway,
  ],
  exports: [MessagerieService],
})
export class MessagerieModule {}