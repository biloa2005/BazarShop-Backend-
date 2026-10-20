import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Role, StatutCompte } from '../generated/prisma/enums.js'; 

export class CreateUtilisateurDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  nom: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  prenom: string;

  @IsEmail()
  @IsNotEmpty()
  @Length(1, 191)
  email: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  telephone?: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 255)
  mot_de_passe: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(StatutCompte)
  @IsOptional()
  statut_compte?: StatutCompte;
}
