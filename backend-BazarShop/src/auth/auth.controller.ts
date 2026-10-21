import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { InscriptionDto } from './dto/inscription.dto.js';
import { ConnexionDto } from './dto/connexion.dto.js';

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
}