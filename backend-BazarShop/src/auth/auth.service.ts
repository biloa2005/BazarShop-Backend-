
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Resend } from 'resend';

import { MotDePasseOublieDto } from './dto/mot-de-passe-oublie.dto.js';
import { ReinitialiserMotDePasseDto } from './dto/mot-de-passe.dto.js';

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
      expires_in: "15 min",
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

async reinitialiserMotDePasse(
  dto: ReinitialiserMotDePasseDto,
) {
  // Calculer l'empreinte du token reçu.
  const tokenHash = createHash('sha256')
    .update(dto.token)
    .digest('hex');

  const maintenant = new Date();

  // Rechercher la demande.
  const demande =
    await this.prisma.reinitialisationMotDePasse.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });

  // Vérifier que le token existe, n'a pas été utilisé
  // et n'est pas expiré.
  if (
    !demande ||
    demande.date_utilisation !== null ||
    demande.date_expiration <= maintenant
  ) {
    throw new BadRequestException(
      'Ce lien est invalide ou a expiré.',
    );
  }

  // Hacher le nouveau mot de passe.
  const nouveauHash = await bcrypt.hash(
    dto.nouveau_mot_de_passe,
    12,
  );

  // Modifier le mot de passe et consommer le token
  // dans une seule transaction.
  await this.prisma.$transaction(async (tx) => {
    const resultat =
      await tx.reinitialisationMotDePasse.updateMany({
        where: {
          id: demande.id,
          date_utilisation: null,
          date_expiration: {
            gt: maintenant,
          },
        },
        data: {
          date_utilisation: maintenant,
        },
      });

    // Empêche deux utilisations simultanées du même token.
    if (resultat.count !== 1) {
      throw new BadRequestException(
        'Ce lien est invalide ou a déjà été utilisé.',
      );
    }

    await tx.utilisateur.update({
      where: {
        id_utilisateur: demande.id_utilisateur,
      },
      data: {
        mot_de_passe: nouveauHash,
      },
    });

    // Révoquer les refresh tokens de l'utilisateur.
    await tx.refreshToken.updateMany({
      where: {
        id_utilisateur: demande.id_utilisateur,
        date_revocation: null,
      },
      data: {
        date_revocation: maintenant,
      },
    });
  });

  return {
    message: 'Votre mot de passe a été réinitialisé avec succès.',
  };
}


async motDePasseOublie(dto: MotDePasseOublieDto) {
  const email = dto.email.trim().toLowerCase();

  // Vérifier la configuration avant de créer une demande.
  const apiKey = process.env.RESEND_API_KEY;
  const frontendUrl = process.env.FRONTEND_URL;
  const emailFrom = process.env.EMAIL_FROM;

  if (!apiKey || !frontendUrl || !emailFrom) {
    throw new InternalServerErrorException(
      'Le service email est mal configuré.',
    );
  }

  const utilisateur = await this.prisma.utilisateur.findUnique({
    where: { email },
  });

  // Toujours retourner le même message, que le compte existe ou non.
  const reponse = {
    message:
      'Si cette adresse correspond à un compte, un email de réinitialisation sera envoyé.',
  };

  if (!utilisateur) {
    return reponse;
  }

  // Générer un token sécurisé de 32 octets.
  const token = randomBytes(32).toString('hex');

  // Enregistrer uniquement son empreinte SHA-256.
  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex');

  const maintenant = new Date();

  // Validité de 15 minutes.
  const expiration = new Date(
    maintenant.getTime() + 15 * 60 * 1000,
  );

  // Invalider les anciennes demandes non utilisées.
  await this.prisma.reinitialisationMotDePasse.updateMany({
    where: {
      id_utilisateur: utilisateur.id_utilisateur,
      date_utilisation: null,
    },
    data: {
      date_utilisation: maintenant,
    },
  });

  await this.prisma.reinitialisationMotDePasse.create({
    data: {
      token_hash: tokenHash,
      id_utilisateur: utilisateur.id_utilisateur,
      date_expiration: expiration,
    },
  });

  const lien =
    `${frontendUrl.replace(/\/$/, '')}` +
    `/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: utilisateur.email,
    subject: 'Réinitialisation de votre mot de passe BazarShop',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Mot de passe oublié ?</h2>

        <p>Bonjour,</p>

        <p>
          Vous avez demandé la réinitialisation de votre
          mot de passe BazarShop.
        </p>

        <p>
          Cliquez sur le bouton ci-dessous pour choisir
          un nouveau mot de passe.
        </p>

        <a href="${lien}"
           style="
             display:inline-block;
             padding:12px 20px;
             background:#2563eb;
             color:white;
             text-decoration:none;
             border-radius:6px;
           ">
          Réinitialiser mon mot de passe
        </a>

        <p>Ce lien expire dans 15 minutes.</p>

        <p>
          Si vous n'avez pas demandé cette réinitialisation,
          ignorez cet email.
        </p>
      </div>
    `,
  });

  if (error) {
    // Supprimer la demande si l'envoi échoue.
    await this.prisma.reinitialisationMotDePasse.delete({
      where: { token_hash: tokenHash },
    });

    throw new InternalServerErrorException(
      'Impossible d’envoyer l’email.',
    );
  }

  return reponse;
}

}
