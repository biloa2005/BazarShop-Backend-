import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategorieDto } from './dto/create-categorie.dto.js';
import { UpdateCategorieDto } from './dto/update-categorie.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategorieDto: CreateCategorieDto) {
    try {
      return await this.prisma.categorie.create({
        data: createCategorieDto,
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Une catégorie avec ce nom existe déjà.');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.categorie.findMany({
      include: {
        _count: {
          select: { annonces: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const categorie = await this.prisma.categorie.findUnique({
      where: { id_categorie: id },
      include: {
        annonces: {
          include: {
            annonce: true,
          },
        },
      },
    });

    if (!categorie) {
      throw new NotFoundException(`Catégorie avec l'ID ${id} introuvable.`);
    }

    return categorie;
  }

  async update(id: number, updateCategorieDto: UpdateCategorieDto) {
    await this.findOne(id); // Vérifie l'existence

    try {
      return await this.prisma.categorie.update({
        where: { id_categorie: id },
        data: updateCategorieDto,
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Une catégorie avec ce nom existe déjà.');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id); // Vérifie l'existence

    return this.prisma.categorie.delete({
      where: { id_categorie: id },
    });
  }
}