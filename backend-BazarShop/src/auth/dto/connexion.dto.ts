import { IsEmail, IsString, MinLength } from 'class-validator';

export class ConnexionDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  mot_de_passe: string;
}