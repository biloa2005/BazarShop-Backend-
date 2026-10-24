
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { Role } from '../generated/prisma/client.js';

import { AnnoncesService } from './annonces.service.js';
import { CreerAnnonceDto } from './creer-annonces.dto.js';
import { ModifierAnnonceDto } from './modifier-annonces.dto.js';
import { FiltrerAnnonceDto } from './filtrer-annonce.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface RequeteAuthentifiee extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@Controller('annonces')
export class AnnoncesController {
  constructor(
    private readonly annoncesService: AnnoncesService,
  ) {}

  // GET /annonces
  // Consultation publique des annonces actives.
  @Get()
  lister(@Query() dto: FiltrerAnnonceDto) {
    return this.annoncesService.lister(dto);
  }

  // GET /annonces/mes
  // Seul l'utilisateur connecté peut consulter ses annonces.
  @Get('mes')
  @UseGuards(JwtAuthGuard)
  mesAnnonces(@Req() req: RequeteAuthentifiee) {
    return this.annoncesService.mesAnnonces(req.user.id);
  }

  // GET /annonces/:id
  @Get(':id')
  trouverParId(@Param('id') id: string) {
    return this.annoncesService.trouverParId(id);
  }

  // POST /annonces
  // Seul un utilisateur connecté peut créer une annonce.
  @Post()
  @UseGuards(JwtAuthGuard)
  creer(
    @Body() dto: CreerAnnonceDto,
    @Req() req: RequeteAuthentifiee,
  ) {
    return this.annoncesService.creer(
      req.user.id,
      dto,
    );
  }

  // PATCH /annonces/:id
  // Seul le propriétaire peut modifier son annonce.
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  modifier(
    @Param('id') id: string,
    @Body() dto: ModifierAnnonceDto,
    @Req() req: RequeteAuthentifiee,
  ) {
    return this.annoncesService.modifier(
      id,
      req.user.id,
      dto,
    );
  }

  // DELETE /annonces/:id
  // Seul le propriétaire peut supprimer son annonce.
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  supprimer(
    @Param('id') id: string,
    @Req() req: RequeteAuthentifiee,
  ) {
    return this.annoncesService.supprimer(
      id,
      req.user.id,
    );
  }
}
