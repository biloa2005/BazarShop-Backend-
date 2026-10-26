import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AnnoncesService } from './annonces.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StatutAnnonce, TypeAnnonce } from '../generated/prisma/client.js';

// Configuration du Mock de Prisma
const mockPrismaService = {
  categorie: {
    findMany: jest.fn(),
  },
  annonce: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  annonceCategorie: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrismaService);
    }
    return Promise.all(callback); // Gère le format tableau de $transaction
  }),
};

describe('AnnoncesService', () => {
  let service: AnnoncesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnoncesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnnoncesService>(AnnoncesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('creer', () => {
    it('devrait créer une annonce avec succès', async () => {
      const dto = {
        titre: ' Superbe Appartement ',
        description: 'Description ici',
        localisation: 'Yaoundé',
        prix: 150000,
        type: TypeAnnonce.VENTE,
        categories:,
      };

      // Mock de la vérification des catégories
      mockPrismaService.categorie.findMany.mockResolvedValue([{ id_categorie: 1 }, { id_categorie: 2 }]);
      mockPrismaService.annonce.create.mockResolvedValue({ id_annonce: '1', ...dto });

      const resultat = await service.creer('user-123', dto);

      expect(prisma.categorie.findMany).toHaveBeenCalled();
      expect(prisma.annonce.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            titre: 'Superbe Appartement', // Vérifie le .trim()
            id_utilisateur: 'user-123',
          }),
        }),
      );
      expect(resultat).toBeDefined();
    });

    it('devrait lever une erreur si des catégories sont dupliquées', async () => {
      const dto = { titre: 'Titre', description: 'Desc', localisation: 'Loc', prix: 100, categories: [1, 1] };

      await expect(service.creer('user-123', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('lister', () => {
    it('devrait retourner les données paginées', async () => {
      const dto = { page: 1, limite: 2, recherche: 'Immeuble' };
      const annoncesSimulees = [{ id_annonce: '1', titre: 'Immeuble' }];
      
      mockPrismaService.annonce.findMany.mockResolvedValue(annoncesSimulees);
      mockPrismaService.annonce.count.mockResolvedValue(1);

      const resultat = await service.lister(dto);

      expect(resultat).toEqual({
        donnees: annoncesSimulees,
        pagination: {
          page: 1,
          limite: 2,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('modifier', () => {
    it('devrait modifier l\'annonce si l\'utilisateur est le propriétaire', async () => {
      const dto = { titre: 'Nouveau Titre' };
      const annonceExistante = { id_annonce: '1', id_utilisateur: 'owner-id', statut: StatutAnnonce.ACTIVE };

      mockPrismaService.annonce.findUnique.mockResolvedValue(annonceExistante);
      mockPrismaService.annonce.update.mockResolvedValue({ ...annonceExistante, titre: 'Nouveau Titre' });

      const resultat = await service.modifier('1', 'owner-id', dto);

      expect(prisma.annonce.update).toHaveBeenCalled();
      expect(resultat.titre).toBe('Nouveau Titre');
    });

    it('devrait lever une erreur Forbidden si l\'utilisateur n\'est pas le propriétaire', async () => {
      const annonceExistante = { id_annonce: '1', id_utilisateur: 'owner-id', statut: StatutAnnonce.ACTIVE };
      mockPrismaService.annonce.findUnique.mockResolvedValue(annonceExistante);

      await expect(service.modifier('1', 'hacker-id', { titre: 'Hack' })).rejects.toThrow(ForbiddenException);
    });

    it('devrait lever une erreur NotFound si l\'annonce n\'existe pas', async () => {
      mockPrismaService.annonce.findUnique.mockResolvedValue(null);

      await expect(service.modifier('999', 'user-id', { titre: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });
});
