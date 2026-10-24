
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
  IsArray,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeAnnonce } from '../generated/prisma/client.js';

export class CreerAnnonceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titre: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prix?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  localisation: string;

  @IsOptional()
  @IsEnum(TypeAnnonce)
  type?: TypeAnnonce;

  // Identifiants des catégories existantes.
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  categories?: number[];
}
