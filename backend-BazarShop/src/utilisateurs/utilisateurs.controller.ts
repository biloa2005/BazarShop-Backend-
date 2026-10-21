import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UtilisateurService } from './utilisateurs.service.js';
import { CreateUtilisateurDto } from './create-utilisateur.dto.js';
import { UpdateUtilisateurDto } from './update-utilisateur.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
//gestion des utilisateur  (role et authentification pour admin)
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(Role.ADMIN)
@Controller('utilisateurs')
export class UtilisateurController {
  constructor(private readonly utilisateurService: UtilisateurService) {}

  @Post()
  create(@Body() createUtilisateurDto: CreateUtilisateurDto) {
    return this.utilisateurService.create(createUtilisateurDto);
  }

  @Get()
  findAll() {
    return this.utilisateurService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.utilisateurService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUtilisateurDto: UpdateUtilisateurDto) {
    return this.utilisateurService.update(id, updateUtilisateurDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.utilisateurService.remove(id);
  }
}
