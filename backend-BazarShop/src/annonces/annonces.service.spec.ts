import { PrismaService } from "../prisma/prisma.service.js";
import { AnnoncesService } from "./annonces.service.js";

describe('AnnoncesService',()=>{
  let: sevice: AnnoncesService,
  let prisma: PrismaService,
  //simula de prisma
  const mockPrisma = {
    categorie:{
      findMany:jest.fn()
    },
    annonce:{
      create:jest.fn(),
      findUnique:jest.fn(),
      update:jest.fn()
    },
    annonceCategorie:{
      deleteMany:jest.fn(),
      createMany:jest.fn()
    },
    $transaction:jest.fn()
  };
  const idUtilisateur='user-123',
  const idAnnonce='annonce-123'
  const dtoCreation={
    titre:"Samsung galaxy S24",
    description:'telephone en tres bonne etat..',
    prix:350000,
    localication:'douala, cameroun',
    type:'VENTE',
    categorie:[1]
  };
  const annonceExistante={
    idAnnonce:idAnnonce,
    titre:'ancien titre',
    description:'ancienne description',
    prix:200000,
    localisation:'douala',
    type:'VENTE',
    statut:'ACTIVE',
    id_utilisateur:idUtilisateur

  };
  beforeEach(async()=>{})
})