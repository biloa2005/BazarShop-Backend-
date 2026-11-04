import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class EnvoyerMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  contenu: string;
}