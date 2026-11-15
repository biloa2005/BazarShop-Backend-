import { PartialType } from '@nestjs/mapped-types';
import { CreateCategorieDto } from './create-categorie.dto.js';

export class UpdateCategorieDto extends PartialType(CreateCategorieDto) {}