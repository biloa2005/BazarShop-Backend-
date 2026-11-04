
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreerAvisDto } from './creer-avis.dto.js';
import { ModifierAvisDto } from './modifier-avis.dto.js';

@Injectable()
export class AvisService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // 1. Publier un seul avis sur un utilisateur.
  async creer(
    idAuteur: string,
    idDestinataire: string,
    dto: CreerAvisDto,
  ) {
    // Empêcher l'utilisateur de se noter lui-même.
    if (idAuteur === idDestinataire) {
      throw new BadRequestException(
        'Vous ne pouvez pas donner un avis sur vous-même.',
      );
    }

    // Vérifier que le destinataire existe.
    const destinataire = await this.prisma.utilisateur.findUnique({
      where: {
        id_utilisateur: idDestinataire,
      },
      select: {
        id_utilisateur: true,
      },
    });

    if (!destinataire) {
      throw new NotFoundException(
        'Utilisateur destinataire introuvable.',
      );
    }

    // Vérifier si cet auteur a déjà évalué ce destinataire.
   // Vérifier si cet auteur a déjà évalué ce destinataire.
  const avisExistant = await this.prisma.avis.findFirst({
    where: {
      id_auteur: idAuteur,
      id_destinataire: idDestinataire,
    },
  });

    if (avisExistant) {
      throw new ConflictException(
        'Vous avez déjà donné un avis à cet utilisateur. Vous pouvez modifier votre avis existant.',
      );
    }

    try {
      return await this.prisma.avis.create({
        data: {
          note: dto.note,
          commentaire: dto.commentaire?.trim() || null,
          id_auteur: idAuteur,
          id_destinataire: idDestinataire,
        },
        include: {
          auteur: {
            select: {
              id_utilisateur: true,
              nom: true,
              prenom: true,
            },
          },
          destinataire: {
            select: {
              id_utilisateur: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });
    } catch (erreur) {
      // La contrainte unique protège aussi contre deux requêtes simultanées.
      if (
        typeof erreur === 'object' &&
        erreur !== null &&
        'code' in erreur &&
        erreur.code === 'P2002'
      ) {
        throw new ConflictException(
          'Vous avez déjà donné un avis à cet utilisateur.',
        );
      }

      throw erreur;
    }
  }

  // 2. Consulter les avis reçus par un utilisateur.
  async listerRecus(idUtilisateur: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: {
        id_utilisateur: idUtilisateur,
      },
      select: {
        id_utilisateur: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return this.prisma.avis.findMany({
      where: {
        id_destinataire: idUtilisateur,
      },
      orderBy: {
        date_creation: 'desc',
      },
      include: {
        auteur: {
          select: {
            id_utilisateur: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  // 3. Consulter les avis publiés par un utilisateur.
  async listerDonnes(idUtilisateur: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: {
        id_utilisateur: idUtilisateur,
      },
      select: {
        id_utilisateur: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return this.prisma.avis.findMany({
      where: {
        id_auteur: idUtilisateur,
      },
      orderBy: {
        date_creation: 'desc',
      },
      include: {
        destinataire: {
          select: {
            id_utilisateur: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  // 4. Calculer la moyenne des notes reçues.
  async obtenirStatistiques(idUtilisateur: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: {
        id_utilisateur: idUtilisateur,
      },
      select: {
        id_utilisateur: true,
      },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const statistiques = await this.prisma.avis.aggregate({
      where: {
        id_destinataire: idUtilisateur,
      },
      _avg: {
        note: true,
      },
      _count: {
        id_avis: true,
      },
    });

    return {
      id_utilisateur: idUtilisateur,
      moyenne: statistiques._avg.note !== null
        ? Number(statistiques._avg.note.toFixed(2))
        : 0,
      nombreAvis: statistiques._count.id_avis,
    };
  }

  // Vérifier que l'avis existe et appartient à son auteur.
  private async verifierAuteur(
    idAvis: number,
    idAuteur: string,
  ) {
    const avis = await this.prisma.avis.findUnique({
      where: {
        id_avis: idAvis,
      },
    });

    if (!avis) {
      throw new NotFoundException('Avis introuvable.');
    }

    if (avis.id_auteur !== idAuteur) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier ou supprimer cet avis.',
      );
    }

    return avis;
  }

  // 5. Modifier son propre avis.
  async modifier(
    idAvis: number,
    idAuteur: string,
    dto: ModifierAvisDto,
  ) {
    await this.verifierAuteur(idAvis, idAuteur);

    const donnees: {
      note?: number;
      commentaire?: string | null;
    } = {};

    if (dto.note !== undefined) {
      donnees.note = dto.note;
    }

    if (dto.commentaire !== undefined) {
      donnees.commentaire = dto.commentaire.trim() || null;
    }

    if (Object.keys(donnees).length === 0) {
      throw new BadRequestException(
        'Aucune donnée à modifier.',
      );
    }

    return this.prisma.avis.update({
      where: {
        id_avis: idAvis,
      },
      data: donnees,
    });
  }

  // 6. Supprimer son propre avis.
  async supprimer(
    idAvis: number,
    idAuteur: string,
  ) {
    await this.verifierAuteur(idAvis, idAuteur);

    await this.prisma.avis.delete({
      where: {
        id_avis: idAvis,
      },
    });

    return {
      message: 'Avis supprimé avec succès.',
    };
  }
}
