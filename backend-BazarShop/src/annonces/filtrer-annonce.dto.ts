
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeAnnonce } from '../generated/prisma/client.js';

export class FiltrerAnnonceDto {
  @IsOptional()
  @IsString()
  recherche?: string;

  @IsOptional()
  @IsEnum(TypeAnnonce)
  type?: TypeAnnonce;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 10;
}
