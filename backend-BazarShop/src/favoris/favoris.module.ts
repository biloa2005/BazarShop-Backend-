import { Module } from '@nestjs/common';
import { FavorisService } from './favoris.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { FavorisController } from './favoris.controller.js';

@Module({
  imports:[PrismaModule,
    AuthModule
  ],
  controllers:[FavorisController],
  providers: [FavorisService],
  exports:[FavorisService]
})
export class FavorisModule {}
