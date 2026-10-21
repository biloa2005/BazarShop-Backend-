
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';
import { InscriptionDto } from './dto/inscription.dto.js';
import { ConnexionDto } from './dto/connexion.dto.js';
import {
  Role,
  StatutCompte,
} from '../generated/prisma/client.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * INSCRIPTION
   * - Vérifie si l'email existe déjà.
   * - Hache le mot de passe avec bcrypt.
   * - Crée un utilisateur avec le rôle et le statut
   *   par défaut définis dans Prisma.
   * - Ne retourne jamais le mot de passe.
   */
  async inscrire(dto: InscriptionDto) {
    const email = dto.email.trim().toLowerCase();

    const utilisateurExistant =
      await this.prisma.utilisateur.findUnique({
        where: { email },
      });

    if (utilisateurExistant) {
      throw new ConflictException(
        'Cette adresse email est déjà utilisée.',
      );
    }

    const motDePasseHash = await bcrypt.hash(
      dto.mot_de_passe,
      12,
    );

    try {
      const utilisateur =
        await this.prisma.utilisateur.create({
          data: {
            nom: dto.nom.trim(),
            prenom: dto.prenom.trim(),
            email,
            mot_de_passe: motDePasseHash,

            // Ne pas accepter role ou statut depuis le DTO.
            // Prisma applique les valeurs par défaut.
          },
          select: {
            id_utilisateur: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            role: true,
            statut_compte: true,
            date_inscription: true,
          },
        });

      return {
        message: 'Inscription réussie.',
        utilisateur,
      };
    } catch (error: unknown) {
      // P2002 = violation d'une contrainte unique Prisma.
      // Cela couvre notamment deux inscriptions simultanées
      // avec la même adresse email.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Cette adresse email est déjà utilisée.',
        );
      }

      throw error;
    }
  }

  /**
   * CONNEXION
   * - Recherche l'utilisateur par email.
   * - Vérifie le mot de passe avec bcrypt.
   * - Refuse les comptes non actifs.
   * - Génère un JWT contenant l'identifiant et le rôle.
   */
  async connecter(dto: ConnexionDto) {
    const email = dto.email.trim().toLowerCase();

    const utilisateur =
      await this.prisma.utilisateur.findUnique({
        where: { email },
      });

    // Même message pour un email inconnu et un mot de passe faux.
    if (
      !utilisateur ||
      !(await bcrypt.compare(
        dto.mot_de_passe,
        utilisateur.mot_de_passe,
      ))
    ) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect.',
      );
    }

    if (
      utilisateur.statut_compte !== StatutCompte.ACTIF
    ) {
      throw new ForbiddenException(
        'Votre compte n’est pas actif.',
      );
    }

    const payload = {
      sub: utilisateur.id_utilisateur,
      role: utilisateur.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      message: 'Connexion réussie.',
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      utilisateur: {
        id: utilisateur.id_utilisateur,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        role: utilisateur.role,
        statut_compte: utilisateur.statut_compte,
      },
    };
  }

  /**
   * PROFIL CONNECTÉ
   * - Recherche l'utilisateur à partir de son identifiant JWT.
   * - Retourne uniquement les informations publiques.
   * - Permet de récupérer le rôle et le statut actuels.
   */
  async obtenirProfil(idUtilisateur: string) {
    const utilisateur =
      await this.prisma.utilisateur.findUnique({
        where: {
          id_utilisateur: idUtilisateur,
        },
        select: {
          id_utilisateur: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          role: true,
          statut_compte: true,
          date_inscription: true,
        },
      });

    if (!utilisateur) {
      throw new UnauthorizedException(
        'Utilisateur introuvable.',
      );
    }

    if (
      utilisateur.statut_compte !== StatutCompte.ACTIF
    ) {
      throw new ForbiddenException(
        'Votre compte n’est pas actif.',
      );
    }

    return utilisateur;
  }
}
