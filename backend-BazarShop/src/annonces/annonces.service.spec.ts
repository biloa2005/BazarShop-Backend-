import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AnnoncesService } from './annonces.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnnoncesService', () => {
  let service: AnnoncesService;
  let prisma: PrismaService;

  const mockPrisma = {
    categorie: {
      findMany: vi.fn(),
    },

    annonce: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },

    annonceCategorie: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },

    $transaction: vi.fn(),
  };

  const idUtilisateur = 'user-123';
  const idAnnonce = 'annonce-123';

  const dtoCreation = {
    titre: 'Samsung Galaxy S24',
    description: 'Téléphone en très bon état',
    prix: 350000,
    localisation: 'Douala, Akwa',
    type: 'VENTE',
    categories: [1],
  };

  const annonceExistante = {
    id_annonce: idAnnonce,
    titre: 'Ancien titre',
    description: 'Ancienne description',
    prix: 200000,
    localisation: 'Douala',
    type: 'VENTE',
    statut: 'ACTIVE',
    id_utilisateur: idUtilisateur,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnoncesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AnnoncesService>(AnnoncesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // =====================================
  // TESTS DE CREATION D'UNE ANNONCE
  // =====================================

  describe('creer', () => {
    it('devrait créer une annonce avec succès', async () => {
      const annonceCreee = {
        ...dtoCreation,
        id_annonce: idAnnonce,
        id_utilisateur: idUtilisateur,
      };

      mockPrisma.categorie.findMany.mockResolvedValue([
        { id_categorie: 1 },
      ]);

      mockPrisma.annonce.create.mockResolvedValue(annonceCreee);

      const resultat = await service.creer(
        idUtilisateur,
        dtoCreation as any,
      );

      expect(resultat).toEqual(annonceCreee);
      expect(mockPrisma.annonce.create).toHaveBeenCalled();
      expect(mockPrisma.annonce.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id_utilisateur: idUtilisateur,
          }),
        }),
      );
    });

    it('devrait refuser une catégorie inexistante', async () => {
      mockPrisma.categorie.findMany.mockResolvedValue([]);

      await expect(
        service.creer(idUtilisateur, dtoCreation as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.annonce.create).not.toHaveBeenCalled();
    });
  });

  // =====================================
  // TESTS DE MODIFICATION D'UNE ANNONCE
  // =====================================

  describe('modifier', () => {
    const dtoModification = {
      titre: 'Samsung Galaxy S24 Ultra',
      description: 'Téléphone comme neuf',
      prix: 400000,
      localisation: 'Douala, Bonamoussadi',
      categories: [1],
    };

    it('devrait modifier une annonce avec succès', async () => {
      mockPrisma.annonce.findUnique.mockResolvedValue(
        annonceExistante,
      );

      // Correction : Mock de la vérification des catégories lors de la modification
      mockPrisma.categorie.findMany.mockResolvedValue([
        { id_categorie: 1 },
      ]);

      mockPrisma.$transaction.mockImplementation(
        async (callback) => {
          return callback({
            annonceCategorie: {
              deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
              createMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            annonce: {
              update: vi.fn().mockResolvedValue({
                ...annonceExistante,
                ...dtoModification,
              }),
            },
          });
        },
      );

      const resultat = await service.modifier(
        idAnnonce,
        idUtilisateur,
        dtoModification as any,
      );

      expect(resultat).toEqual(
        expect.objectContaining({
          titre: dtoModification.titre,
          prix: dtoModification.prix,
        }),
      );

      expect(mockPrisma.annonce.findUnique).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('devrait refuser la modification si l’annonce n’existe pas', async () => {
      mockPrisma.annonce.findUnique.mockResolvedValue(null);

      await expect(
        service.modifier(
          idAnnonce,
          idUtilisateur,
          dtoModification as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait refuser la modification si l’utilisateur n’est pas propriétaire', async () => {
      mockPrisma.annonce.findUnique.mockResolvedValue({
        ...annonceExistante,
        id_utilisateur: 'autre-utilisateur',
      });

      await expect(
        service.modifier(
          idAnnonce,
          idUtilisateur,
          dtoModification as any,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('devrait refuser la modification d’une annonce non active', async () => {
      mockPrisma.annonce.findUnique.mockResolvedValue({
        ...annonceExistante,
        statut: 'VENDUE',
      });

      // Correction : Le service lève une BadRequestException et non une ForbiddenException
      await expect(
        service.modifier(
          idAnnonce,
          idUtilisateur,
          dtoModification as any,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});