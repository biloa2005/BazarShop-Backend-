import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service.js';
import { StatutCompte } from '../../generated/prisma/client.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: payload.sub },
      select: {
        id_utilisateur: true,
        email: true,
        role: true,
        statut_compte: true,
      },
    });

    if (
      !utilisateur ||
      utilisateur.statut_compte !== StatutCompte.ACTIF
    ) {
      throw new UnauthorizedException('Session invalide');
    }

    // On récupère le rôle actuel en base, pas seulement celui du JWT.
    return {
      id: utilisateur.id_utilisateur,
      email: utilisateur.email,
      role: utilisateur.role,
    };
  }
}