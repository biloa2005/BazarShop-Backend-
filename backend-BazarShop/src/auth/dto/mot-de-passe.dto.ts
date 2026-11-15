import {
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class ReinitialiserMotDePasseDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @MaxLength(72, {
    message: 'Le mot de passe ne doit pas dépasser 72 caractères.',
  })
  nouveau_mot_de_passe: string;
}