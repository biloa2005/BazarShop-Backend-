
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  StatutAnnonce,
  TypeAnnonce,
} from '../generated/prisma/client';

import { CreerAnnonceDto } from './dto/creer-annonce.dto.js';
import { ModifierAnnonceDto } from './dto/modifier-annonce.dto';
import { FiltrerAnnonceDto } from './dto/filtrer-annonce.dto';

@Injectable()
export class AnnoncesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Vérifie que toutes les catégories existent.
  private async verifierCategories(ids?: number[]) {
    if (!ids || ids.length === 0) {
      return;
    }

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'Une catégorie ne peut pas être répétée.',
      );
    }

    const categories = await this.prisma.categorie.findMany({
      where: {
        id_categorie: { in: ids },
      },
      select: {
        id_categorie: true,
      },
    });

    if (categories.length !== ids.length) {
      throw new BadRequestException(
        'Une ou plusieurs catégories sont introuvables.',
      );
    }
  }

  // 1. Créer une annonce.
  async creer(
    idUtilisateur: string,
    dto: CreerAnnonceDto,
  ) {
    await this.verifierCategories(dto.categories);

    const { categories, ...donneesAnnonce } = dto;

    return this.prisma.annonce.create({
      data: {
        titre: donneesAnnonce.titre.trim(),
        description: donneesAnnonce.description.trim(),
        localisation: donneesAnnonce.localisation.trim(),
        prix: donneesAnnonce.prix,
        type: donneesAnnonce.type ?? TypeAnnonce.VENTE,

        // Le propriétaire vient du JWT vérifié.
        id_utilisateur: idUtilisateur,

        // Statut ACTIVE défini par défaut dans Prisma.
        ...(categories?.length
          ? {
              categories: {
                create: categories.map((id) => ({
                  categorie: {
                    connect: { id_categorie: id },
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        categories: {
          include: {
            categorie: true,
          },
        },
      },
    });
  }

  // 2. Lister les annonces actives avec filtres.
  async lister(dto: FiltrerAnnonceDto) {
    const page = dto.page ?? 1;
    const limite = dto.limite ?? 10;

    const where = {
      statut: StatutAnnonce.ACTIVE,
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.recherche?.trim()
        ? {
            OR: [
              {
                titre: {
                  contains: dto.recherche.trim(),
                },
              },
              {
                description: {
                  contains: dto.recherche.trim(),
                },
              },
              {
                localisation: {
                  contains: dto.recherche.trim(),
                },
              },
            ],
          }
        : {}),
    };

    const [annonces, total] = await this.prisma.$transaction([
      this.prisma.annonce.findMany({
        where,
        skip: (page - 1) * limite,
        take: limite,
        orderBy: {
          date_publication: 'desc',
        },
        include: {
          proprietaire: {
            select: {
              id_utilisateur: true,
              nom: true,
              prenom: true,
            },
          },
          photos: {
            orderBy: { ordre: 'asc' },
          },
          categories: {
            include: {
              categorie: true,
            },
          },
        },
      }),
      this.prisma.annonce.count({ where }),
    ]);

    return {
      donnees: annonces,
      pagination: {
        page,
        limite,
        total,
        totalPages: Math.ceil(total / limite),
      },
    };
  }

  // 3. Consulter une annonce active.
  async trouverParId(idAnnonce: string) {
    const annonce = await this.prisma.annonce.findFirst({
      where: {
        id_annonce: idAnnonce,
        statut: StatutAnnonce.ACTIVE,
      },
      include: {
        proprietaire: {
          select: {
            id_utilisateur: true,
            nom: true,
            prenom: true,
          },
        },
        photos: {
          orderBy: { ordre: 'asc' },
        },
        categories: {
          include: {
            categorie: true,
          },
        },
      },
    });

    if (!annonce) {
      throw new NotFoundException(
        'Annonce introuvable.',
      );
    }

    return annonce;
  }

  // 4. Lister les annonces du compte connecté.
  async mesAnnonces(idUtilisateur: string) {
    return this.prisma.annonce.findMany({
      where: {
        id_utilisateur: idUtilisateur,
      },
      orderBy: {
        date_publication: 'desc',
      },
      include: {
        photos: true,
        categories: {
          include: {
            categorie: true,
          },
        },
      },
    });
  }

  // Vérifie le propriétaire et retourne l'annonce.
  private async verifierProprietaire(
    idAnnonce: string,
    idUtilisateur: string,
  ) {
    const annonce = await this.prisma.annonce.findUnique({
      where: {
        id_annonce: idAnnonce,
      },
    });

    if (!annonce) {
      throw new NotFoundException(
        'Annonce introuvable.',
      );
    }

    if (annonce.id_utilisateur !== idUtilisateur) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier cette annonce.',
      );
    }

    return annonce;
  }

  // 5. Modifier une annonce appartenant à l'utilisateur.
  async modifier(
    idAnnonce: string,
    idUtilisateur: string,
    dto: ModifierAnnonceDto,
  ) {
    const annonce = await this.verifierProprietaire(
      idAnnonce,
      idUtilisateur,
    );

    if (annonce.statut !== StatutAnnonce.ACTIVE) {
      throw new BadRequestException(
        'Seules les annonces actives peuvent être modifiées.',
      );
    }

    await this.verifierCategories(dto.categories);

    const { categories, ...donnees } = dto;

    // La transaction évite de laisser les catégories
    // dans un état incohérent si une opération échoue.
    return this.prisma.$transaction(async (tx) => {
      const miseAJour: Record<string, unknown> = {};

      if (donnees.titre !== undefined) {
        miseAJour.titre = donnees.titre.trim();
      }

      if (donnees.description !== undefined) {
        miseAJour.description = donnees.description.trim();
      }

      if (donnees.localisation !== undefined) {
        miseAJour.localisation = donnees.localisation.trim();
      }

      if (donnees.prix !== undefined) {
        miseAJour.prix = donnees.prix;
      }

      if (donnees.type !== undefined) {
        miseAJour.type = donnees.type;
      }

      if (categories !== undefined) {
        await tx.annonceCategorie.deleteMany({
          where: { id_annonce: idAnnonce },
        });

        if (categories.length > 0) {
          await tx.annonceCategorie.createMany({
            data: categories.map((id) => ({
              id_annonce: idAnnonce,
              id_categorie: id,
            })),
          });
        }
      }

      return tx.annonce.update({
        where: { id_annonce: idAnnonce },
        data: miseAJour,
        include: {
          categories: {
            include: {
              categorie: true,
            },
          },
        },
      });
    });
  }

  // 6. Supprimer une annonce appartenant à l'utilisateur.
  async supprimer(
    idAnnonce: string,
    idUtilisateur: string,
  ) {
    await this.verifierProprietaire(
      idAnnonce,
      idUtilisateur,
    );

    await this.prisma.annonce.delete({
      where: {
        id_annonce: idAnnonce,
      },
    });

    return {
      message: 'Annonce supprimée avec succès.',
    };
  }
}
