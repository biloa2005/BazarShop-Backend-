import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MessagerieService } from './messagerie.service.js';
import { CreerConversationDto } from './dto/creer-conversation.dto.js';
import { EnvoyerMessageDto } from './dto/envoyer-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('messagerie')
@UseGuards(JwtAuthGuard)
export class MessagerieController {
  constructor(
    private readonly messagerieService: MessagerieService,
  ) {}

  // Créer ou retrouver une conversation
  @Post('conversations')
  creerConversation(
    @Req() req: any,
    @Body() dto: CreerConversationDto,
  ) {
    return this.messagerieService.creerConversation(
      req.user.id,
      dto,
    );
  }

  // Récupérer les conversations de l'utilisateur connecté
  @Get('conversations')
  listerConversations(@Req() req: any) {
    return this.messagerieService.listerConversations(
      req.user.id,
    );
  }

  // Récupérer les messages d'une conversation
  @Get('conversations/:id/messages')
  historiqueMessages(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messagerieService.historiqueMessages(
      id,
      req.user.id,
    );
  }

  // Envoyer un message par HTTP
  @Post('conversations/:id/messages')
  envoyerMessage(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EnvoyerMessageDto,
  ) {
    return this.messagerieService.envoyerMessage(
      id,
      req.user.id,
      dto,
    );
  }

  // Marquer les messages comme lus
  @Patch('conversations/:id/lu')
  marquerCommeLu(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.messagerieService.marquerCommeLu(
      id,
      req.user.id,
    );
  }
}