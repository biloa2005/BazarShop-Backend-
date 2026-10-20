import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUtilisateurDto } from './create-utilisateur.dto.js';
import { UpdateUtilisateurDto } from './update-utilisateur.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UtilisateurService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUtilisateurDto: CreateUtilisateurDto) {
    // Vérification de l'unicité de l'email
    const emailExists = await this.prisma.utilisateur.findUnique({
      where: { email: createUtilisateurDto.email },
    });

    if (emailExists) {
      throw new ConflictException("Cet email est déjà utilisé.");
    }

    // Hashage du mot de passe
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUtilisateurDto.mot_de_passe, salt);

    // Création de l'utilisateur
    const nouvelUtilisateur = await this.prisma.utilisateur.create({
      data: {
        ...createUtilisateurDto,
        mot_de_passe: hashedPassword,
      },
    });

    // Retirer le mot de passe de la réponse par sécurité
    const { mot_de_passe, ...result } = nouvelUtilisateur;
    return result;
  }

  async findAll() {
    return this.prisma.utilisateur.findMany({
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
  }

  async findOne(id: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id_utilisateur: id },
    });

    if (!utilisateur) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable.`);
    }

    const { mot_de_passe, ...result } = utilisateur;
    return result;
  }

  async update(id: string, updateUtilisateurDto: UpdateUtilisateurDto) {
    // 1. Vérifier si l'utilisateur existe
    await this.findOne(id);

    // 2. Extraire les données dans un nouvel objet pour éviter les mutations directes strictes
    const updateData = { ...updateUtilisateurDto };

    // 3. Si le mot de passe est fourni, le hasher de manière isolée
    if (updateData.mot_de_passe) {
      const salt = await bcrypt.genSalt();
      updateData.mot_de_passe = await bcrypt.hash(updateData.mot_de_passe, salt);
    }

    // 4. Envoi des données nettoyées et typées à Prisma
    const utilisateurModifie = await this.prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data: updateData,
    });

    const { mot_de_passe, ...result } = utilisateurModifie;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    
    // Changement du statut à SUPPRIME plutôt qu'un hard delete
    return this.prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data: { statut_compte: 'SUPPRIME' },
    });
  }
}
