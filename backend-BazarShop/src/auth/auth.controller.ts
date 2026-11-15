import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { InscriptionDto } from './dto/inscription.dto.js';
import { ConnexionDto } from './dto/connexion.dto.js';
import { MotDePasseOublieDto } from './dto/mot-de-passe-oublie.dto.js';
import { ReinitialiserMotDePasseDto } from './dto/mot-de-passe.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('inscription')
  inscrire(@Body() dto: InscriptionDto) {
    return this.authService.inscrire(dto);
  }

  @Post('connexion')
  connecter(@Body() dto: ConnexionDto) {
    return this.authService.connecter(dto);
  }
  @Post('mot-de-passe-oublie')
motDePasseOublie(@Body() dto: MotDePasseOublieDto) {
  return this.authService.motDePasseOublie(dto);
}

@Post('reinitialiser-mot-de-passe')
reinitialiserMotDePasse(
  @Body() dto: ReinitialiserMotDePasseDto,
) {
  return this.authService.reinitialiserMotDePasse(dto);
}
}