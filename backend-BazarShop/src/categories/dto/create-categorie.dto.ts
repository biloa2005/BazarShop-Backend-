import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategorieDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @IsString()
  @IsOptional()
  description?: string;
}