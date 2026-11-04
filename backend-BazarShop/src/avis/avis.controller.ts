
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { AvisService } from './avis.service.js';
import { CreerAvisDto } from './creer-avis.dto.js';
import { ModifierAvisDto } from './modifier-avis.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

type RequeteAuthentifiee = Request & {
  user: {
    id: string;
  };
};

@Controller('avis')
export class AvisController {
  constructor(
    private readonly avisService: AvisService,
  ) {}

  // POST /avis/:idDestinataire
  // Donner un avis à un utilisateur.
  @Post(':idDestinataire')
  @UseGuards(JwtAuthGuard)
  creer(
    @Param('idDestinataire') idDestinataire: string,
    @Body() dto: CreerAvisDto,
    @Req() req: RequeteAuthentifiee,
  ) {
    return this.avisService.creer(
      req.user.id,
      idDestinataire,
      dto,
    );
  }

  // GET /avis/utilisateur/:idUtilisateur
  // Consulter les avis reçus.
  @Get('utilisateur/:idUtilisateur')
  listerRecus(
    @Param('idUtilisateur') idUtilisateur: string,
  ) {
    return this.avisService.listerRecus(idUtilisateur);
  }

  // GET /avis/utilisateur/:idUtilisateur/statistiques
  // Consulter la moyenne et le nombre d'avis.
  @Get('utilisateur/:idUtilisateur/statistiques')
  obtenirStatistiques(
    @Param('idUtilisateur') idUtilisateur: string,
  ) {
    return this.avisService.obtenirStatistiques(idUtilisateur);
  }

  // GET /avis/mes-avis
  // Consulter les avis publiés par le compte connecté.
  @Get('mes-avis')
  @UseGuards(JwtAuthGuard)
  listerDonnes(@Req() req: RequeteAuthentifiee) {
    return this.avisService.listerDonnes(req.user.id);
  }

  // PATCH /avis/:idAvis
  // Modifier son propre avis.
  @Patch(':idAvis')
  @UseGuards(JwtAuthGuard)
  modifier(
    @Param('idAvis', ParseIntPipe) idAvis: number,
    @Body() dto: ModifierAvisDto,
    @Req() req: RequeteAuthentifiee,
  ) {
    return this.avisService.modifier(
      idAvis,
      req.user.id,
      dto,
    );
  }

  // DELETE /avis/:idAvis
  // Supprimer son propre avis.
  @Delete(':idAvis')
  @UseGuards(JwtAuthGuard)
  supprimer(
    @Param('idAvis', ParseIntPipe) idAvis: number,
    @Req() req: RequeteAuthentifiee,
  ) {
    return this.avisService.supprimer(
      idAvis,
      req.user.id,
    );
  }
}
